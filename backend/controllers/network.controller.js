import networkService from "../services/network.service.js";
import AppError from "../utils/AppError.js";

//In future logout disconects them from websocket
export async function postLogoutUser(req, res, next) {
  const user = req?.user;

  if (!user || !user.id) {
    return next(new AppError("No user data", 400, "BAD_DATA"));
  }
  try {
    await networkService.logoutUser(res, user.id);
    return res.status(200).json({ message: "User succesfully logged out!" });
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

export default { postLogoutUser, getSocketToken };
