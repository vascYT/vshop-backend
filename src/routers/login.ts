import express from "express";
import ValorantAPI from "../utils/ValorantAPI";

const router = express.Router();
const path = "/login";

router.post("/", async (req, res) => {
  const { username, password, region } = req.body;
  let api = new ValorantAPI(username, password, region);

  try {
    let response = await api.login();

    if (response.error) {
      res.status(400).json(response);
    }
    res.json(response);
  } catch (error) {
    res
      .status(500)
      .send(JSON.stringify(error, Object.getOwnPropertyNames(error)));
  }
});

export { router, path };
