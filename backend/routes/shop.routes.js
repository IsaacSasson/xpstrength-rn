import { Router } from "express";
import {
  getCoins,
  getUnlocks,
  postPurchase,
} from "../controllers/shop.controller.js";
const shopRouter = Router();

//Will have global market in the end

//Your coins you have
shopRouter.get("/coins", getCoins);

//Your purchased Items
shopRouter.get("/purchases", getUnlocks);

//To purchase an item from the Shop
shopRouter.post("/purchase", postPurchase);

export default shopRouter;
