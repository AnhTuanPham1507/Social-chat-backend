export interface IBaseMapper<TEntity, TModel, TProps> {
    fromEntityToModel(source: TEntity): Partial<TModel>;
    fromPropsToEntity(source: TProps): TEntity;
}
