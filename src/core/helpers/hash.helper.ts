import bcrypt from 'bcrypt';

export function generateHash(rawData: string): string {
    const SALT_ROUNDS = 10;
    const salt = bcrypt.genSaltSync(SALT_ROUNDS);
    const hash = bcrypt.hashSync(rawData, salt);

    return hash;
}

export function validateHashString(
    rawData: string,
    hash: string,
): Promise<boolean> {
    return bcrypt.compare(rawData, hash);
}
