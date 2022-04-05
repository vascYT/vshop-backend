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
    const dbUser = await prisma.user.findFirst({
      where: {
        riotId: api.userId,
      },
    });

    if (
      dbUser &&
      dbUser.nightMarket &&
      dbUser.lastNightMarketUpdate.getDate() === new Date().getDate() &&
      dbUser.nightMarketRegion === region
    ) {
      // Return stored shop
      res.json({ success: true, nightMarket: dbUser.nightMarket });
    } else {
      const nightMarket: any = await api.getNightMarket();

      // Save market in database
      await prisma.user.upsert({
        where: {
          riotId: api.userId,
        },
        update: {
          riotId: api.userId,
          nightMarket,
          lastNightMarketUpdate: new Date(),
          nightMarketRegion: region,
        },
        create: {
          riotId: api.userId,
          nightMarket,
          nightMarketRegion: region,
        },
      });

      res.json({ success: true, nightMarket });
    }
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "An error occured",
    });
  }
});

export { router, path };
