import { CreateAssetPayloadDTO } from '@modules/asset/driving-adapters/dtos/create-asset-payload.dto';
import { USER_SEX } from '@modules/auth/domain/entities/user/user-sex.value-object';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsOptional,
    IsPhoneNumber,
    IsString,
    IsStrongPassword,
    MinLength,
    ValidateNested,
} from 'class-validator';

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
    })
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

    @IsNotEmpty({ message: 'Số điện thoại là thông tin bắt buộc' })
    @IsPhoneNumber('VN', {
        message: 'Số điện thoại không hợp lệ',
    })
    @ApiProperty({
        example: '0778821404',
    })
    phone: string;

    @IsNotEmpty({ message: 'Giới tính là thông tin bắt buộc' })
    @IsEnum(USER_SEX, {
        message: 'Giới tính không hợp lệ',
    })
    @ApiProperty({
        enum: USER_SEX,
        example: USER_SEX.MALE,
    })
    sex: USER_SEX;

    @ApiProperty({
        type: CreateAssetPayloadDTO,
    })
    @IsOptional()
    @Type(() => CreateAssetPayloadDTO)
    @ValidateNested()
    avatar: CreateAssetPayloadDTO;
}
