import { ASSET_TYPE, MIME_TYPE } from "@social-chat/domain";


export interface LoginInput {
    email: string;
    password: string;
}

export interface CreateAvatarInput {
    fileBuffer: Buffer;
    fileName: string;
    fileSize: number;
    mimeType: MIME_TYPE;
    assetType: ASSET_TYPE;
}

export interface RegisterInput {
    email: string;
    password: string;
    fullName: string;
    avatar?: CreateAvatarInput | null;
}

export interface LogoutInput {
    idToken: string;
    redirectUri: string;
}

export interface CreateIamUserInput {
    email: string;
    fullName: string;
    password: string;
}

// Input for exchanging authorization code for tokens
export interface ExchangeTokenInput {
    code: string;
    state: {
        redirectUri: string;
        clientId: string;
    };
}

// Outputs
export interface AuthTokens {
    idToken: string;
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn: number;
}
