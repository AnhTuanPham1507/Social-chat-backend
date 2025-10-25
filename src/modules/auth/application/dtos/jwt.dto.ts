export interface IJwtPayload {
    sub: string;
    iss: string;
    aud: string;
    exp: number;
    iat: number;
    preferred_username: string;
    email: string;
    given_name: string;
    family_name: string;
    realm_access: {
        roles: string[];
    };
    resource_access: {
        [key: string]: {
            roles: string[];
        };
    };
}
