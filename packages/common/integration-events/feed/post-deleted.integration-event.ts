import { IntegrationEvent } from '../base/integration-event.base';
import { CommentSnapshotPayload, PostSnapshotPayload } from './_payloads';

export class PostDeletedIntegrationEvent extends IntegrationEvent {
    static readonly TOPIC = 'feed.integration.post-deleted';

    constructor(
        readonly postSnapshot: PostSnapshotPayload,
        readonly cascadedCommentSnapshots: readonly CommentSnapshotPayload[],
    ) {
        super();
    }
}
