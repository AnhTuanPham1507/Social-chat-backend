import {
    DomainPrimitiveProperties,
    ValueObject,
    ValueObjectProperties,
} from '@beincom/domain';

import { MaxAssetSizeException } from './max-exceed-size.exception';

export class AssetSize extends ValueObject<number> {
    private static readonly MAX_SIZE = 5 * 1024 * 1024; // 5MB

    constructor(props: ValueObjectProperties<number>) {
        super(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public validate({}: DomainPrimitiveProperties<number>): void {
        if (this.value > AssetSize.MAX_SIZE) {
            throw new MaxAssetSizeException();
        }
    }

    public static fromNumber(value: number): AssetSize {
        return new AssetSize({ value });
    }
}
