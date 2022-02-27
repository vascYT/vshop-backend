import express from "express";
import ValorantAPI from "../utils/ValorantAPI";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const path = "/nightmarket";
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const { riotaccesstoken, riotentitlementstoken, region } = req.headers as any;
  let api = new ValorantAPI(riotaccesstoken, riotentitlementstoken, region);

  try {
    await api.init();
    const nightMarket: any = await api.getNightMarket();

    // Save market in database
    await prisma.user.upsert({
      where: {
        riotId: api.userId,
      },
      update: {
        riotId: api.userId,
        nightMarket,
        lastUpdate: new Date(),
      },
      create: {
        riotId: api.userId,
        name: api.username,
        nightMarket,
      },
    });

    res.json({ success: true, nightMarket });
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "An error occured",
    });
  }
});

export { router, path };
