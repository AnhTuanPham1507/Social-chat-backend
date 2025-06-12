import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from '../../driving-adapters/controllers/auth.controller';
import { AUTH_APPLICATION_SERVICE_TOKEN, IAuthApplicationService } from '../../application/application-services/auth.application-service';
import { LocalGuard } from '../../../../commons/guards/local.guard';
import { GoogleOAuthGuard } from '../../../../commons/guards/google.guard';
import { AuthTestFactory } from '../factories/auth.factory';
import { createMockLocalGuard } from '../mocks/guards/local.guard.mock';
import { createMockGoogleOAuthGuard } from '../mocks/guards/google-oauth.guard.mock';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<IAuthApplicationService>;

  const mockAuthApplicationService: jest.Mocked<IAuthApplicationService> = {
    localLogin: jest.fn(),
    googleLogin: jest.fn(),
    register: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AUTH_APPLICATION_SERVICE_TOKEN,
          useValue: mockAuthApplicationService,
        },
      ],
    })
      .overrideGuard(LocalGuard)
      .useValue(createMockLocalGuard())
      .overrideGuard(GoogleOAuthGuard)
      .useValue(createMockGoogleOAuthGuard())
      .compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AUTH_APPLICATION_SERVICE_TOKEN);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Arrange
      const mockRequest = AuthTestFactory.createMockRequest();
      const mockResponse = AuthTestFactory.createMockResponse();
      const mockAccount = AuthTestFactory.createAccountDTO();

      mockRequest.user = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      // Act
      controller.login(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(1, 'accessToken', 'mock-access-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(2, 'refreshToken', 'mock-refresh-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7200000,
      });
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Đăng nhập thành công' });
    });

    it('should handle missing user data in request', () => {
      // Arrange
      const mockRequest = { user: undefined };
      const mockResponse = AuthTestFactory.createMockResponse();

      // Act & Assert
      expect(() => controller.login(mockRequest, mockResponse)).not.toThrow();
    });
  });

  describe('GET /auth/google-login', () => {
    it('should initiate Google OAuth flow', () => {
      // Act
      const result = controller.googleAuth();

      // Assert
      expect(result).toBeUndefined(); // The method returns void and just triggers OAuth
    });
  });

  describe('POST /auth/register', () => {
    it('should register user with valid data and avatar', async () => {
      // Arrange
      const registerPayload = AuthTestFactory.createRegisterPayload();
      const mockFile = AuthTestFactory.createMockFile();
      const mockRequest = {
        body: {
          fullName: registerPayload.fullName,
          email: registerPayload.email,
          password: registerPayload.password,
          phone: registerPayload.phone,
          sex: registerPayload.sex,
        },
      };

      authService.register.mockResolvedValue();

      // Act
      const result = await controller.register(mockRequest, mockFile);

      // Assert
      expect(authService.register).toHaveBeenCalledWith({
        ...mockRequest.body,
        avatar: {
          fileName: mockFile.originalname,
          fileBuffer: mockFile.buffer,
          fileSize: mockFile.size,
          mimeType: mockFile.mimetype,
        },
      });
      expect(result).toBeUndefined();
    });

    it('should handle registration with missing avatar', async () => {
      // Arrange
      const registerPayload = AuthTestFactory.createRegisterPayload();
      const mockRequest = {
        body: {
          fullName: registerPayload.fullName,
          email: registerPayload.email,
          password: registerPayload.password,
          phone: registerPayload.phone,
          sex: registerPayload.sex,
        },
      };

      authService.register.mockResolvedValue();

      // Act & Assert
      await expect(controller.register(mockRequest, null as any)).rejects.toThrow();
    });

    it('should handle registration service failure', async () => {
      // Arrange
      const registerPayload = AuthTestFactory.createRegisterPayload();
      const mockFile = AuthTestFactory.createMockFile();
      const mockRequest = {
        body: {
          fullName: registerPayload.fullName,
          email: registerPayload.email,
          password: registerPayload.password,
          phone: registerPayload.phone,
          sex: registerPayload.sex,
        },
      };

      const registrationError = new Error('Registration failed');
      authService.register.mockRejectedValue(registrationError);

      // Act & Assert
      await expect(controller.register(mockRequest, mockFile)).rejects.toThrow('Registration failed');
      expect(authService.register).toHaveBeenCalled();
    });

    it('should handle invalid file type', async () => {
      // Arrange
      const registerPayload = AuthTestFactory.createRegisterPayload();
      const mockFile = AuthTestFactory.createMockFile({
        mimetype: 'text/plain',
      });
      const mockRequest = {
        body: {
          fullName: registerPayload.fullName,
          email: registerPayload.email,
          password: registerPayload.password,
          phone: registerPayload.phone,
          sex: registerPayload.sex,
        },
      };

      authService.register.mockResolvedValue();

      // Act
      await controller.register(mockRequest, mockFile);

      // Assert
      expect(authService.register).toHaveBeenCalledWith({
        ...mockRequest.body,
        avatar: {
          fileName: mockFile.originalname,
          fileBuffer: mockFile.buffer,
          fileSize: mockFile.size,
          mimeType: 'text/plain',
        },
      });
    });
  });
}); 