import { IsString, IsUUID } from "class-validator";

export class GetOneUserDTO {
    @IsUUID(null, {
        message: 'Mã người dùng không hợp lệ'
    })
    id: string;
}