import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { JWTService } from './services/jwt.service';

@Module({
  imports: [
    JwtModule.register({
        secret: process.env.JWT_SECRET, // Replace with your secret key
        signOptions: { expiresIn: process.env.JWT_TOKEN_EXPIRE }, // Token expiration time
    }),
  ],
  providers: [JWTService],
  exports: [JWTService],
})
@Global()
export class AuthModule {}