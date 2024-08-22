import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import { LoginPayloadDTO } from "src/core/dtos/login-payload.dto";
import { ResponseLoginDTO } from "src/core/dtos/response-login.dto";
import { DIToken } from "src/core/enums/di-tokens.enum";
import { validateHashString } from "src/core/helpers/hash.helper";
import { IUseCase } from "src/core/interfaces/base-use-case.interface";
import { ITokenService } from "src/core/interfaces/token-service.interface";
import { IUserRepo } from "src/core/interfaces/user-repo.interface";

export interface ILoginUseCase extends IUseCase<LoginPayloadDTO, ResponseLoginDTO> {};

@Injectable()
export class LogInUseCase implements ILoginUseCase {

    constructor(
        @Inject(DIToken.USER_REPOSITORY)
        public readonly userRepo: IUserRepo,

        @Inject(DIToken.TOKEN_SERVICE)
        public readonly tokenService: ITokenService 
    ) {}

    async execute(payload?: LoginPayloadDTO, actor?: string): Promise<ResponseLoginDTO> {
        const foundUser = await this.userRepo.findOne({
            email: payload.email
        })

        if(!foundUser){
            throw new BadRequestException('Email không tồn tại trong hệ thống');
        }

        const isSamePassword = await validateHashString(payload.password, foundUser.password);

        if(!isSamePassword) {
            throw new BadRequestException('Mật khẩu không chính xác');
        }

        const {accessToken, refreshToken} = this.tokenService.generatePairToken({
            id: foundUser.id,
            email: foundUser.email,
            role: foundUser.role
        })

        return new ResponseLoginDTO(accessToken, refreshToken);
    }

}