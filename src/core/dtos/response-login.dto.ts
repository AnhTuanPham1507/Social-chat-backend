import { ApiProperty } from "@nestjs/swagger";

export class ResponseLoginDTO {
    
    @ApiProperty({
        example: 'access token'
    })
    accessToken: string;

    @ApiProperty({
        example: 'refresh token'
    })
    refreshToken: string;

    constructor(accessToken: string, refreshToken: string){
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
    }
}