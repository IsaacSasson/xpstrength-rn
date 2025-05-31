export async function error(_err) {
    console.error("Logic Error Occured: Stack Trace Below")
    console.error(_err);
}

export default { error };