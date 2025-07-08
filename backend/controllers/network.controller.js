import networkService from "../services/network.service.js";

export async function postLogoutUser(req, res, next) {
    try {
        return;
    } catch (err) {
        next(err);
    }
}

export async function getSocketToken(req, res, next) {
    try {
        return;
    } catch (err) {
        next(err);
    }
}

export default { postLogoutUser, getSocketToken }