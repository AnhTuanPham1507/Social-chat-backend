import { Command, CommandRunner } from 'nest-commander';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
    PostRead,
    PostReadDocument,
    PostReadMongoRepository,
    UserRead,
    UserReadDocument,
} from '@social-chat/infrastructure';

/**
 * One-shot backfill: populate the embedded `author` snapshot on existing
 * `feed_posts` rows that pre-date the denormalization.
 *
 * Reuses the same fan-out method the user-CDC handler calls at runtime
 * (`updateAuthorByUserId`) so the backfill path and the live path are
 * provably equivalent. Authors not yet present in `feed_users` are
 * reported and skipped — the same eventual-consistency contract the
 * runtime handler enforces.
 */
@Command({
    name: 'infra:mongo:backfill-post-author',
    description:
        'Backfill the embedded author snapshot on feed_posts rows that are missing it',
})
export class BackfillPostAuthorCommand extends CommandRunner {
    constructor(
        @InjectModel(PostRead.name)
        private readonly postModel: Model<PostReadDocument>,
        @InjectModel(UserRead.name)
        private readonly userModel: Model<UserReadDocument>,
        private readonly postReadRepo: PostReadMongoRepository,
    ) {
        super();
    }

    async run(): Promise<void> {
        const missingFilter = { author: { $in: [null, undefined] } };

        const totalMissing = await this.postModel
            .countDocuments(missingFilter)
            .exec();
        console.log(`Posts missing author snapshot: ${totalMissing}`);

        if (totalMissing === 0) {
            console.log('Nothing to backfill.');
            return;
        }

        const authorIds: string[] = await this.postModel.distinct(
            'authorId',
            missingFilter,
        );
        console.log(`Distinct authors to resolve: ${authorIds.length}`);

        let resolved = 0;
        let skipped = 0;

        for (const userId of authorIds) {
            const user = await this.userModel.findById(userId).lean().exec();

            if (!user) {
                console.warn(
                    `  skip authorId=${userId} — not present in feed_users`,
                );
                skipped += 1;
                continue;
            }

            await this.postReadRepo.updateAuthorByUserId(userId, {
                name: user.displayName,
                avatar: user.avatarUrl ?? undefined,
            });
            resolved += 1;

            if (resolved % 50 === 0) {
                console.log(
                    `  ...${resolved}/${authorIds.length} authors processed`,
                );
            }
        }

        const remaining = await this.postModel
            .countDocuments(missingFilter)
            .exec();

        console.log(
            `Done. resolved=${resolved}, skipped=${skipped}. remaining missing=${remaining}.`,
        );
    }
}
