import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsUUID, Length } from 'class-validator';

export class CreateUserDto {
    @ApiProperty({ description: 'User ID (Keycloak sub)' })
    @IsUUID()
    id: string;

    @ApiProperty({ description: 'User email address' })
    @IsEmail()
    email: string;

    @ApiProperty({ description: 'Full name (2-100 characters)' })
    @IsString()
    @Length(2, 100, { message: 'Full name must be between 2 and 100 characters' })
    fullName: string;
}
