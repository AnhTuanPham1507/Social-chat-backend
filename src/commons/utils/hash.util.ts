import * as bcrypt from 'bcrypt';

export function generateHash(rawData: string, saltRounds: number = 10): string {
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(rawData, salt);

    return hash;
}

export function validateHashString(rawData: string, hash: string): Promise<boolean> {
    return bcrypt.compare(rawData, hash);
}