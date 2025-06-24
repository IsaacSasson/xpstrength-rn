import authorityTypes from "../../../shared/role_types.json" with { type: "json" };

export async function checkAuthType(value) {
    if (value && !(authorityTypes.some(role => value === role.access))) {
        throw new Error("Authority type unknown");
    }
}