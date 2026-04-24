import { IntegrationEvent } from '../base/integration-event.base';
import { CommentSnapshotPayload } from './_payloads';

export class CommentDeletedIntegrationEvent extends IntegrationEvent {
    static readonly TOPIC = 'feed.integration.comment-deleted';

    constructor(readonly commentSnapshot: CommentSnapshotPayload) {
        super();
    }
}
