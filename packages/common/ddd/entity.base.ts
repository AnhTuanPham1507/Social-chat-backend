export type UUID = string;

export interface EntityProps<TId, TProps> {
    id?: TId;
    props: TProps;
    createdAt?: Date;
    updatedAt?: Date;
    deletedAt?: Date;
}

export abstract class Entity<TId, TProps> {
    protected _id: TId;
    protected _props: TProps;
    protected _createdAt: Date;
    protected _updatedAt: Date;
    protected _deletedAt?: Date;

    constructor(entityProps: EntityProps<TId, TProps> | any) {
        // Handle both EntityProps format and flat props format
        if (entityProps.props) {
            this._props = entityProps.props;
            this._id = entityProps.id as TId;
            this._createdAt = entityProps.createdAt || new Date();
            this._updatedAt = entityProps.updatedAt || new Date();
            this._deletedAt = entityProps.deletedAt;
        } else {
            this._props = entityProps as TProps;
            this._id = (entityProps as any).id as TId;
            this._createdAt = (entityProps as any).createdAt || new Date();
            this._updatedAt = (entityProps as any).updatedAt || new Date();
            this._deletedAt = (entityProps as any).deletedAt;
        }
    }

    public get id(): TId {
        return this._id;
    }

    public get createdAt(): Date {
        return this._createdAt;
    }

    public get updatedAt(): Date {
        return this._updatedAt;
    }

    public get deletedAt(): Date | undefined {
        return this._deletedAt;
    }

    public abstract validate(): void | never;
}
