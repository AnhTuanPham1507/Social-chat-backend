import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWTService } from './jwt.service';
import { DIToken } from 'src/core/enums/di-tokens.enum';

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET, // Replace with your secret key
            signOptions: { expiresIn: process.env.JWT_TOKEN_EXPIRE }, // Token expiration time
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
