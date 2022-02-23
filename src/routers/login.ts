import express from "express";
import { fetch } from "../utils/misc";

const router = express.Router();
const path = "/login";

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    let response: any = await fetch(
      "https://auth.riotgames.com/api/v1/authorization",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: "play-valorant-web-prod",
          response_type: "token id_token",
          redirect_uri: "https://playvalorant.com/opt_in",
          scope: "account openid",
          nonce: "1",
        }),
      }
    );
    let cookie = response.headers["set-cookie"];
    console.log("Opt in done");

    response = await fetch("https://auth.riotgames.com/api/v1/authorization", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie,
      },
      body: JSON.stringify({
        type: "auth",
        username,
        password,
      }),
    });

    if (response.body.error === "auth_failure")
      res.json({
        error: "Your username or password is incorrect",
      });
    else if (response.body.error === "rate_limited")
      res.json({
        error: "Thats a little to fast, please try again later.",
      });
    else if (response.body.type === "multifactor") {
      res.json({
        mfaRequired: true,
        mfaEmail: response.body.multifactor.email,
      });
    } else if (response.body.type === "response") {
      const accessToken = response.body.response.parameters.uri.match(
        /access_token=((?:[a-zA-Z]|\d|\.|-|_)*).*id_token=((?:[a-zA-Z]|\d|\.|-|_)*).*expires_in=(\d*)/
      )[1];
      console.log("Login done");

      response = await fetch(
        "https://entitlements.auth.riotgames.com/api/token/v1",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      const entitlementsToken = response.body.entitlements_token;
      console.log("Entitlements done");

      res.json({
        success: true,
        accessToken,
        entitlementsToken,
      });
    } else {
      res.json({ error: "Oops, an unkown error occoured." });
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "An unknown error occured",
    });
  }
});

export { router, path };
