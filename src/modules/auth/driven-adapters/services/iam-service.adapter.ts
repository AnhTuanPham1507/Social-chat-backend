import { CreateUserRequestDTO } from '@infras/external-services';
import { KeycloakApiClient } from '@infras/external-services/api-clients/keycloak-api-client';
import { IIAMService } from '@modules/auth/application/contracts/iam-service.contract';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IAMServiceAdapter implements IIAMService {
    constructor(private readonly keycloakService: KeycloakApiClient) {}

    public async getSigningKey(kid: string): Promise<string> {
        return this.keycloakService.getPublicKey(kid);
    }

    public async createUser(user: CreateUserRequestDTO): Promise<void> {
        return this.keycloakService.createUser(user);
    }
}
