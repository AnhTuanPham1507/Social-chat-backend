import { BaseDomainException } from '@common/core/exceptions/base-exception.interface';

import { DOMAIN_ASSET_ERROR_CODES } from './error-code.const';

export class MaxAssetSizeException extends BaseDomainException {
    private static readonly ERROR_CODE =
        DOMAIN_ASSET_ERROR_CODES.ASSET.MAX_SIZE_EXCEPTION;

    constructor() {
        super(MaxAssetSizeException.ERROR_CODE);
    }
}
