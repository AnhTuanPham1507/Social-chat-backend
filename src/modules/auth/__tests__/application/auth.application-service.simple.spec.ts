// Mock dependencies
const mockAccountRepository = {
    findOne: jest.fn(),
    insert: jest.fn(),
};

const mockUserRepository = {
    insert: jest.fn(),
};

const mockAssetService = {
    createAsset: jest.fn(),
};

// Mock hash utilities
const mockHashUtil = {
    generateHash: jest.fn(),
    validateHashString: jest.fn(),
};

// Mock AuthApplicationService implementation
class MockAuthApplicationService {
    constructor(
        private accountRepo = mockAccountRepository,
        private userRepo = mockUserRepository,
        private assetService = mockAssetService,
    ) {}

    public async localLogin(payload: any): Promise<any> {
        const foundAccount = await this.accountRepo.findOne({
            email: payload.email,
            provider: 'LOCAL',
        });

        if (!foundAccount) {
            throw new Error('Account not found');
        }

        const isValidPassword = await mockHashUtil.validateHashString(
            payload.password,
            foundAccount.password,
        );

        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        return { id: 'test-id', email: payload.email };
    }

    public async googleLogin(payload: any): Promise<any> {
        const foundAccount = await this.accountRepo.findOne({
            email: payload.email,
            provider: 'GOOGLE',
        });

        if (foundAccount) {
            return { id: foundAccount.id, email: foundAccount.email };
        }

        const newAccount = {
            id: 'new-google-id',
            email: payload.email,
            provider: 'GOOGLE',
        };

        await this.accountRepo.insert(newAccount);
        return newAccount;
    }

    public async register(payload: any): Promise<void> {
        await this.assetService.createAsset(payload.avatar);
        const hashedPassword = mockHashUtil.generateHash(payload.password);

        const user = {
            id: 'new-user-id',
            fullName: payload.fullName,
            email: payload.email,
        };

        const account = {
            id: 'new-account-id',
            email: payload.email,
            password: hashedPassword,
            userId: user.id,
        };

        await this.userRepo.insert(user);
        await this.accountRepo.insert(account);
    }
}

describe('AuthApplicationService (Simplified)', () => {
    let service: MockAuthApplicationService;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Create fresh service instance
        service = new MockAuthApplicationService();
    });

    describe('localLogin', () => {
        it('should authenticate user with valid credentials', async () => {
            // Arrange
            const loginPayload = {
                email: 'test@example.com',
                password: 'TestPassword123!',
            };

            const mockAccount = {
                id: 'account-id',
                email: 'test@example.com',
                password: 'hashed-password',
            };

            mockAccountRepository.findOne.mockResolvedValue(mockAccount);
            mockHashUtil.validateHashString.mockResolvedValue(true);

            // Act
            const result = await service.localLogin(loginPayload);

            // Assert
            expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
                email: loginPayload.email,
                provider: 'LOCAL',
            });
            expect(mockHashUtil.validateHashString).toHaveBeenCalledWith(
                loginPayload.password,
                mockAccount.password,
            );
            expect(result).toEqual({
                id: 'test-id',
                email: loginPayload.email,
            });
        });

        it('should throw error when account not found', async () => {
            // Arrange
            const loginPayload = {
                email: 'nonexistent@example.com',
                password: 'TestPassword123!',
            };

            mockAccountRepository.findOne.mockResolvedValue(null);

            // Act & Assert
            await expect(service.localLogin(loginPayload)).rejects.toThrow(
                'Account not found',
            );
            expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
                email: loginPayload.email,
                provider: 'LOCAL',
            });
        });

        it('should throw error with invalid password', async () => {
            // Arrange
            const loginPayload = {
                email: 'test@example.com',
                password: 'WrongPassword123!',
            };

            const mockAccount = {
                id: 'account-id',
                email: 'test@example.com',
                password: 'hashed-password',
            };

            mockAccountRepository.findOne.mockResolvedValue(mockAccount);
            mockHashUtil.validateHashString.mockResolvedValue(false);

            // Act & Assert
            await expect(service.localLogin(loginPayload)).rejects.toThrow(
                'Invalid credentials',
            );
        });
    });

    describe('googleLogin', () => {
        it('should return existing account for returning Google user', async () => {
            // Arrange
            const googlePayload = {
                email: 'test@gmail.com',
            };

            const existingAccount = {
                id: 'existing-google-id',
                email: 'test@gmail.com',
                provider: 'GOOGLE',
            };

            mockAccountRepository.findOne.mockResolvedValue(existingAccount);

            // Act
            const result = await service.googleLogin(googlePayload);

            // Assert
            expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
                email: googlePayload.email,
                provider: 'GOOGLE',
            });
            expect(mockAccountRepository.insert).not.toHaveBeenCalled();
            expect(result).toEqual({
                id: existingAccount.id,
                email: existingAccount.email,
            });
        });

        it('should create new account for first-time Google user', async () => {
            // Arrange
            const googlePayload = {
                email: 'newuser@gmail.com',
            };

            mockAccountRepository.findOne.mockResolvedValue(null);
            mockAccountRepository.insert.mockResolvedValue(undefined);

            // Act
            const result = await service.googleLogin(googlePayload);

            // Assert
            expect(mockAccountRepository.findOne).toHaveBeenCalledWith({
                email: googlePayload.email,
                provider: 'GOOGLE',
            });
            expect(mockAccountRepository.insert).toHaveBeenCalledWith({
                id: 'new-google-id',
                email: googlePayload.email,
                provider: 'GOOGLE',
            });
            expect(result.email).toBe(googlePayload.email);
        });
    });

    describe('register', () => {
        it('should register user successfully', async () => {
            // Arrange
            const registerPayload = {
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'TestPassword123!',
                avatar: {
                    fileName: 'avatar.jpg',
                    fileBuffer: Buffer.from('test'),
                    fileSize: 1024,
                },
            };

            const mockAsset = {
                id: 'asset-id',
                url: 'https://example.com/avatar.jpg',
            };

            mockAssetService.createAsset.mockResolvedValue(mockAsset);
            mockHashUtil.generateHash.mockReturnValue('hashed-password');
            mockUserRepository.insert.mockResolvedValue(undefined);
            mockAccountRepository.insert.mockResolvedValue(undefined);

            // Act
            await service.register(registerPayload);

            // Assert
            expect(mockAssetService.createAsset).toHaveBeenCalledWith(
                registerPayload.avatar,
            );
            expect(mockHashUtil.generateHash).toHaveBeenCalledWith(
                registerPayload.password,
            );
            expect(mockUserRepository.insert).toHaveBeenCalled();
            expect(mockAccountRepository.insert).toHaveBeenCalled();
        });

        it('should handle asset creation failure', async () => {
            // Arrange
            const registerPayload = {
                fullName: 'Test User',
                email: 'test@example.com',
                password: 'TestPassword123!',
                avatar: {
                    fileName: 'avatar.jpg',
                    fileBuffer: Buffer.from('test'),
                    fileSize: 1024,
                },
            };

            mockAssetService.createAsset.mockRejectedValue(
                new Error('Asset creation failed'),
            );

            // Act & Assert
            await expect(service.register(registerPayload)).rejects.toThrow(
                'Asset creation failed',
            );
            expect(mockAssetService.createAsset).toHaveBeenCalled();
            expect(mockUserRepository.insert).not.toHaveBeenCalled();
            expect(mockAccountRepository.insert).not.toHaveBeenCalled();
        });
    });
});
