export interface IRepo<T> {
    exists(t: T, fieldNames: string[]): Promise<boolean>;
    insert(t: Partial<T>): Promise<Record<string, any> | null>;
    findOne(query: object): Promise<T | null>;
}
