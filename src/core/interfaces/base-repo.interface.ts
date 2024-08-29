export interface IRepo<T> {
    exists(t: T, fieldNames: string[]): Promise<boolean>;
    save(t: T): Promise<T>;
    findOne(query: object): Promise<T | null>;
}
