import express from "express";
import { fetch } from "../utils/misc";

const router = express.Router();
const path = "/ip";

router.get("/", async (req, res) => {
  const fetchRes = await fetch("https://freeipapi.com/api/json", {
    method: "GET",
  });
  res.json(fetchRes.data);
});

export { router, path };
