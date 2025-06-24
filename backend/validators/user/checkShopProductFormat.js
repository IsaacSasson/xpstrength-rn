import shopUnlocks from "../../../shared/shop_products.json" with { type: "json"};

export async function checkShopProductFormat(value) {
    if (!Array.isArray(value)) {
        throw new Error("Shop unlocks must be an array");
    }

    const duplicates = new Set()

    value.forEach((id) => {
        //DataType is a number
        if (typeof (id) != "number" || !Number.isInteger(id)) {
            throw new Error("Shop item ID is not a number");
        }
        //Must be a Valid ID
        if (id < 0 || id > shopUnlocks.length - 1) {
            throw new Error("Shop item ID not found in global reference")
        }
        //No Duplicate Data
        if (duplicates.has(id)) {
            throw new Error("Shop ID is duplicated in array");
        } else {
            duplicates.add(id);
        }
    })
}