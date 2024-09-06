import { BadRequestException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginPayloadDTO } from 'src/core/dtos/login-payload.dto';
import UserDTO from 'src/core/dtos/user.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { IUseCase } from 'src/core/interfaces/base-use-case.interface';
import { IHashDataService } from 'src/core/interfaces/hash-data-service.interface';
import { IUserRepo } from 'src/core/interfaces/user-repo.interface';

export interface ILoginUseCase extends IUseCase<LoginPayloadDTO, UserDTO> {}

@Injectable()
export class LoginUseCase implements ILoginUseCase {
    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,

        @Inject(DIToken.HASH_SERVICE)
        public readonly hashService: IHashDataService,
    ) {}

    async execute(payload?: LoginPayloadDTO, actor?: string): Promise<UserDTO> {
        const user = UserEntity.createLocalUser(null, {
            email: payload.email, 
            password: payload.password
        });

        const foundUser = await this.userRepo.findOne({
            queryParams: [
                {
                    email: user.email,
                    provider: user.provider,
                },
            ],
        });

        if (!foundUser) {
            throw new BadRequestException('Người dùng không tồn tại hoặc không thể đăng nhập qua phương thức này');
        }

        const isSamePassword = await this.hashService.validateHashString(
            payload.password,
            foundUser.password,
        );
        if (!isSamePassword) {
            throw new UnauthorizedException('Mật khẩu không chính xác');
        }

        return new UserDTO(foundUser);
    }
}
