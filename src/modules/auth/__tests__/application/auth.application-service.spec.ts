import { Test, TestingModule } from '@nestjs/testing';

import * as hashUtil from '../../../../common/utils/hash.util';
import { AssetEntity } from '../../../../modules/asset/domain/entities/asset/asset.entity';
import { AuthApplicationService } from '../../application/application-services/auth.application-service';
import {
    ACCOUNT_REPO_TOKEN,
    IAccountRepository,
} from '../../application/contracts/account-repository.contract';
import {
    ASSET_SERVICE_TOKEN,
    IAssetService,
} from '../../application/contracts/asset-service.contract';
import {
    USER_REPO_TOKEN,
    IUserRepository,
} from '../../application/contracts/user-repository.contract';
import {
    AccountNotFoundException,
    InvalidCredentialsException,
} from '../../application/exceptions/auth.exception';
import { ACCOUNT_PROVIDER } from '../../domain/entities/account/account-provider.value-object';
import { AuthTestFactory } from '../factories/auth.factory';
import { createMockAccountRepository } from '../mocks/repositories/account.repository.mock';
import { createMockUserRepository } from '../mocks/repositories/user.repository.mock';
import { createMockAssetService } from '../mocks/services/asset.service.mock';

// Mock hash utility functions
jest.mock('../../../../commons/utils/hash.util', () => ({
    generateHash: jest.fn(),
    validateHashString: jest.fn(),
}));

describe('AuthApplicationService', () => {
    let service: AuthApplicationService;
    let accountRepo: jest.Mocked<IAccountRepository>;
    let userRepo: jest.Mocked<IUserRepository>;
    let assetService: jest.Mocked<IAssetService>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthApplicationService,
                {
                    provide: ACCOUNT_REPO_TOKEN,
                    useValue: createMockAccountRepository(),
                },
                {
                    provide: USER_REPO_TOKEN,
                    useValue: createMockUserRepository(),
                },
                {
                    provide: ASSET_SERVICE_TOKEN,
                    useValue: createMockAssetService(),
                },
            ],
        }).compile();

        service = module.get<AuthApplicationService>(AuthApplicationService);
        accountRepo = module.get(ACCOUNT_REPO_TOKEN);
        userRepo = module.get(USER_REPO_TOKEN);
        assetService = module.get(ASSET_SERVICE_TOKEN);

        // Reset all mocks before each test
        jest.clearAllMocks();
    });

    describe('localLogin', () => {
        it('should authenticate user with valid credentials', async () => {
            // Arrange
            const loginPayload = AuthTestFactory.createLoginPayload();
            const mockAccount = AuthTestFactory.createMockAccountEntity({
                email: loginPayload.email,
                password: 'hashed-password',
            });

            accountRepo.findOne.mockResolvedValue(mockAccount);
            (hashUtil.validateHashString as jest.Mock).mockResolvedValue(true);

            // Act
            const result = await service.localLogin(loginPayload);

            expect(hashUtil.validateHashString).toHaveBeenCalledWith(
                loginPayload.password,
                expect.any(String),
            );
            expect(result).toBeDefined();
            expect(result.email).toBe(loginPayload.email);
        });

        it('should throw AccountNotFoundException when user not found', async () => {
            // Arrange
            const loginPayload = AuthTestFactory.createLoginPayload();
            accountRepo.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(service.localLogin(loginPayload)).rejects.toThrow(
                AccountNotFoundException,
            );
            expect(hashUtil.validateHashString).not.toHaveBeenCalled();
        });

        it('should throw InvalidCredentialsException with wrong password', async () => {
            // Arrange
            const loginPayload = AuthTestFactory.createLoginPayload();
            const mockAccount = AuthTestFactory.createMockAccountEntity({
                email: loginPayload.email,
                password: 'hashed-password',
            });

            accountRepo.findOne.mockResolvedValue(mockAccount);
            (hashUtil.validateHashString as jest.Mock).mockResolvedValue(false);

            // Act & Assert
            await expect(service.localLogin(loginPayload)).rejects.toThrow(
                InvalidCredentialsException,
            );
            expect(hashUtil.validateHashString).toHaveBeenCalledWith(
                loginPayload.password,
                expect.any(String),
            );
        });
    });

    describe('googleLogin', () => {
        it('should create new account for first-time Google user', async () => {
            // Arrange
            const googlePayload = AuthTestFactory.createGoogleLoginPayload();
            accountRepo.findOne.mockResolvedValue(null);
            accountRepo.insert.mockResolvedValue();

            // Act
            const result = await service.googleLogin(googlePayload);

            // Assert
            expect(accountRepo.findOne).toHaveBeenCalledWith({
                email: expect.anything(),
                provider: expect.anything(),
            });
            expect(accountRepo.insert).toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.email).toBe(googlePayload.email);
        });

        it('should return existing account for returning Google user', async () => {
            // Arrange
            const googlePayload = AuthTestFactory.createGoogleLoginPayload();
            const existingAccount = AuthTestFactory.createMockAccountEntity({
                email: googlePayload.email,
                provider: ACCOUNT_PROVIDER.GOOGLE,
            });

            accountRepo.findOne.mockResolvedValue(existingAccount);

            // Act
            const result = await service.googleLogin(googlePayload);

            // Assert
            expect(accountRepo.findOne).toHaveBeenCalledWith({
                email: expect.anything(),
                provider: expect.anything(),
            });
            expect(accountRepo.insert).not.toHaveBeenCalled();
            expect(result).toBeDefined();
            expect(result.email).toBe(googlePayload.email);
        });
    });

    describe('register', () => {
        it('should register user with all required data', async () => {
            // Arrange
            const registerPayload = AuthTestFactory.createRegisterPayload();
            const mockAsset = AuthTestFactory.createMockAssetEntity();

            assetService.createAsset.mockResolvedValue(
                mockAsset as unknown as AssetEntity,
            );
            (hashUtil.generateHash as jest.Mock).mockReturnValue(
                'hashed-password',
            );
            userRepo.insert.mockResolvedValue();
            accountRepo.insert.mockResolvedValue();

            // Act
            await service.register(registerPayload);

            // Assert
            expect(assetService.createAsset).toHaveBeenCalledWith({
                ...registerPayload.avatar,
                assetType: expect.any(String),
            });
            expect(hashUtil.generateHash).toHaveBeenCalledWith(
                registerPayload.password,
            );
            expect(userRepo.insert).toHaveBeenCalled();
            expect(accountRepo.insert).toHaveBeenCalled();
        });

        it('should execute register method with mocked @Transactional decorator', async () => {
            // Arrange
            const registerPayload = AuthTestFactory.createRegisterPayload();
            const mockAsset = AuthTestFactory.createMockAssetEntity();
            const registerSpy = jest.spyOn(service, 'register');

            assetService.createAsset.mockResolvedValue(
                mockAsset as unknown as AssetEntity,
            );
            (hashUtil.generateHash as jest.Mock).mockReturnValue(
                'hashed-password',
            );
            userRepo.insert.mockResolvedValue();
            accountRepo.insert.mockResolvedValue();

            // Act
            await service.register(registerPayload);

            // Assert
            expect(registerSpy).toHaveBeenCalledWith(registerPayload);
            // Verify the transaction completes successfully
            expect(userRepo.insert).toHaveBeenCalled();
            expect(accountRepo.insert).toHaveBeenCalled();
        });

        it('should handle asset creation failure', async () => {
            // Arrange
            const registerPayload = AuthTestFactory.createRegisterPayload();
            const assetError = new Error('Asset creation failed');

            assetService.createAsset.mockRejectedValue(assetError);

            // Act & Assert
            await expect(service.register(registerPayload)).rejects.toThrow(
                'Asset creation failed',
            );
            expect(assetService.createAsset).toHaveBeenCalled();
            expect(userRepo.insert).not.toHaveBeenCalled();
            expect(accountRepo.insert).not.toHaveBeenCalled();
        });

        it('should handle user repository insertion failure', async () => {
            // Arrange
            const registerPayload = AuthTestFactory.createRegisterPayload();
            const mockAsset = AuthTestFactory.createMockAssetEntity();
            const userInsertError = new Error('User insertion failed');

            assetService.createAsset.mockResolvedValue(
                mockAsset as unknown as AssetEntity,
            );
            (hashUtil.generateHash as jest.Mock).mockReturnValue(
                'hashed-password',
            );
            userRepo.insert.mockRejectedValue(userInsertError);

            // Act & Assert
            await expect(service.register(registerPayload)).rejects.toThrow(
                'User insertion failed',
            );
            expect(userRepo.insert).toHaveBeenCalled();
            expect(accountRepo.insert).not.toHaveBeenCalled();
        });

        it('should handle account repository insertion failure', async () => {
            // Arrange
            const registerPayload = AuthTestFactory.createRegisterPayload();
            const mockAsset = AuthTestFactory.createMockAssetEntity();
            const accountInsertError = new Error('Account insertion failed');

            assetService.createAsset.mockResolvedValue(
                mockAsset as unknown as AssetEntity,
            );
            (hashUtil.generateHash as jest.Mock).mockReturnValue(
                'hashed-password',
            );
            userRepo.insert.mockResolvedValue();
            accountRepo.insert.mockRejectedValue(accountInsertError);

            // Act & Assert
            await expect(service.register(registerPayload)).rejects.toThrow(
                'Account insertion failed',
            );
            expect(userRepo.insert).toHaveBeenCalled();
            expect(accountRepo.insert).toHaveBeenCalled();
        });
    });
});
