import { BadRequestException } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { USER_SEX } from '@social-chat/domain';
import { Expose, plainToClass, Transform } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsStrongPassword,
    MinLength
} from 'class-validator';

export class LoginPayloadDTO {
    @IsNotEmpty({
        message: 'Email là thông tin bắt buộc',
    })
    @IsEmail(
        {},
        {
            message: 'Email phải đúng định dạng',
        },
    )
    @ApiProperty({
        example: 'phamanhtuan9a531@gmail.com',
    })
    email: string;

    @IsStrongPassword(
        {
            minLength: 8,
            minLowercase: 1,
            minUppercase: 1,
            minSymbols: 1,
        },
        {
            message:
                'Mật khẩu phải từ 8 ký tự, gồm ít nhất 1 chữ in hoa, 1 chữ thường, 1 chữ số và 1 ký tự đặc biệt',
        },
    )
    @ApiProperty({
        example: 'anHTunDepTra1',
    })
    password: string;
}

export default class RegisterPayloadDTO {
    @IsNotEmpty({ message: 'Họ và tên là thông tin bắt buộc' })
    @IsString({
        message: 'Họ và tên người dùng không hợp lệ',
    })
    @MinLength(4, {
        message: 'Họ và tên phải từ 4 ký tự trở lên',
    })
    @ApiProperty({
        example: 'Phạm Anh Tuấn',
        name: 'full_name',
    })
    @Expose({ name: 'full_name' })
    fullName: string;

    @IsNotEmpty({ message: 'Email là thông tin bắt buộc' })
    @IsEmail(
        {},
        {
            message: 'Email không hợp lệ',
        },
    )
    @ApiProperty({
        example: 'phamanhtuan9a531@gmail.com',
    })
    email: string;

    @IsNotEmpty({ message: 'Mật khẩu là thông tin bắt buộc' })
    @IsString({
        message: 'Mật khẩu không hợp lệ',
    })
    @MinLength(8, {
        message: 'Mật khẩu phải từ 8 ký tự trở lên',
    })
    @ApiProperty({
        example: 'anHTunDepTra1',
    })
    password: string;

    @IsPhoneNumber('VN', {
        message: 'Số điện thoại không hợp lệ',
    })
    @ApiProperty({
        example: '0778821404',
    })
    @IsOptional()
    phone?: string;

    @IsEnum(USER_SEX, {
        message: 'Giới tính không hợp lệ',
    })
    @ApiProperty({
        enum: USER_SEX,
        enumName: 'USER_SEX',
        example: USER_SEX.MALE,
        type: String,
    })
    @IsOptional()
    sex?: string;
}

export class StateDTO {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: 'https://your-frontend.com/auth/callback',
    })
    @Expose({ name: 'redirect_uri' })
    redirectUri: string;

    @IsString()
    @ApiProperty({
        example: 'web-app',
    })
    @Expose({ name: 'client_id' })
    clientId?: string;
}

export class ExchangeTokenDTO {
    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'AUTH_CODE_FROM_KEYCLOAK',
    })
    code?: string;
    
    @IsOptional()
    @ApiProperty({
        example: '{"redirectUri":"https://your-frontend.com/auth/callback","clientId":"web-app"}',
    })
    @Transform(({ value }) => {
        if(typeof value === 'string') {
            const plainObject = JSON.parse(value);
            
            return plainToClass(StateDTO, plainObject);
        }

        throw new BadRequestException('State is not a string');
    })
    state: StateDTO;
}


