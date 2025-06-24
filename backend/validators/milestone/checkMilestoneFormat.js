import milestones from "../../../shared/milestones.json" with { type: "json"};

export async function checkMilestoneFormat(value) {
    if (!Array.isArray(value)) {
        throw new Error("Value to be stored is not of type array");
    }

    const duplicates = new Set()

    value.forEach((val, idx) => {
        if (typeof (val) != "number") {
            throw new Error("ID attempted to be stored is not a number")
        }

        if (val < 0 || val > milestones.length - 1) {
            throw new Error("Milestone ID not found");
        }

        if (duplicates.has(val)) {
            throw new Error("Milestone ID already in array");
        } else {
            duplicates.add(val);
        }

    })
}