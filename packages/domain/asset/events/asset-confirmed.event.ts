import { DomainEvent } from '../../core/domain-event.base';
import { ASSET_PURPOSE } from '../asset-purpose.enum';
import { ASSET_TYPE } from '../asset-type.value-object';

export class AssetConfirmedEvent extends DomainEvent {
  static readonly EVENT_NAME = 'asset.confirmed';

  constructor(
    readonly assetId: string,
    readonly bucket: string,
    readonly key: string,
    readonly assetType: ASSET_TYPE,
    readonly purpose: ASSET_PURPOSE,
    readonly mimeType: string,
    readonly size: number,
    readonly createdBy: string,
  ) {
    super(assetId);
  }

  get eventName(): string {
    return AssetConfirmedEvent.EVENT_NAME;
  }
}
