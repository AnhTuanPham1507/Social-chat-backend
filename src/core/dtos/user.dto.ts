import { UserSex } from '../../core/enums/user.enum';
import { UserEntity } from '../../core/entities/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export default class UserDTO {
    @ApiProperty({
        example: 'id',
    })
    id: string;

    @ApiProperty({
        example: 'Phạm Anh Tuấn',
    })
    fullName: string;

    @ApiProperty({
        example: 'phamanhtuan9a531@gmail.com',
    })
    email: string;

    @ApiProperty({
        example: '0778821404',
    })
    phone: string;

    @ApiProperty({
        enum: UserSex,
        example: UserSex.MALE,
    })
    sex: UserSex;

    constructor(userEntity: UserEntity) {
        this.id = userEntity.id;
        this.fullName = userEntity.fullName;
        this.email = userEntity.email;
        this.phone = userEntity.phone;
        this.sex = userEntity.sex;
    }
}
