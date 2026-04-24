import { ApiProperty } from '@nestjs/swagger';

export class UserDTO {
    @ApiProperty({ description: 'User ID' })
    id: string;

    @ApiProperty({ description: 'Full name of the user' })
    fullName: string;

    @ApiProperty({ description: 'Email address' })
    email: string;

    @ApiProperty({ description: 'Phone number', required: false })
    phone: string;

    @ApiProperty({ description: 'Gender/Sex', required: false })
    sex: string;

    @ApiProperty({ description: 'Avatar URL', required: false })
    avatarUrl?: string;

    @ApiProperty({ description: 'User interests', type: [String] })
    interests: string[];

    @ApiProperty({ description: 'Whether user has completed onboarding' })
    hasCompletedOnboarding: boolean;

    @ApiProperty({ description: 'Account creation date', required: false })
    createdAt?: Date;

    @ApiProperty({ description: 'Last update date', required: false })
    updatedAt?: Date;

    @ApiProperty({ description: 'Deletion date if soft deleted', required: false })
    deletedAt?: Date;
}