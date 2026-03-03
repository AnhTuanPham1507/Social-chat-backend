import { Test, TestingModule } from '@nestjs/testing';

import { IAM_SERVICE_TOKEN, IIAMService } from '../contracts/iam-service.contract';
import { IUserRepository, USER_REPO_TOKEN } from '../contracts/user-repository.contract';
import { AuthTokens, ExchangeTokenInput } from '../dtos/auth.dto';
import { IIdTokenpayload } from '../dtos/jwt.dto';

import { AuthApplicationService } from './auth.application-service';

describe('AuthApplicationService', () => {
    let service: AuthApplicationService;
    let mockIamService: jest.Mocked<IIAMService>;
    let mockUserRepo: jest.Mocked<IUserRepository>;

    const mockAuthTokens: AuthTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        idToken: 'mock-id-token',
        expiresIn: 3600,
        refreshExpiresIn: 86400,
    };

    const mockIdTokenPayload: IIdTokenpayload = {
        email: 'test@example.com',
        full_name: 'Test User',
        sub: 'user-123',
        iss: 'https://issuer.com',
        aud: 'client-id',
        exp: Math.floor(Date.now() / 1000) + 3600,
        iat: Math.floor(Date.now() / 1000),
    };

    beforeEach(async () => {
        mockIamService = {
            exchangeCodeForToken: jest.fn(),
            verifyToken: jest.fn(),
            refreshToken: jest.fn(),
            getLogoutUrl: jest.fn(),
            getAuthorizationUrl: jest.fn(),
        };

        mockUserRepo = {
            insert: jest.fn(),
            findByEmail: jest.fn(),
            findById: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthApplicationService,
                {
                    provide: IAM_SERVICE_TOKEN,
                    useValue: mockIamService,
                },
                {
                    provide: USER_REPO_TOKEN,
                    useValue: mockUserRepo,
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

        it('should exchange code for tokens and create a new user', async () => {
            mockIamService.exchangeCodeForToken.mockResolvedValue(mockAuthTokens);
            mockIamService.verifyToken.mockResolvedValue(mockIdTokenPayload);
            mockUserRepo.findByEmail.mockResolvedValue(null);
            mockUserRepo.insert.mockResolvedValue(undefined);

            const result = await service.authCallback(exchangeTokenInput);

            expect(result).toEqual(mockAuthTokens);
            expect(mockIamService.exchangeCodeForToken).toHaveBeenCalledWith(exchangeTokenInput);
            expect(mockIamService.verifyToken).toHaveBeenCalledWith(mockAuthTokens.idToken);
            expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockIdTokenPayload.email);
            expect(mockUserRepo.insert).toHaveBeenCalled();
        });

        it('should not create user if already exists', async () => {
            const existingUser = {
                id: 'existing-user-id',
                email: { value: 'test@example.com' },
            };

            mockIamService.exchangeCodeForToken.mockResolvedValue(mockAuthTokens);
            mockIamService.verifyToken.mockResolvedValue(mockIdTokenPayload);
            mockUserRepo.findByEmail.mockResolvedValue(existingUser as any);

            const result = await service.authCallback(exchangeTokenInput);

            expect(result).toEqual(mockAuthTokens);
            expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(mockIdTokenPayload.email);
            expect(mockUserRepo.insert).not.toHaveBeenCalled();
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
    });
});
