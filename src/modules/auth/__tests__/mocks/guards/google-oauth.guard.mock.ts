import { CanActivate, ExecutionContext } from '@nestjs/common';

export const mockGoogleOAuthGuard: CanActivate = {
    canActivate: jest.fn().mockImplementation((context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        // Mock successful Google OAuth authentication
        request.user = {
            id: 'test-google-user-id',
            email: 'test@gmail.com',
            accessToken: 'mock-google-access-token',
            refreshToken: 'mock-google-refresh-token',
            provider: 'google',
        };
        return true;
    }),
};

export const createMockGoogleOAuthGuard = (): CanActivate => ({
    canActivate: jest.fn().mockReturnValue(true),
});
