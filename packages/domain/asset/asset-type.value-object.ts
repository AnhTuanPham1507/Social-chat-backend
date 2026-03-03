import {
    DomainPrimitiveProperties,
    ValueObject,
    ValueObjectProperties,
} from '@beincom/domain';

export enum ASSET_TYPE {
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document',
    UNKNOWN = 'unknown',
}

export class AssetType extends ValueObject<ASSET_TYPE> {
    constructor(props: ValueObjectProperties<ASSET_TYPE>) {
        super(props);
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    public validate({}: DomainPrimitiveProperties<ASSET_TYPE>): void {}

    public static fromString(value: ASSET_TYPE): AssetType {
        return new AssetType({ value });
    }
}
