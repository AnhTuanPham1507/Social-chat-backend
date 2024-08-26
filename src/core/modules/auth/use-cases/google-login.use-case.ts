import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { GoogleLoginPayloadDTO } from 'src/core/dtos/gogole-login-payload.dto';
import { LoginPayloadDTO } from 'src/core/dtos/login-payload.dto';
import UserDTO from 'src/core/dtos/user.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { UserProvider } from 'src/core/enums/user-provider.enum';
import { IUseCase } from 'src/core/interfaces/base-use-case.interface';
import { IHashDataService } from 'src/core/interfaces/hash-data-service.interface';
import { IUserRepo } from 'src/core/interfaces/user-repo.interface';

export interface IGoogleLoginUseCase extends IUseCase<GoogleLoginPayloadDTO, UserDTO> {}

@Injectable()
export class GoogleLoginUseCase implements IGoogleLoginUseCase {
    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,

        @Inject(DIToken.HASH_SERVICE)
        public readonly hashService: IHashDataService,
    ) {}

    async execute(payload?: GoogleLoginPayloadDTO, actor?: string): Promise<UserDTO> {
        const user = new UserEntity(null, {
            email: payload.email, 
            fullName: payload.name
        });

        const foundUser = await this.userRepo.findOne(user);

        if (foundUser && foundUser.provider === UserProvider.GOOGLE) {
            return new UserDTO(foundUser)
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
