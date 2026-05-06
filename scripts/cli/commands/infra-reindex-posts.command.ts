import { Command, CommandRunner } from 'nest-commander';
import { MoreThan } from 'typeorm';
import { BasePostRepository } from '@social-chat/infrastructure';
import { PostSearchRepo } from '../../../apps/feed/src/driven-adapters/repos/post-search-repository.adapter';
import { PostSearchDocument } from '../../../apps/feed/src/application/contracts/post-search-repository.contract';

const BATCH_SIZE = 500;

@Command({
    name: 'infra:es:reindex-posts',
    description:
        'Drop and recreate the posts Elasticsearch index, then bulk-index all rows from Postgres',
})
export class ReindexPostsCommand extends CommandRunner {
    constructor(
        private readonly postSearchRepo: PostSearchRepo,
        private readonly postRepo: BasePostRepository,
    ) {
        super();
    }

    async run(): Promise<void> {
        console.log('Recreating posts index with atomic alias swap...');

        let total = 0;

        await this.postSearchRepo.recreateIndex(async () => {
            console.log(`Backfilling from Postgres in batches of ${BATCH_SIZE}...`);
            let lastId: string | null = null;

            while (true) {
                const batch = await this.postRepo.findAll({
                    where: lastId ? { id: MoreThan(lastId) } : {},
                    order: { id: 'ASC' },
                    take: BATCH_SIZE,
                });

                if (batch.length === 0) break;

                const docs: PostSearchDocument[] = batch.map((row) => ({
                    id: row.id,
                    content: row.content,
                    visibility: row.visibility,
                    authorId: row.authorId,
                    createdAt: row.createdAt,
                    updatedAt: row.updatedAt,
                }));

                await this.postSearchRepo.bulkIndexPosts(docs);

                total += batch.length;
                lastId = batch[batch.length - 1].id;
                console.log(`  +${batch.length} (total: ${total})`);

                if (batch.length < BATCH_SIZE) break;
            }
        });

        console.log(`Done. Indexed ${total} posts.`);
    }
}
