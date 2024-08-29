import { UserEntity } from '../entities/user.entity';
import { IRepo } from './base-repo.interface';

export interface IUserRepo extends IRepo<UserEntity> {
}
