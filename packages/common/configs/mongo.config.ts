import { IMongoConfig } from './interfaces/mongo-config.interface';

export const getMongoConfig = (): IMongoConfig => ({
    uri:
        process.env.MONGO_URI ||
        `mongodb://${process.env.MONGO_USERNAME || 'mongo'}:${process.env.MONGO_PASSWORD || 'mongo123'}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || '27017'}/${process.env.MONGO_DATABASE || 'social-chat'}?authSource=admin`,
});
