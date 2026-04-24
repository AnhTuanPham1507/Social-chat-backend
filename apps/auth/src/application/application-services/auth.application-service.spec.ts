import { Test, TestingModule } from '@nestjs/testing';

import { IAM_SERVICE_TOKEN, IIAMService } from '../contracts/iam-service.contract';
import { IUserService, USER_SERVICE_TOKEN } from '../contracts/user-service.contract';
import { AuthTokens, ExchangeTokenInput } from '../dtos/auth.dto';
import { IIdTokenPayload } from '../dtos/jwt.dto';

import { AuthApplicationService } from './auth.application-service';

describe('AuthApplicationService', () => {
    let service: AuthApplicationService;
    let mockIamService: jest.Mocked<IIAMService>;
    let mockUserService: jest.Mocked<IUserService>;

    const mockAuthTokens: AuthTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        idToken: 'mock-id-token',
        expiresIn: 3600,
        refreshExpiresIn: 86400,
    };

    const mockIdTokenPayload: IIdTokenPayload = {
        sub: 'keycloak-user-uuid',
        email: 'test@example.com',
        name: 'Test User',
    };

    beforeEach(async () => {
        mockIamService = {
            exchangeCodeForToken: jest.fn(),
            verifyToken: jest.fn(),
            refreshToken: jest.fn(),
            getLogoutUrl: jest.fn(),
            getAuthorizationUrl: jest.fn(),
        };

        mockUserService = {
            createUser: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthApplicationService,
                {
                    provide: IAM_SERVICE_TOKEN,
                    useValue: mockIamService,
                },
                {
                    provide: USER_SERVICE_TOKEN,
                    useValue: mockUserService,
                },
            ],
        }).compile();

        service = module.get<AuthApplicationService>(AuthApplicationService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('authCallback', () => {
        const exchangeTokenInput: ExchangeTokenInput = {
            code: 'auth-code-123',
            state: {
                redirectUri: 'http://localhost:3000/callback',
                clientId: 'web-client',
            },
        };

        it('should exchange code for tokens and create user via user service', async () => {
            mockIamService.exchangeCodeForToken.mockResolvedValue(mockAuthTokens);
            mockIamService.verifyToken.mockResolvedValue(mockIdTokenPayload);
            mockUserService.createUser.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                fullName: 'Test User',
            });

            const result = await service.authCallback(exchangeTokenInput);

            expect(result).toEqual(mockAuthTokens);
            expect(mockIamService.exchangeCodeForToken).toHaveBeenCalledWith(exchangeTokenInput);
            expect(mockIamService.verifyToken).toHaveBeenCalledWith(mockAuthTokens.idToken);
            expect(mockUserService.createUser).toHaveBeenCalledWith(
                mockIdTokenPayload.sub,
                mockIdTokenPayload.email,
                mockIdTokenPayload.name,
            );
        });

        it('should throw error when code exchange fails', async () => {
            const error = new Error('Invalid authorization code');
            mockIamService.exchangeCodeForToken.mockRejectedValue(error);

            await expect(service.authCallback(exchangeTokenInput)).rejects.toThrow(
                'Invalid authorization code',
            );
        });

        it('should throw error when token verification fails', async () => {
            mockIamService.exchangeCodeForToken.mockResolvedValue(mockAuthTokens);
            mockIamService.verifyToken.mockRejectedValue(new Error('Token expired'));

            await expect(service.authCallback(exchangeTokenInput)).rejects.toThrow('Token expired');
        });

        it('should throw error when user service is unavailable', async () => {
            mockIamService.exchangeCodeForToken.mockResolvedValue(mockAuthTokens);
            mockIamService.verifyToken.mockResolvedValue(mockIdTokenPayload);
            mockUserService.createUser.mockRejectedValue(new Error('Service unavailable'));

            await expect(service.authCallback(exchangeTokenInput)).rejects.toThrow(
                'Service unavailable',
            );
        });
    });
});
