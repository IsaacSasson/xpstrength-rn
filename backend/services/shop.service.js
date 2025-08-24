import mapSequelizeError from "../utils/mapSequelizeError.js";
import shopUnlocks from "../../shared/shop_products.json" with { type: "json"};
import AppError from "../utils/AppError.js";

export async function getCoins(user) {
  try {
    console.log(user.totalCoins)
    return user.totalCoins ?? 0;
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function getUnlocks(user) {
  try {
    return user.shopUnlocks ?? [];
  } catch (err) {
    throw mapSequelizeError(err);
  }
}

export async function purchaseItem(user, itemId) {
  try {
  if ( itemId >= shopUnlocks.length ) {
    throw new AppError("Shop Item Does not exist", 400, "BAD_DATA");
  }

  if (user.totalCoins < shopUnlocks[itemId].price || user.totalCoins - shopUnlocks[itemId].price < 0) {
    throw new AppError("User cannot afford item", 400, "INSUFFICIENT_FUNDS")
  }

  const userShopunlocks = user.shopUnlocks;

  for( let i = 0; i < userShopunlocks.length; i++) {
    if (userShopunlocks[i] === itemId) {
      throw new AppError("Cannot purchase an item twice", 409, "DUPLICATE");
    }
  }

  user.totalCoins = Math.max(user.totalCoins - shopUnlocks[itemId].price, 0)
  userShopunlocks.push(itemId);
  user.changed('shopUnlocks', true);
  await user.save();

  return userShopunlocks;

} catch(err) {
  throw mapSequelizeError(err);
}
}

export default { getCoins, getUnlocks, purchaseItem}