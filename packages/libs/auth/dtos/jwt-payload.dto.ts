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
    email: string;
    fullName: string;
}

export class AuthUserDto {
    id: string;
    email: string;
    name: string;
    roles: string[];

    constructor(params: {
        id: string;
        email: string;
        name: string;
        roles: string[];
    }) {
        this.id = params.id;
        this.email = params.email;
        this.name = params.name;
        this.roles = params.roles;
    }
}
