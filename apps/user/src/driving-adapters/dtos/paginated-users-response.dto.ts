import { ApiProperty } from '@nestjs/swagger';
import { UserDTO } from './user.dto';

export class PaginatedUsersResponseDto {
    @ApiProperty({ type: [UserDTO] })
    data: UserDTO[];

    @ApiProperty({ description: 'Total number of users' })
    total: number;

    @ApiProperty({ description: 'Current page' })
    page: number;

    @ApiProperty({ description: 'Items per page' })
    limit: number;
}
