import { BaseException } from '@common/core/base-exception.interface';

export class AccountNotFoundException extends BaseException {
    private static ERROR_CODE = 'application.auth.account_not_found';

    constructor() {
        super(AccountNotFoundException.ERROR_CODE);
    }
}

export class InvalidCredentialsException extends BaseException {
    private static ERROR_CODE = 'application.auth.invalid_credentials';

    constructor() {
        super(InvalidCredentialsException.ERROR_CODE);
    }
}
