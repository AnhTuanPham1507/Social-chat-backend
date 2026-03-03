import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SnakeNamingStrategy } from './snake-naming.strategy';

import { UserModel } from './models/user.model';
import { AssetModel } from './models/asset.model';
import { ConversationModel } from './models/conversation.model';
import { ConversationParticipantModel } from './models/conversation-participant.model';
import { MessageModel } from './models/message.model';
import { MessageAttachmentModel } from './models/message-attachment.model';
import { MessageReactionModel } from './models/message-reaction.model';
import { MessageReadReceiptModel } from './models/message-read-receipt.model';
import { FriendshipModel } from './models/friendship.model';
import { UserPresenceModel } from './models/user-presence.model';
import { PostModel } from './models/post.model';
import { PostAttachmentModel } from './models/post-attachment.model';
import { PostReactionModel } from './models/post-reaction.model';
import { PostCommentModel } from './models/post-comment.model';
import { CommentReactionModel } from './models/comment-reaction.model';
import { NotificationModel } from './models/notification.model';

import { CreateSocialChatSchema1704672000000 } from './migrations/1704672000000-CreateSocialChatSchema';

const config: DataSourceOptions = {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'social_chat',
    entities: [
        UserModel,
        AssetModel,
        ConversationModel,
        ConversationParticipantModel,
        MessageModel,
        MessageAttachmentModel,
        MessageReactionModel,
        MessageReadReceiptModel,
        FriendshipModel,
        UserPresenceModel,
        PostModel,
        PostAttachmentModel,
        PostReactionModel,
        PostCommentModel,
        CommentReactionModel,
        NotificationModel,
    ],
    migrations: [CreateSocialChatSchema1704672000000],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    logging: ['query', 'error'],
};

export default new DataSource(config);
