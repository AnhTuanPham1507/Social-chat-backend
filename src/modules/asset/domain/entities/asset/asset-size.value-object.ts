import { DomainPrimitiveProperties, ValueObject, ValueObjectProperties } from "@beincom/domain";
import { MaxAssetSizeException } from "../../exceptions/max-exceed-size.exception";

export class AssetSize extends ValueObject<number> {
    private static readonly MAX_SIZE = 1024 * 1024; // 1MB

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
