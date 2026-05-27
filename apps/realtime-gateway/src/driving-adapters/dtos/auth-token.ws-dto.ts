import { IsString } from 'class-validator';

export class AuthTokenWsDto {
    @IsString()
    token: string;
}
