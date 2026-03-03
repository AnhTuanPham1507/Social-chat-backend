import { DomainException } from "@social-chat/common";

export class UserNotFoundException extends DomainException {
    constructor(message?: string, cause?: Error) {
        super('USER_NOT_FOUND', message, cause);
    }
}