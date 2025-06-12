import { CanActivate, ExecutionContext } from '@nestjs/common';

export const mockLocalGuard: CanActivate = {
  canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest();
    // Mock successful authentication
    request.user = {
      id: 'test-user-id',
      email: 'test@example.com',
      accessToken: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    };
    return true;
  }),
};

export const createMockLocalGuard = (): CanActivate => ({
  canActivate: jest.fn().mockReturnValue(true),
}); 