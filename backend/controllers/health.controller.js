export async function healthCheck(_req, res, next) {
    try {
        return res.sendStatus(200);
    } catch (err) {
        next(err);
    }
}

export default { healthCheck };