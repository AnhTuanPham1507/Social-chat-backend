export interface IUseCase<IRequest, IResponse> {
    execute(payload?: IRequest, actor?: string): Promise<IResponse> | IResponse;
}
