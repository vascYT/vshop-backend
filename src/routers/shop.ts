import express from "express";
import { getRiotId, getUser, setUser } from "../Redis";
import ValorantAPI from "../utils/ValorantAPI";

const router = express.Router();
const path = "/shop";

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
      const user = await getUser(riotId);

      let api = new ValorantAPI(
        riotaccesstoken,
        riotentitlementstoken,
        region,
        riotId
      );

      if (
        user &&
        user.shop &&
        new Date(user.lastUpdate).getDate() === new Date().getDate() &&
        user.region === region
      ) {
        // Return stored shop
        res.json({ success: true, ...(user.shop as any) });
      } else {
        const shop: any = await api.getShop();

        // Save market
        await setUser({
          riotId,
          shop,
          lastUpdate: new Date().getTime(),
          region,
        });

        res.json({ success: true, ...shop });
      }
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
