import {
    DomainPrimitiveProperties,
    ValueObject,
    ValueObjectProperties,
} from '@beincom/domain';

import { ASSET_TYPE } from './asset-type.value-object';
import { ASSET_PURPOSE } from './asset-purpose.enum';
import { MaxAssetSizeException } from './max-exceed-size.exception';

/**
 * Max file size per asset type (in bytes).
 */
const MAX_SIZE_BY_TYPE: Record<ASSET_TYPE, number> = {
    [ASSET_TYPE.IMAGE]: 10 * 1024 * 1024,     // 10 MB
    [ASSET_TYPE.VIDEO]: 100 * 1024 * 1024,     // 100 MB
    [ASSET_TYPE.AUDIO]: 20 * 1024 * 1024,      // 20 MB
    [ASSET_TYPE.DOCUMENT]: 25 * 1024 * 1024,   // 25 MB
    [ASSET_TYPE.UNKNOWN]: 5 * 1024 * 1024,     // 5 MB
};

/**
 * Purpose-specific overrides (takes precedence over type defaults).
 */
const MAX_SIZE_BY_PURPOSE: Partial<Record<ASSET_PURPOSE, number>> = {
    [ASSET_PURPOSE.AVATAR]: 5 * 1024 * 1024,          // 5 MB
    [ASSET_PURPOSE.CHAT_ATTACHMENT]: 25 * 1024 * 1024, // 25 MB
};

export class AssetSize extends ValueObject<number> {
    private constructor(props: ValueObjectProperties<number>) {
        super(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public validate({}: DomainPrimitiveProperties<number>): void {}

    /**
     * Creates an AssetSize, validating against type and purpose limits.
     * Purpose-specific limit takes precedence over type default.
     */
    public static create(
        size: number,
        assetType: ASSET_TYPE,
        purpose: ASSET_PURPOSE,
    ): AssetSize {
        const maxSize = MAX_SIZE_BY_PURPOSE[purpose] ?? MAX_SIZE_BY_TYPE[assetType];

        if (size > maxSize) {
            throw new MaxAssetSizeException(size, maxSize);
        }

        return new AssetSize({ value: size });
    }
}
