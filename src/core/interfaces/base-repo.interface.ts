export type IQueryOptions = {
    selections?: string[];
    queryParams?: object[];
}
export interface IRepo<T> {
    create(t: T): Promise<T>;
    findOne(query: IQueryOptions): Promise<T | null>;
}
