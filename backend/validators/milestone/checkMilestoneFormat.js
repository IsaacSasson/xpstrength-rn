import milestones from "../../../shared/milestones.json" with { type: "json"};

export async function checkMilestoneFormat(value) {
   
        if (typeof (value) != "number") {
            throw new Error("ID attempted to be stored is not a number")
        }

        if (val < 0 || val > milestones.length - 1) {
            throw new Error("Milestone ID not found");
        }
}