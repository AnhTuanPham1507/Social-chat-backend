import {
    CreateUserRequestDTO,
    KeycloakUserInfoResponseDTO,
} from '@infras/external-services';

export const IAM_SERVICE_TOKEN = Symbol('IAM_SERVICE_TOKEN');

export interface IIAMService {
    createUser(
        user: CreateUserRequestDTO,
    ): Promise<KeycloakUserInfoResponseDTO>;
}
