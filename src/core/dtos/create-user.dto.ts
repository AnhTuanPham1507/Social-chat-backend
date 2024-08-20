import { ApiProperty } from '@nestjs/swagger';
import {
    IsEmail,
    IsEnum,
    IsPhoneNumber,
    IsString,
    IsStrongPassword,
    MinLength,
} from 'class-validator';
import { UserSex } from 'src/core/enums/user.enum';

export default class CreateUserDTO {
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

    @IsPhoneNumber('VN', {
        message: 'Số điện thoại không hợp lệ',
    })
    @ApiProperty({
        example: '0778821404',
    })
    phone: string;

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

    @IsEnum(UserSex, {
        message: 'Giới tính không hợp lệ',
    })
    @ApiProperty({
        enum: UserSex,
        example: UserSex.MALE,
    })
    sex: UserSex;
}
