import { IGoogleAuthConfig } from './interfaces/google-config.interface';

export const getGoogleAuthConfig = (): IGoogleAuthConfig => ({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackUrl: process.env.GOOGLE_CALLBACK_URL,
});
