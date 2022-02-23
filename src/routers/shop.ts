import express from "express";
import ValorantAPI from "../utils/ValorantAPI";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const path = "/shop";
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const { riotaccesstoken, riotentitlementstoken, region } = req.headers as any;
  let api = new ValorantAPI(riotaccesstoken, riotentitlementstoken, region);

  try {
    await api.init();
    const shop: any = await api.getShop();

    // Save market in database
    await prisma.user.upsert({
      where: {
        riotId: api.userId,
      },
      update: {
        riotId: api.userId,
        shop,
        lastUpdate: new Date(),
      },
      create: {
        riotId: api.userId,
        name: api.username,
        shop,
      },
    });

    res.json(shop);
  } catch (error: any) {
    if (error.response && error.response.status === 401) {
      res.status(401).json({ error: "Unauthorized" });
    } else {
      console.log(error);
      res.status(500).json({
        success: false,
        error: "An unknown error occured",
      });
    }
  }
});

export { router, path };
