import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWTService } from './jwt.service';
import { DIToken } from 'src/core/enums/di-tokens.enum';

@Module({
    imports: [
        JwtModule.registerAsync({
            useFactory: () => ({
                secret: process.env.JWT_SECRET,
            }),
        }),
    ],
    providers: [
        {
            provide: DIToken.TOKEN_SERVICE,
            useClass: JWTService,
        },
    ],
    exports: [DIToken.TOKEN_SERVICE],
})
@Global()
export class TokenModule {}
