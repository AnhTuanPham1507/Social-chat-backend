import { Inject, Injectable } from '@nestjs/common';
import { GoogleLoginPayloadDTO } from 'src/core/dtos/gogole-login-payload.dto';
import UserDTO from 'src/core/dtos/user.dto';
import { UserEntity } from 'src/core/entities/user.entity';
import { DIToken } from 'src/core/enums/di-tokens.enum';
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
        const user = UserEntity.createGoogleUser(null, {
            email: payload.email, 
            fullName: payload.name
        });

        const foundUser = await this.userRepo.findOne({
            email: user.email,
            provider: user.provider,
        });
        if (foundUser){
            return new UserDTO(foundUser);
        }

        const createdUser = await this.userRepo.save(user);
        return new UserDTO(createdUser);
    }
}
