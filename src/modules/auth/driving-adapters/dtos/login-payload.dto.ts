import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsStrongPassword } from "class-validator";

export class LoginPayloadDTO {

    @IsNotEmpty({
        message: "Email là thông tin bắt buộc"
    })
    @IsEmail({}, {
        message: "Email phải đúng định dạng"
    })
    @ApiProperty({
        example: 'phamanhtuan9a531@gmail.com'
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