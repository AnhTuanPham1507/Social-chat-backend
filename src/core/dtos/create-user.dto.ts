import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsNotEmpty,
    IsPhoneNumber,
    IsString,
    IsStrongPassword,
    MinLength,
} from 'class-validator';
import { UserSex } from '../enums/user-sex.enum';
import { UploadedAssetDTO } from './uploadedAsset.dto';

export default class CreateUserDTO {
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

    @IsNotEmpty({ message: 'Số điện thoại là thông tin bắt buộc' })
    @IsPhoneNumber('VN', {
        message: 'Số điện thoại không hợp lệ',
    })
    @ApiProperty({
        example: '0778821404',
    })
    phone: string;

    @IsNotEmpty({ message: 'Mật khẩu là thông tin bắt buộc' })
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
        example: '0943722631aA@',
    })
    password: string;

    @IsNotEmpty({ message: 'Giới tính là thông tin bắt buộc' })
    @IsEnum(UserSex, {
        message: 'Giới tính không hợp lệ',
    })
    @ApiProperty({
        enum: UserSex,
        example: UserSex.MALE,
    })
    sex: UserSex;

    @ApiProperty({
        type: 'string',
        format: 'binary',
    })
    avatar: any;

    uploadedAvatar: UploadedAssetDTO;
}
