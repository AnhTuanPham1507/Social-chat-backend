import UserDTO from '../../../dtos/user.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { UserEntity } from '../../../entities/user.entity';
import { DIToken } from '../../../enums/di-tokens.enum';
import { IUseCase } from '../../../interfaces/base-use-case.interface';
import { IUserRepo } from '../../../interfaces/user-repo.interface';
import { GetOneUserDTO } from 'src/core/dtos/get-one-user.dto';

export interface IGetOneUserUseCase extends IUseCase<GetOneUserDTO, UserDTO> {}

@Injectable()
export class GetOneUserUseCase implements IGetOneUserUseCase {
    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,
    ) {}

    async execute(payload: GetOneUserDTO): Promise<UserDTO> {
        const user = new UserEntity(payload.id);
        
        const foundUser = await this.userRepo.findOne(user);

        if (!foundUser) {
            throw new BadRequestException(
                'Không tồn tại người dùng này',
            );
        }

        return new UserDTO(foundUser);
    }
}
