import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { LoginPayloadDTO } from 'src/core/dtos/login-payload.dto';
import UserDTO from 'src/core/dtos/user.dto';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { IUseCase } from 'src/core/interfaces/base-use-case.interface';
import { IHashDataService } from 'src/core/interfaces/hash-data-service.interface';
import { IUserRepo } from 'src/core/interfaces/user-repo.interface';

export interface ILoginUseCase extends IUseCase<LoginPayloadDTO, UserDTO> {}

@Injectable()
export class LogInUseCase implements ILoginUseCase {
    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,

        @Inject(DIToken.HASH_SERVICE)
        public readonly hashService: IHashDataService,
    ) {}

    async execute(payload?: LoginPayloadDTO, actor?: string): Promise<UserDTO> {
        const foundUser = await this.userRepo.findOne({
            email: payload.email,
        });

        if (!foundUser) {
            throw new BadRequestException('Email không tồn tại trong hệ thống');
        }

        const isSamePassword = await this.hashService.validateHashString(
            payload.password,
            foundUser.password,
        );

        if (!isSamePassword) {
            throw new BadRequestException('Mật khẩu không chính xác');
        }

        return new UserDTO(foundUser);
    }
}
