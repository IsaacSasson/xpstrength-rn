export async function outgoingRequestFormat(value) {
    if (!Array.isArray(value)) {
        throw new Error("outgoingRequests must be an array Obj.");
    }
    const duplicates = new Set();
    value.forEach((id) => {
        if (typeof (id) != "number" || !Number.isInteger(id)) {
            throw new Error("outgoingRequests ID must be a valid Integer.");
        }
        if (duplicates.has(id)) {
            throw new Error("outgoing ID is duplicated in array");
        } else {
            duplicates.add(id);
        }
    })
}