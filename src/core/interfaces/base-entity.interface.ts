import { v4 as uuidv4 } from 'uuid';

export abstract class Entity {
    public readonly id: string;

    constructor(id?: string) {
        this.id = id ? id : uuidv4();
    }
}
