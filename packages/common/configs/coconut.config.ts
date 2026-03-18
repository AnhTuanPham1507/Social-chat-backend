import { ICoconutConfig } from './interfaces/coconut-config.interface';

export const getCoconutConfig = (): ICoconutConfig => ({
    apiKey: process.env.COCONUT_API_KEY ?? '',
    webhookUrl: process.env.COCONUT_WEBHOOK_URL ?? '',
});
