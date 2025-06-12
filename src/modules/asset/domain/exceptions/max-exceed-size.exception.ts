import { BaseException } from '@commons/core/base-exception.interface';

export class MaxAssetSizeException extends BaseException {
    private static readonly ERROR_CODE = 'domain.asset.max_size_exception';

    constructor() {
        super(MaxAssetSizeException.ERROR_CODE);
    }
}
