export const SHARED_STORE_KEYS = {
    USER: {
        INFO: 'user:profile',
    }
}

export class SharedStoreKeyHelper {
    static getUserInfoKey(userId: string) {
        return `${SHARED_STORE_KEYS.USER.INFO}:${userId}`;
    }
}