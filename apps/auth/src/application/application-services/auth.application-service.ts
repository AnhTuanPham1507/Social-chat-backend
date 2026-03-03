import { Inject, Injectable, Logger } from '@nestjs/common';

import { AuthTokens, ExchangeTokenInput } from '../dtos/auth.dto';
import {
  IAM_SERVICE_TOKEN,
  IIAMService,
} from '../contracts/iam-service.contract';
import {
  IUserRepository,
  USER_REPO_TOKEN,
} from '../contracts/user-repository.contract';
import { EVENT_PUBLISHER, IEventPublisher, UserEntity } from '@social-chat/domain';
import { IIdTokenPayload } from '@application/dtos/jwt.dto';

export const AUTH_APPLICATION_SERVICE_TOKEN = 'AUTH_APPLICATION_SERVICE_TOKEN';

export interface IAuthApplicationService {
  authCallback(payload: ExchangeTokenInput, clientId?: string): Promise<AuthTokens>;
}

/**
 * Auth Application Service
 *
 * Orchestrates authentication flows including:
 * - OAuth2 code exchange
 * - ID token verification
 * - Internal user creation with domain events
 *
 * Following DDD principles:
 * - Application services only orchestrate, no business logic
 * - Domain events are published after successful persistence
 * - Business logic lives in domain entities (UserEntity.create())
 */
@Injectable()
export class AuthApplicationService implements IAuthApplicationService {
  private readonly logger = new Logger(AuthApplicationService.name);

  constructor(
    @Inject(USER_REPO_TOKEN)
    private readonly _userRepo: IUserRepository,

    @Inject(IAM_SERVICE_TOKEN)
    private readonly _iamService: IIAMService,

    @Inject(EVENT_PUBLISHER)
    private readonly _eventPublisher: IEventPublisher,
  ) {}

  /**
   * Handles OAuth2 callback flow.
   *
   * 1. Exchanges authorization code for tokens
   * 2. Verifies ID token
   * 3. Creates internal user if not exists (emits UserCreatedEvent)
   *
   * @param payload - Contains authorization code and redirect URI
   * @returns Authentication tokens (access, refresh, id)
   */
  public async authCallback(payload: ExchangeTokenInput): Promise<AuthTokens> {
    // 1. Exchange code for tokens via IAM service
    const authTokens = await this._iamService.exchangeCodeForToken(payload);

    // 2. Verify ID token to get user claims
    const idTokenPayload = await this._iamService.verifyToken<IIdTokenPayload>(
      authTokens.idToken,
    );

    // 3. Create internal user if not exists
    await this._createInternalUser(idTokenPayload);

    return authTokens;
  }

  /**
   * Creates an internal user from OAuth2 claims.
   *
   * Flow:
   * 1. Create UserEntity using factory method (business logic + event emission)
   * 2. Check if user already exists by email
   * 3. If not exists: persist and publish domain events
   *
   * @param payload - ID token claims containing user info
   */
  private async _createInternalUser(payload: IIdTokenPayload): Promise<void> {
    // 1. Create user entity using factory method
    // This applies business validation and emits UserCreatedEvent
    const userEntity = UserEntity.create({
      email: payload.email,
      fullName: payload.name || 'Unknown',
    });

    const email = userEntity.email.value;

    // 2. Check if user already exists
    const existingUser = await this._userRepo.findByEmail(email);

    if (existingUser) {
      this.logger.debug(`User already exists with email: ${email}`);
      // Clear events since we're not persisting
      userEntity.clearDomainEvents();
      return;
    }

    // 3. Persist new user
    await this._userRepo.insert(userEntity);

    // 4. Publish domain events after successful persistence
    // This ensures events are only published for committed transactions
    await this._eventPublisher.publishAll(userEntity.domainEvents);

    // 5. Clear events from entity (already published)
    userEntity.clearDomainEvents();

    this.logger.log(`Created new user with email: ${email}, id: ${userEntity.id}`);
  }
}
