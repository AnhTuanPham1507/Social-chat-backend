import { ACCOUNT_PROVIDER } from '@modules/auth/domain/entities/account/account-provider.value-object';
import { AccountEntity } from '@modules/auth/domain/entities/account/account.entity';
import { ROLE } from '@modules/auth/domain/entities/account/role.value-object';
import { ApiProperty } from '@nestjs/swagger';

export default class AccountDTO {
    @ApiProperty({
        example: 'id',
    })
    id: string;

    @ApiProperty({
        example: 'phamanhtuan9a531@gmail.com',
    })
    email: string;

    @ApiProperty({
        enum: ROLE,
        example: ROLE.USER,
    })
    role: ROLE;

    @ApiProperty({
        enum: ACCOUNT_PROVIDER,
        example: ACCOUNT_PROVIDER.LOCAL,
    })
    provider: ACCOUNT_PROVIDER;

    constructor(accountEntity: AccountEntity) {
        return accountEntity.toObject();
    }
}
