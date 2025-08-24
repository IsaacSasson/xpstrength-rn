import AppError from "../utils/AppError.js";
import shopService from "../services/shop.service.js";

export async function getCoins(req, res, next) {
  try {
    const user = req?.user ?? null;

    if (!user) {
      throw new AppError("User ID malformed", 400, "BAD_DATA");
    }

    const coins = await shopService.getCoins(user);

    return res.status(200).json({
      data: {
        coins: coins,
      },
      message: "Succesfully retrived user's coins",
    });
  } catch (err) {
    next(err);
  }
}

export async function postPurchase(req, res, next) {
  try {
    const ItemId = req?.body?.data?.itemId ?? null;
    const user = req?.user ?? null;

    if (!user || !ItemId) {
      throw new AppError("Malfored ItemID or userID", 400, "BAD_DATA");
    }
    const shopUnlocks = await shopService.purchaseItem(user, ItemId);

    return res.status(201).json({
      data: {
        shopUnlocks: shopUnlocks,
      },
      message: "Succesfully purchased Item",
    });
  } catch (err) {
    next(err);
  }
}

export async function getUnlocks(req, res, next) {
  try {
    const user = req?.user ?? null;

    if (!user) {
      throw new AppError("Malfored user data", 400, "BAD_DATA");
    }

    const shopUnlocks = await shopService.getUnlocks(user);

    return res.status(201).json({
      data: {
        shopUnlocks: shopUnlocks,
      },
      message: "Succesfully retrieved shop unlocks",
    });
  } catch (err) {
    next(err);
  }
}

export default { getCoins, getUnlocks, postPurchase };
