import { PrismaClient } from "@prisma/client";
import express from "express";
import ValorantAPI from "../utils/ValorantAPI";

const router = express.Router();
const path = "/wallet";
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  const { riotaccesstoken, riotentitlementstoken, region } = req.headers as any;
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
    dbToken.riotId
  );

  try {
    const wallet = await api.getWallet();

    res.json({ success: true, wallet });
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
      success: false,
      error: "An error occured",
    });
  }
});

export { router, path };
