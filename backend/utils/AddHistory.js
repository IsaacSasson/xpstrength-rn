import AppError from "./AppError.js";
import { History } from "../models/index.js";

export default class AddHistory {
  constructor(type, message, userId, actorId = null) {
    this.type = type;
    this.userId = userId;
    this.actorId = actorId;

    switch (this.type) {
      //Add More Setups in the future
      case "AUTH":
        this.message = "AUTH: " + message + " at " + Date.now();
        break;
      case "NETWORK":
        this.message = "NETWORK: " + message + " at " + Date.now();
        break;
      case "USER":
        this.message = message;
        break;
      case "FRIEND":
        this.message = message;
        break;
      default:
        throw new AppError("Unknown ActionType", 500, "INTERNAL-ERROR");
    }
  }

  async log(t) {
    const log = await History.create(
      {
        userId: this.userId,
        action: this.message,
        type: this.type,
      },
      { transaction: t }
    );
  }
}
