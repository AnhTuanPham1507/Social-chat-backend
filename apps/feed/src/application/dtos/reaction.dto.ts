import { CONTENT_TYPE, REACTION_TYPE } from '@social-chat/domain';

export class Reaction {
    id: string;
    contentId: string;
    contentType: CONTENT_TYPE;
    userId: string;
    type: REACTION_TYPE;
    createdAt: Date;
}

export interface ReactToPostInput {
    type: REACTION_TYPE;
}
