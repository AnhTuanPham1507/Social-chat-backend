import { Test, TestingModule } from '@nestjs/testing';
import { AuthWebHook } from '../../driving-adapters/controllers/auth.web-hook';
import { GoogleOAuthGuard } from '../../../../commons/guards/google.guard';
import { AuthTestFactory } from '../factories/auth.factory';
import { createMockGoogleOAuthGuard } from '../mocks/guards/google-oauth.guard.mock';

describe('AuthWebHook', () => {
  let controller: AuthWebHook;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthWebHook],
    })
      .overrideGuard(GoogleOAuthGuard)
      .useValue(createMockGoogleOAuthGuard())
      .compile();

    controller = module.get<AuthWebHook>(AuthWebHook);
  });

  describe('GET /public/web-hook/login/google/redirect', () => {
    it('should handle Google OAuth redirect successfully', () => {
      // Arrange
      const mockRequest = AuthTestFactory.createMockRequest();
      const mockResponse = AuthTestFactory.createMockResponse();

      mockRequest.user = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      };

      // Act
      controller.googleAuthRedirect(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(1, 'accessToken', 'google-access-token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000,
      });
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(2, 'refreshToken', 'google-refresh-token', {
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
      expect(() => controller.googleAuthRedirect(mockRequest, mockResponse)).not.toThrow();
    });

    it('should handle missing tokens in user data', () => {
      // Arrange
      const mockRequest = {
        user: {
          id: 'google-user-id',
          email: 'test@gmail.com',
          // Missing accessToken and refreshToken
        },
      };
      const mockResponse = AuthTestFactory.createMockResponse();

      // Act
      controller.googleAuthRedirect(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.json).toHaveBeenCalledWith({ message: 'Đăng nhập thành công' });
    });

    it('should set cookies with correct security options in production', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const mockRequest = AuthTestFactory.createMockRequest();
      const mockResponse = AuthTestFactory.createMockResponse();

      mockRequest.user = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      };

      // Act
      controller.googleAuthRedirect(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(1, 'accessToken', 'google-access-token', {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 3600000,
      });

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });

    it('should set cookies with correct security options in development', () => {
      // Arrange
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const mockRequest = AuthTestFactory.createMockRequest();
      const mockResponse = AuthTestFactory.createMockResponse();

      mockRequest.user = {
        accessToken: 'google-access-token',
        refreshToken: 'google-refresh-token',
      };

      // Act
      controller.googleAuthRedirect(mockRequest, mockResponse);

      // Assert
      expect(mockResponse.cookie).toHaveBeenNthCalledWith(1, 'accessToken', 'google-access-token', {
        httpOnly: true,
        secure: false,
        sameSite: 'strict',
        maxAge: 3600000,
      });

      // Cleanup
      process.env.NODE_ENV = originalEnv;
    });
  });
}); 