export async function friendStoreFormat(value) {
    if (!Array.isArray(value)) {
        throw new Error("friends must be an array Obj.");
    }
    const duplicates = new Set();
    value.forEach((id) => {
        if (typeof (id) != "number" || !Number.isInteger(id)) {
            throw new Error("friends ID must be a valid Integer.");
        }
        if (duplicates.has(id)) {
            throw new Error("friends ID is duplicated in array");
        } else {
            duplicates.add(id);
        }
    })
}