export interface IAccessTokenPayload {
    sub: string;
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    preferred_username: string;
    email: string;
    realm_access: {
        roles: string[];
    };
    resource_access: {
        [key: string]: {
            roles: string[];
        };
    };
}

export interface IIdTokenPayload {
    sub: string;
    email: string;
    name: string;
}
