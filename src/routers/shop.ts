import express from "express";
import ValorantAPI from "../utils/ValorantAPI";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const path = "/shop";
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

    if (!dbToken) {
      res.status(401).json({
        success: false,
        error: "Access token not found",
      });
      return;
    }

    let api = new ValorantAPI(
      riotaccesstoken,
      riotentitlementstoken,
      region,
      dbToken?.riotId || ""
    );

    if (
      dbToken.user &&
      dbToken.user.shop &&
      dbToken.user.lastUpdate.getDate() === new Date().getDate() &&
      dbToken.user.region === region
    ) {
      // Return stored shop
      res.json({ success: true, ...(dbToken.user.shop as any) });
    } else {
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
          region,
        },
        create: {
          riotId: api.userId,
          shop,
          region,
        },
      });

      res.json({ success: true, ...shop });
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
