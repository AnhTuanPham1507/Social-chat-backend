import { ASSET_TYPE } from '@modules/asset/domain/entities/asset/asset-type.value-object';
import { AssetEntity } from '@modules/asset/domain/entities/asset/asset.entity';
import { MIME_TYPE } from '@modules/asset/domain/entities/asset/mime-type.value-object';
import { CreateAssetPayloadDTO } from '@modules/asset/driving-adapters/dtos/create-asset-payload.dto';
import { ACCOUNT_PROVIDER } from '@modules/auth/domain/entities/account/account-provider.value-object';
import { AccountEntity } from '@modules/auth/domain/entities/account/account.entity';
import { ROLE } from '@modules/auth/domain/entities/account/role.value-object';
import { USER_SEX } from '@modules/auth/domain/entities/user/user-sex.value-object';
import { UserEntity } from '@modules/auth/domain/entities/user/user.entity';
import AccountDTO from '@modules/auth/driving-adapters/dtos/account.dto';
import { GoogleLoginPayloadDTO } from '@modules/auth/driving-adapters/dtos/google-login-payload.dto';
import { LoginPayloadDTO } from '@modules/auth/driving-adapters/dtos/login-payload.dto';
import RegisterPayloadDTO from '@modules/auth/driving-adapters/dtos/register-payload.dto';
import { UUID } from '@beincom/domain';

export class AuthTestFactory {
    static createLoginPayload(
        overrides?: Partial<LoginPayloadDTO>,
    ): LoginPayloadDTO {
        return {
            email: 'test@example.com',
            password: 'TestPassword123!',
            ...overrides,
        };
    }

    static createRegisterPayload(
        overrides?: Partial<RegisterPayloadDTO>,
    ): RegisterPayloadDTO {
        return {
            fullName: 'Test User',
            email: 'test@example.com',
            password: 'TestPassword123!',
            phone: '0778824109',
            sex: USER_SEX.MALE,
            avatar: this.createAssetPayload(),
            ...overrides,
        };
    }

    static createGoogleLoginPayload(
        overrides?: Partial<GoogleLoginPayloadDTO>,
    ): GoogleLoginPayloadDTO {
        return {
            sub: 'google-user-123',
            email: 'test@gmail.com',
            picture: 'https://example.com/avatar.jpg',
            name: 'Test User',
            ...overrides,
        };
    }

    static createAssetPayload(
        overrides?: Partial<CreateAssetPayloadDTO>,
    ): CreateAssetPayloadDTO {
        return {
            fileName: 'avatar.jpg',
            fileBuffer: Buffer.from('mock-file-content'),
            fileSize: 1024,
            mimeType: MIME_TYPE.JPEG,
            assetType: ASSET_TYPE.IMAGE,
            ...overrides,
        };
    }

    static createMockFile(
        overrides?: Partial<Express.Multer.File>,
    ): Express.Multer.File {
        return {
            originalname: 'avatar.jpg',
            buffer: Buffer.from('mock-file-content'),
            size: 1024,
            mimetype: 'image/jpeg',
            fieldname: 'avatar',
            encoding: '7bit',
            destination: '',
            filename: '',
            path: '',
            stream: null,
            ...overrides,
        } as Express.Multer.File;
    }

    static createMockAccountEntity(overrides?: any): AccountEntity {
        return AccountEntity.create({
            id: UUID.generate(),
            email: 'test@example.com',
            provider: ACCOUNT_PROVIDER.LOCAL,
            role: ROLE.USER,
            password: 'hashed-password',
            ...overrides,
        });
    }

    static createMockUserEntity(overrides?: any): UserEntity {
        return UserEntity.create({
            id: UUID.generate(),
            fullName: 'Test User',
            email: 'test@example.com',
            phone: '0778859867',
            sex: USER_SEX.MALE,
            ...overrides,
        });
    }

    static createMockAssetEntity(overrides?: any): AssetEntity {
        return AssetEntity.create({
            id: UUID.generate(),
            url: 'https://example.com/avatar.jpg',
            fileName: 'avatar.jpg',
            fileSize: 1024,
            mimeType: MIME_TYPE.JPEG,
            assetType: ASSET_TYPE.IMAGE,
            ...overrides,
        });
    }

    static createAccountDTO(overrides?: Partial<AccountDTO>): AccountDTO {
        const mockAccount = this.createMockAccountEntity();
        return new AccountDTO(mockAccount);
    }

    static createMockRequest(): any {
        return {
            user: {
                id: UUID.generate(),
                email: 'test@example.com',
                accessToken: 'mock-access-token',
                refreshToken: 'mock-refresh-token',
            },
            body: {},
        };
    }

    static createMockResponse(): any {
        const res = {
            cookie: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
            status: jest.fn().mockReturnThis(),
            send: jest.fn().mockReturnThis(),
        };
        return res;
    }
}
