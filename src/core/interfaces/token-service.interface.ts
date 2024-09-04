import { Role } from "../enums/role.enum";

export type ITokenPayload = {
    id: string;
    email: string;
    role: Role
}

export type ITokenResponse = {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}

export interface ITokenService {
    generatePairToken(payload: ITokenPayload): ITokenResponse;
}