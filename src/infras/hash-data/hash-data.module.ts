import { Global, Module } from '@nestjs/common';
import { DIToken } from 'src/core/enums/di-tokens.enum';
import { HashDataService } from './hash-data.service';

@Module({
    providers: [
        {
            provide: DIToken.HASH_SERVICE,
            useClass: HashDataService,
        },
    ],
    exports: [DIToken.HASH_SERVICE],
})
@Global()
export class HashDataModule {}
