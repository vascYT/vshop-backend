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
        shop,
      },
    });

    res.json({ success: true, ...shop });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "An error occured",
    });
  }
});

export { router, path };
