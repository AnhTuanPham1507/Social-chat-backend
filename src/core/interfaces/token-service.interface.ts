import { Role } from "../enums/role.enum";

export interface ITokenPayload {
    id: string;
    email: string;
    role: Role
}

export interface ITokenResponse {
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
}

export interface ITokenService {
    generatePairToken(payload: ITokenPayload): ITokenResponse;
}