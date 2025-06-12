import { IUserRepository } from '@modules/auth/application/contracts/user-repository.contract';

export const mockUserRepository: jest.Mocked<IUserRepository> = {
    insert: jest.fn(),
};

export const createMockUserRepository = (): jest.Mocked<IUserRepository> => ({
    insert: jest.fn(),
});
