export class Entity {
    id;
    constructor(id) {
        if (!id)
            throw new Error('Entity id is required');
        this.id = id;
    }
    equals(other) {
        return this.id === other.id;
    }
}
