import { IAssetService } from '@modules/auth/application/contracts/asset-service.contract';

export const mockAssetService: jest.Mocked<IAssetService> = {
    createAsset: jest.fn(),
};

export const createMockAssetService = (): jest.Mocked<IAssetService> => ({
    createAsset: jest.fn(),
});
