import express from "express";
import ValorantAPI from "../utils/ValorantAPI";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const path = "/nightmarket";
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const { riotaccesstoken, riotentitlementstoken, region } = req.headers as any;

  try {
    const dbToken = await prisma.token.findFirst({
      where: {
        token: riotaccesstoken,
      },
      include: {
        user: true,
      },
    });
    if (!dbToken)
      return {
        success: false,
        error: "Access token not found",
      };

    let api = new ValorantAPI(
      riotaccesstoken,
      riotentitlementstoken,
      region,
      dbToken?.riotId || ""
    );

    if (
      dbToken.user &&
      dbToken.user.nightMarket &&
      dbToken.user.lastNightMarketUpdate.getDate() === new Date().getDate() &&
      dbToken.user.nightMarketRegion === region
    ) {
      // Return stored shop
      res.json({ success: true, nightMarket: dbToken.user.nightMarket });
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
