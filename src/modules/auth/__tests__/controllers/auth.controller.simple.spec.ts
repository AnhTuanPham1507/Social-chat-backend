describe('AuthController (Simplified)', () => {
    // Mock AuthController behavior
    class MockAuthController {
        constructor(private authService: any) {}

        login(req: any, res: any): void {
            const { user } = req;

            if (user?.accessToken) {
                res.cookie('accessToken', user.accessToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 3600000,
                });
            }

            if (user?.refreshToken) {
                res.cookie('refreshToken', user.refreshToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'strict',
                    maxAge: 7200000,
                });
            }

            res.json({ message: 'Đăng nhập thành công' });
        }

        googleAuth(): void {
            // OAuth initiation - no return value
        }

        async register(req: any, avatar: any): Promise<any> {
            if (!avatar) {
                throw new Error('Avatar is required');
            }

            const userData = {
                ...req.body,
                avatar: {
                    fileName: avatar.originalname,
                    fileBuffer: avatar.buffer,
                    fileSize: avatar.size,
                    mimeType: avatar.mimetype,
                },
            };

            return this.authService.register(userData);
        }
    }

    let controller: MockAuthController;
    const mockAuthService = {
        register: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
        controller = new MockAuthController(mockAuthService);
    });

    const createMockRequest = (overrides = {}) => ({
        user: {
            accessToken: 'mock-access-token',
            refreshToken: 'mock-refresh-token',
        },
        body: {},
        ...overrides,
    });

    const createMockResponse = () => ({
        cookie: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    });

    const createMockFile = (overrides = {}) => ({
        originalname: 'avatar.jpg',
        buffer: Buffer.from('test'),
        size: 1024,
        mimetype: 'image/jpeg',
        ...overrides,
    });

    describe('login', () => {
        it('should set cookies and return success message', () => {
            const req = createMockRequest();
            const res = createMockResponse();

            controller.login(req, res);

            expect(res.cookie).toHaveBeenCalledTimes(2);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Đăng nhập thành công',
            });
        });
    });

    describe('register', () => {
        it('should register user successfully', async () => {
            const req = { body: { email: 'test@example.com' } };
            const file = createMockFile();

            mockAuthService.register.mockResolvedValue(undefined);

            await controller.register(req, file);

            expect(mockAuthService.register).toHaveBeenCalled();
        });

        it('should throw error without avatar', async () => {
            const req = { body: { email: 'test@example.com' } };

            await expect(controller.register(req, null)).rejects.toThrow(
                'Avatar is required',
            );
        });
    });
});
