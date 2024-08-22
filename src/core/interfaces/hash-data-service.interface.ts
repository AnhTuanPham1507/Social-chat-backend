export interface IHashDataService {
    generateHash(rawData: string): string;
    validateHashString(rawData: string, hash: string): Promise<boolean>;
}
