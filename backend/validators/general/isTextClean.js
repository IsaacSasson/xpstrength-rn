import forbiddenWords from "./forbiddenWords.js";

export async function isTextClean(value) {
    if (value && forbiddenWords.some(word => value.toLowerCase().includes(word))) {
        throw new Error("contains inappropriate language");
    }
}