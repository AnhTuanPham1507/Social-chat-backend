import { BaseDomainException } from '@social-chat/common';

import { DOMAIN_ASSET_ERROR_CODES } from '../error-code.const';

export class MaxAssetSizeException extends BaseDomainException {
    private static readonly ERROR_CODE =
        DOMAIN_ASSET_ERROR_CODES.ASSET.MAX_SIZE_EXCEPTION;

    constructor(actualSize: number, maxSize: number) {
        super(MaxAssetSizeException.ERROR_CODE, { actualSize, maxSize });
    }
}
