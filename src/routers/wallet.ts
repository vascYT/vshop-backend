import express from "express";
import { getRiotId } from "../Redis";
import ValorantAPI from "../utils/ValorantAPI";

const router = express.Router();
const path = "/wallet";

router.get("/", async (req, res) => {
  const { riotaccesstoken, riotentitlementstoken, region } = req.headers as any;

  try {
    const riotId = await getRiotId(riotaccesstoken);

    if (!riotId) {
      res.status(401).json({
        success: false,
        error: "Access token not found",
      });
    } else {
      let api = new ValorantAPI(
        riotaccesstoken,
        riotentitlementstoken,
        region,
        riotId
      );
      const wallet = await api.getWallet();

      res.json({ success: true, wallet });
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
