import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { IHashDataService } from 'src/core/interfaces/hash-data-service.interface';

@Injectable()
export class HashDataService implements IHashDataService {
    generateHash(rawData: string): string {
        const SALT_ROUNDS = 10;
        const salt = bcrypt.genSaltSync(SALT_ROUNDS);
        const hash = bcrypt.hashSync(rawData, salt);

        return hash;
    }

    validateHashString(rawData: string, hash: string): Promise<boolean> {
        return bcrypt.compare(rawData, hash);
    }
}
