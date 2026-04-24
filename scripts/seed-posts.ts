import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { initializeTransactionalContext } from 'typeorm-transactional';
import { POST_VISIBILITY } from '@social-chat/domain';
import { UserRead, UserReadDocument } from '@social-chat/infrastructure';

import { AppModule } from '../apps/feed/src/app.module';
import {
    IPostApplicationService,
    POST_APPLICATION_SERVICE_TOKEN,
} from '../apps/feed/src/application/services/post.application-service';
import { CreatePostInput } from '../apps/feed/src/application/dtos/post.dto';

const SEED_POSTS: CreatePostInput[] = [
    { content: 'Hôm nay ăn phở bò ở Hà Nội, ngon tuyệt vời!', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Sáng nay uống cà phê sữa đá ở Sài Gòn', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Ai thích bánh mì pate không?', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Du lịch Đà Nẵng mùa này đẹp lắm các bạn ơi', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Bún bò Huế là món tủ của mình', visibility: POST_VISIBILITY.FRIENDS },
    { content: 'Cơm tấm sườn bì chả buổi sáng Sài Gòn', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Phở Thìn Lò Đúc vẫn là số 1 ở Hà Nội', visibility: POST_VISIBILITY.PUBLIC },

    { content: 'Just finished reading Clean Architecture by Uncle Bob. Highly recommend.', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Learning Elasticsearch today — inverted indexes are fascinating.', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Working from a café in District 1. Coffee game strong here.', visibility: POST_VISIBILITY.FRIENDS },

    { content: 'Vừa code xong feature search với Elasticsearch, dùng ICU analyzer để xử lý tiếng Việt', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Meeting sáng nay discuss về CQRS và event sourcing, nhức đầu quá', visibility: POST_VISIBILITY.FRIENDS },
    { content: 'Deploy production thành công sau 3 tiếng debug, life is good', visibility: POST_VISIBILITY.PUBLIC },

    { content: 'Trời Hà Nội hôm nay se lạnh, thích hợp uống trà nóng', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Sài Gòn mưa suốt mấy hôm nay, kẹt xe kinh khủng', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Đà Lạt sương mù buổi sáng, đẹp như trong phim', visibility: POST_VISIBILITY.PUBLIC },

    { content: 'Chạy bộ 5km sáng nay, cảm thấy cơ thể khỏe khoắn hơn hẳn', visibility: POST_VISIBILITY.FRIENDS },
    { content: 'Mình thích nghe nhạc của Sơn Tùng MTP khi làm việc', visibility: POST_VISIBILITY.PUBLIC },
    { content: 'Cuối tuần đi xem phim với bạn bè, vui quá trời', visibility: POST_VISIBILITY.FRIENDS },
    { content: 'Ngủ đủ 8 tiếng là bí quyết cho một ngày làm việc hiệu quả', visibility: POST_VISIBILITY.PUBLIC },
];

async function main(): Promise<void> {
    initializeTransactionalContext();

    const app = await NestFactory.createApplicationContext(AppModule, {
        logger: ['error', 'warn'],
    });

    const userModel = app.get<Model<UserReadDocument>>(getModelToken(UserRead.name));
    const users = await userModel.find({}, { _id: 1 }).lean();

    if (users.length === 0) {
        console.error('No users found in read model. Run seed:users first.');
        await app.close();
        process.exit(1);
    }

    const userIds = users.map((u) => u._id);
    console.log(`Found ${userIds.length} users. Seeding ${SEED_POSTS.length} posts with random authors...`);

    const postService = app.get<IPostApplicationService>(POST_APPLICATION_SERVICE_TOKEN);

    let created = 0;
    for (const input of SEED_POSTS) {
        const authorId = userIds[Math.floor(Math.random() * userIds.length)];
        try {
            const post = await postService.createPost(authorId, input);
            created++;
            console.log(`  [${created}/${SEED_POSTS.length}] ${post.id} by ${authorId} — ${input.content?.slice(0, 50)}...`);
        } catch (err) {
            console.error(`  FAILED: ${input.content?.slice(0, 50)}...`, err instanceof Error ? err.message : err);
        }
    }

    console.log(`\nSeeded ${created}/${SEED_POSTS.length} posts.`);
    console.log('Wait a few seconds for CDC (Debezium → Kafka → ES) to propagate, then search.');

    await app.close();
    process.exit(0);
}

main().catch((err) => {
    console.error('Fatal seed error:', err);
    process.exit(1);
});
