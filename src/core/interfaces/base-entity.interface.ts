import { v4 as uuidv4 } from 'uuid';

export abstract class Entity {
    public readonly id: string;
    public createdAt: Date;
    public updatedAt: Date;
    public deletedAt: Date | null;

    constructor(id?: string) {
        this.id = id ? id : uuidv4();
    }

    deleteEntity() {
        this.deletedAt = new Date();
    }
}
