export async function incomingRequestsFormat(value) {
    if (!Array.isArray(value)) {
        throw new Error("incomingRequests must be an array Obj.");
    }
    const duplicates = new Set();
    value.forEach((id) => {
        if (typeof (id) != "number" || !Number.isInteger(id)) {
            throw new Error("incomingRequests ID must be a valid Integer.");
        }
        if (duplicates.has(id)) {
            throw new Error("incomingRequests ID is duplicated in array");
        } else {
            duplicates.add(id);
        }
    })
}