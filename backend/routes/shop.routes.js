import { Router } from "express";

const shopRouter = Router();

//Will have global market in the end

//Items available in the shop
shopRouter.get("items");

//Your coins you have
shopRouter.get("coins");

//Your purchased Items
shopRouter.get("purchases");

//To purchase an item from the Shop
shopRouter.post("purchase");

export default shopRouter;
