import { IAccountRepository } from '@modules/auth/application/contracts/account-repository.contract';
import { AccountEntity } from '@modules/auth/domain/entities/account/account.entity';

export const mockAccountRepository: jest.Mocked<IAccountRepository> = {
  findOne: jest.fn(),
  insert: jest.fn(),
};

export const createMockAccountRepository = (): jest.Mocked<IAccountRepository> => ({
  findOne: jest.fn(),
  insert: jest.fn(),
}); 