export const PRESENCE_REPO_TOKEN = Symbol('PRESENCE_REPO_TOKEN');

export interface PresenceMutationResult {
    status: boolean;
    lastSeenAt: Date | null;
    transitioned: 'online' | 'offline' | null;
}

export interface IPresenceRepository {
    heartbeat(userId: string, deviceField: string): Promise<PresenceMutationResult>;
    disconnect(userId: string, deviceField: string): Promise<PresenceMutationResult>;
    logoutDevice(userId: string, deviceIdPrefix: string): Promise<PresenceMutationResult>;
}
