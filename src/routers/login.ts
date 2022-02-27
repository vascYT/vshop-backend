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

    response = await fetch("https://auth.riotgames.com/api/v1/authorization", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: response.headers["set-cookie"],
      },
      body: JSON.stringify({
        type: "auth",
        username,
        password,
      }),
    });

    if (response.body.error) {
      res.json({
        success: false,
        error: response.body.error,
      });
    } else if (response.body.type === "multifactor") {
      res.json({
        mfaRequired: true,
        mfaEmail: response.body.multifactor.email,
        cookie: response.headers["set-cookie"],
      });
    } else if (response.body.type === "response") {
      const accessToken = response.body.response.parameters.uri.match(
        /access_token=((?:[a-zA-Z]|\d|\.|-|_)*).*id_token=((?:[a-zA-Z]|\d|\.|-|_)*).*expires_in=(\d*)/
      )[1];
      const entitlementsToken = await getEntitlementsToken(accessToken);

      res.json({
        success: true,
        accessToken,
        entitlementsToken,
      });
    }
  } catch (error: any) {
    console.log(error);
    res.status(500).json({
      success: false,
      error: "An unknown error occured",
    });
  }
});

router.post("/mfa", async (req, res) => {
  const response = await fetch(
    "https://auth.riotgames.com/api/v1/authorization",
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        cookie: req.body.cookie,
      },
      body: JSON.stringify({
        type: "multifactor",
        code: req.body.code,
        rememberDevice: false,
      }),
    }
  );

  console.log(response.body);

  if (response.body.type === "response") {
    const accessToken = response.body.response.parameters.uri.match(
      /access_token=((?:[a-zA-Z]|\d|\.|-|_)*).*id_token=((?:[a-zA-Z]|\d|\.|-|_)*).*expires_in=(\d*)/
    )[1];
    const entitlementsToken = await getEntitlementsToken(accessToken);
    res.json({ success: true, accessToken, entitlementsToken });
  } else if (response.body.type) {
    res.json({ success: false, error: response.body.type });
  } else {
    res.json({ success: false, error: "unknown" });
  }
});

const getEntitlementsToken = async (accessToken: string) => {
  const response = await fetch(
    "https://entitlements.auth.riotgames.com/api/token/v1",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  return response.body.entitlements_token;
};

export { router, path };
