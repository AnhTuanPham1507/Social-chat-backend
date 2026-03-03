import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateSocialChatSchema1704672000000 implements MigrationInterface {
    name = 'CreateSocialChatSchema1704672000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create ENUM types
        await queryRunner.query(`
            CREATE TYPE "conversation_type_enum" AS ENUM ('direct', 'group');
        `);

        await queryRunner.query(`
            CREATE TYPE "participant_role_enum" AS ENUM ('owner', 'admin', 'member');
        `);

        await queryRunner.query(`
            CREATE TYPE "message_type_enum" AS ENUM ('text', 'image', 'video', 'audio', 'file', 'location', 'system');
        `);

        await queryRunner.query(`
            CREATE TYPE "message_status_enum" AS ENUM ('sending', 'sent', 'delivered', 'failed');
        `);

        await queryRunner.query(`
            CREATE TYPE "friendship_status_enum" AS ENUM ('pending', 'accepted', 'blocked', 'declined');
        `);

        await queryRunner.query(`
            CREATE TYPE "presence_status_enum" AS ENUM ('online', 'away', 'busy', 'offline');
        `);

        await queryRunner.query(`
            CREATE TYPE "reaction_type_enum" AS ENUM ('like', 'love', 'haha', 'wow', 'sad', 'angry');
        `);

        await queryRunner.query(`
            CREATE TYPE "post_visibility_enum" AS ENUM ('public', 'friends', 'private');
        `);

        await queryRunner.query(`
            CREATE TYPE "notification_type_enum" AS ENUM ('message', 'friend_request', 'friend_accepted', 'post_like', 'post_comment', 'mention', 'group_invite');
        `);

        // Add bio column to users table
        await queryRunner.query(`
            ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bio" TEXT;
        `);

        // Create conversations table
        await queryRunner.query(`
            CREATE TABLE "conversations" (
                "id" UUID PRIMARY KEY,
                "type" "conversation_type_enum" NOT NULL,
                "name" VARCHAR(255),
                "description" TEXT,
                "avatar_url" TEXT,
                "last_message_id" UUID,
                "last_message_at" TIMESTAMP,
                "created_by_id" UUID NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_conversations_type" ON "conversations" ("type");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_conversations_last_message_at" ON "conversations" ("last_message_at" DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_conversations_created_by" ON "conversations" ("created_by_id");
        `);

        // Create messages table
        await queryRunner.query(`
            CREATE TABLE "messages" (
                "id" UUID PRIMARY KEY,
                "conversation_id" UUID NOT NULL,
                "sender_id" UUID NOT NULL,
                "type" "message_type_enum" NOT NULL DEFAULT 'text',
                "content" TEXT,
                "status" "message_status_enum" NOT NULL DEFAULT 'sent',
                "reply_to_id" UUID,
                "forwarded_from_id" UUID,
                "is_edited" BOOLEAN NOT NULL DEFAULT false,
                "edited_at" TIMESTAMP,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_messages_conversation" ON "messages" ("conversation_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_messages_sender" ON "messages" ("sender_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_messages_created_at" ON "messages" ("conversation_id", "created_at" DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_messages_reply_to" ON "messages" ("reply_to_id") WHERE "reply_to_id" IS NOT NULL;
        `);

        // Create conversation_participants table
        await queryRunner.query(`
            CREATE TABLE "conversation_participants" (
                "id" UUID PRIMARY KEY,
                "conversation_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "role" "participant_role_enum" NOT NULL DEFAULT 'member',
                "nickname" VARCHAR(100),
                "is_muted" BOOLEAN NOT NULL DEFAULT false,
                "muted_until" TIMESTAMP,
                "last_read_message_id" UUID,
                "last_read_at" TIMESTAMP,
                "joined_at" TIMESTAMP NOT NULL,
                "left_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_participants_conversation" ON "conversation_participants" ("conversation_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_participants_user" ON "conversation_participants" ("user_id");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_participants_unique" ON "conversation_participants" ("conversation_id", "user_id") WHERE "left_at" IS NULL;
        `);

        // Create message_attachments table
        await queryRunner.query(`
            CREATE TABLE "message_attachments" (
                "id" UUID PRIMARY KEY,
                "message_id" UUID NOT NULL,
                "asset_id" UUID NOT NULL,
                "order" INTEGER NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_message_attachments_message" ON "message_attachments" ("message_id");
        `);

        // Create message_reactions table
        await queryRunner.query(`
            CREATE TABLE "message_reactions" (
                "id" UUID PRIMARY KEY,
                "message_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "reaction" "reaction_type_enum" NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_reactions_message" ON "message_reactions" ("message_id");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_reactions_unique" ON "message_reactions" ("message_id", "user_id", "reaction");
        `);

        // Create message_read_receipts table
        await queryRunner.query(`
            CREATE TABLE "message_read_receipts" (
                "id" UUID PRIMARY KEY,
                "message_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "read_at" TIMESTAMP NOT NULL
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_read_receipts_message" ON "message_read_receipts" ("message_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_read_receipts_user" ON "message_read_receipts" ("user_id");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_read_receipts_unique" ON "message_read_receipts" ("message_id", "user_id");
        `);

        // Create friendships table
        await queryRunner.query(`
            CREATE TABLE "friendships" (
                "id" UUID PRIMARY KEY,
                "requester_id" UUID NOT NULL,
                "addressee_id" UUID NOT NULL,
                "status" "friendship_status_enum" NOT NULL DEFAULT 'pending',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_friendships_requester" ON "friendships" ("requester_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_friendships_addressee" ON "friendships" ("addressee_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_friendships_status" ON "friendships" ("status");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_friendships_unique" ON "friendships" (LEAST("requester_id", "addressee_id"), GREATEST("requester_id", "addressee_id"));
        `);

        // Create user_presences table
        await queryRunner.query(`
            CREATE TABLE "user_presences" (
                "id" UUID PRIMARY KEY,
                "user_id" UUID NOT NULL UNIQUE,
                "status" "presence_status_enum" NOT NULL DEFAULT 'offline',
                "custom_status" VARCHAR(100),
                "last_seen_at" TIMESTAMP NOT NULL,
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_presences_user" ON "user_presences" ("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_presences_status" ON "user_presences" ("status");
        `);

        // Create posts table
        await queryRunner.query(`
            CREATE TABLE "posts" (
                "id" UUID PRIMARY KEY,
                "author_id" UUID NOT NULL,
                "content" TEXT,
                "visibility" "post_visibility_enum" NOT NULL DEFAULT 'public',
                "reactions_count" INTEGER NOT NULL DEFAULT 0,
                "comments_count" INTEGER NOT NULL DEFAULT 0,
                "shares_count" INTEGER NOT NULL DEFAULT 0,
                "is_edited" BOOLEAN NOT NULL DEFAULT false,
                "edited_at" TIMESTAMP,
                "original_post_id" UUID,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_posts_author" ON "posts" ("author_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_posts_visibility" ON "posts" ("visibility");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_posts_created_at" ON "posts" ("created_at" DESC);
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_posts_feed" ON "posts" ("author_id", "visibility", "created_at" DESC);
        `);

        // Create post_attachments table
        await queryRunner.query(`
            CREATE TABLE "post_attachments" (
                "id" UUID PRIMARY KEY,
                "post_id" UUID NOT NULL,
                "asset_id" UUID NOT NULL,
                "order" INTEGER NOT NULL DEFAULT 0,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_post_attachments_post" ON "post_attachments" ("post_id");
        `);

        // Create post_reactions table
        await queryRunner.query(`
            CREATE TABLE "post_reactions" (
                "id" UUID PRIMARY KEY,
                "post_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "reaction" "reaction_type_enum" NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_post_reactions_post" ON "post_reactions" ("post_id");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_post_reactions_unique" ON "post_reactions" ("post_id", "user_id");
        `);

        // Create post_comments table
        await queryRunner.query(`
            CREATE TABLE "post_comments" (
                "id" UUID PRIMARY KEY,
                "post_id" UUID NOT NULL,
                "author_id" UUID NOT NULL,
                "parent_comment_id" UUID,
                "content" TEXT NOT NULL,
                "reactions_count" INTEGER NOT NULL DEFAULT 0,
                "replies_count" INTEGER NOT NULL DEFAULT 0,
                "is_edited" BOOLEAN NOT NULL DEFAULT false,
                "edited_at" TIMESTAMP,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_post_comments_post" ON "post_comments" ("post_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_post_comments_author" ON "post_comments" ("author_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_post_comments_parent" ON "post_comments" ("parent_comment_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_post_comments_created_at" ON "post_comments" ("post_id", "created_at" DESC);
        `);

        // Create comment_reactions table
        await queryRunner.query(`
            CREATE TABLE "comment_reactions" (
                "id" UUID PRIMARY KEY,
                "comment_id" UUID NOT NULL,
                "user_id" UUID NOT NULL,
                "reaction" "reaction_type_enum" NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_comment_reactions_comment" ON "comment_reactions" ("comment_id");
        `);

        await queryRunner.query(`
            CREATE UNIQUE INDEX "idx_comment_reactions_unique" ON "comment_reactions" ("comment_id", "user_id");
        `);

        // Create notifications table
        await queryRunner.query(`
            CREATE TABLE "notifications" (
                "id" UUID PRIMARY KEY,
                "user_id" UUID NOT NULL,
                "type" "notification_type_enum" NOT NULL,
                "title" VARCHAR(255) NOT NULL,
                "content" TEXT,
                "data" JSONB,
                "is_read" BOOLEAN NOT NULL DEFAULT false,
                "read_at" TIMESTAMP,
                "actor_id" UUID,
                "reference_id" UUID,
                "reference_type" VARCHAR(50),
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            );
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_notifications_user" ON "notifications" ("user_id");
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_notifications_unread" ON "notifications" ("user_id", "is_read") WHERE "is_read" = false;
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_notifications_created_at" ON "notifications" ("user_id", "created_at" DESC);
        `);

        // Add foreign keys
        await queryRunner.query(`
            ALTER TABLE "conversations"
            ADD CONSTRAINT "fk_conversations_created_by"
            FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "conversations"
            ADD CONSTRAINT "fk_conversations_last_message"
            FOREIGN KEY ("last_message_id") REFERENCES "messages"("id") ON DELETE SET NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "fk_messages_conversation"
            FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "fk_messages_sender"
            FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "fk_messages_reply_to"
            FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE "messages"
            ADD CONSTRAINT "fk_messages_forwarded_from"
            FOREIGN KEY ("forwarded_from_id") REFERENCES "messages"("id") ON DELETE SET NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE "conversation_participants"
            ADD CONSTRAINT "fk_participants_conversation"
            FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "conversation_participants"
            ADD CONSTRAINT "fk_participants_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "conversation_participants"
            ADD CONSTRAINT "fk_participants_last_read_message"
            FOREIGN KEY ("last_read_message_id") REFERENCES "messages"("id") ON DELETE SET NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE "message_attachments"
            ADD CONSTRAINT "fk_message_attachments_message"
            FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "message_attachments"
            ADD CONSTRAINT "fk_message_attachments_asset"
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "message_reactions"
            ADD CONSTRAINT "fk_message_reactions_message"
            FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "message_reactions"
            ADD CONSTRAINT "fk_message_reactions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "message_read_receipts"
            ADD CONSTRAINT "fk_read_receipts_message"
            FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "message_read_receipts"
            ADD CONSTRAINT "fk_read_receipts_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "friendships"
            ADD CONSTRAINT "fk_friendships_requester"
            FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "friendships"
            ADD CONSTRAINT "fk_friendships_addressee"
            FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "user_presences"
            ADD CONSTRAINT "fk_presences_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "posts"
            ADD CONSTRAINT "fk_posts_author"
            FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "posts"
            ADD CONSTRAINT "fk_posts_original_post"
            FOREIGN KEY ("original_post_id") REFERENCES "posts"("id") ON DELETE SET NULL;
        `);

        await queryRunner.query(`
            ALTER TABLE "post_attachments"
            ADD CONSTRAINT "fk_post_attachments_post"
            FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "post_attachments"
            ADD CONSTRAINT "fk_post_attachments_asset"
            FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "post_reactions"
            ADD CONSTRAINT "fk_post_reactions_post"
            FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "post_reactions"
            ADD CONSTRAINT "fk_post_reactions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "post_comments"
            ADD CONSTRAINT "fk_post_comments_post"
            FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "post_comments"
            ADD CONSTRAINT "fk_post_comments_author"
            FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "post_comments"
            ADD CONSTRAINT "fk_post_comments_parent"
            FOREIGN KEY ("parent_comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "comment_reactions"
            ADD CONSTRAINT "fk_comment_reactions_comment"
            FOREIGN KEY ("comment_id") REFERENCES "post_comments"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "comment_reactions"
            ADD CONSTRAINT "fk_comment_reactions_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "fk_notifications_user"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;
        `);

        await queryRunner.query(`
            ALTER TABLE "notifications"
            ADD CONSTRAINT "fk_notifications_actor"
            FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "fk_notifications_actor";`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT IF EXISTS "fk_notifications_user";`);
        await queryRunner.query(`ALTER TABLE "comment_reactions" DROP CONSTRAINT IF EXISTS "fk_comment_reactions_user";`);
        await queryRunner.query(`ALTER TABLE "comment_reactions" DROP CONSTRAINT IF EXISTS "fk_comment_reactions_comment";`);
        await queryRunner.query(`ALTER TABLE "post_comments" DROP CONSTRAINT IF EXISTS "fk_post_comments_parent";`);
        await queryRunner.query(`ALTER TABLE "post_comments" DROP CONSTRAINT IF EXISTS "fk_post_comments_author";`);
        await queryRunner.query(`ALTER TABLE "post_comments" DROP CONSTRAINT IF EXISTS "fk_post_comments_post";`);
        await queryRunner.query(`ALTER TABLE "post_reactions" DROP CONSTRAINT IF EXISTS "fk_post_reactions_user";`);
        await queryRunner.query(`ALTER TABLE "post_reactions" DROP CONSTRAINT IF EXISTS "fk_post_reactions_post";`);
        await queryRunner.query(`ALTER TABLE "post_attachments" DROP CONSTRAINT IF EXISTS "fk_post_attachments_asset";`);
        await queryRunner.query(`ALTER TABLE "post_attachments" DROP CONSTRAINT IF EXISTS "fk_post_attachments_post";`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "fk_posts_original_post";`);
        await queryRunner.query(`ALTER TABLE "posts" DROP CONSTRAINT IF EXISTS "fk_posts_author";`);
        await queryRunner.query(`ALTER TABLE "user_presences" DROP CONSTRAINT IF EXISTS "fk_presences_user";`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "fk_friendships_addressee";`);
        await queryRunner.query(`ALTER TABLE "friendships" DROP CONSTRAINT IF EXISTS "fk_friendships_requester";`);
        await queryRunner.query(`ALTER TABLE "message_read_receipts" DROP CONSTRAINT IF EXISTS "fk_read_receipts_user";`);
        await queryRunner.query(`ALTER TABLE "message_read_receipts" DROP CONSTRAINT IF EXISTS "fk_read_receipts_message";`);
        await queryRunner.query(`ALTER TABLE "message_reactions" DROP CONSTRAINT IF EXISTS "fk_message_reactions_user";`);
        await queryRunner.query(`ALTER TABLE "message_reactions" DROP CONSTRAINT IF EXISTS "fk_message_reactions_message";`);
        await queryRunner.query(`ALTER TABLE "message_attachments" DROP CONSTRAINT IF EXISTS "fk_message_attachments_asset";`);
        await queryRunner.query(`ALTER TABLE "message_attachments" DROP CONSTRAINT IF EXISTS "fk_message_attachments_message";`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT IF EXISTS "fk_participants_last_read_message";`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT IF EXISTS "fk_participants_user";`);
        await queryRunner.query(`ALTER TABLE "conversation_participants" DROP CONSTRAINT IF EXISTS "fk_participants_conversation";`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "fk_messages_forwarded_from";`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "fk_messages_reply_to";`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "fk_messages_sender";`);
        await queryRunner.query(`ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "fk_messages_conversation";`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "fk_conversations_last_message";`);
        await queryRunner.query(`ALTER TABLE "conversations" DROP CONSTRAINT IF EXISTS "fk_conversations_created_by";`);

        // Drop tables
        await queryRunner.query(`DROP TABLE IF EXISTS "notifications";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "comment_reactions";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "post_comments";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "post_reactions";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "post_attachments";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "posts";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "user_presences";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "friendships";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "message_read_receipts";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "message_reactions";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "message_attachments";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "conversation_participants";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "messages";`);
        await queryRunner.query(`DROP TABLE IF EXISTS "conversations";`);

        // Remove bio column from users
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "bio";`);

        // Drop ENUM types
        await queryRunner.query(`DROP TYPE IF EXISTS "notification_type_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "post_visibility_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "reaction_type_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "presence_status_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "friendship_status_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "message_status_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "message_type_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "participant_role_enum";`);
        await queryRunner.query(`DROP TYPE IF EXISTS "conversation_type_enum";`);
    }
}
