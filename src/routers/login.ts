import express from "express";
import { setRiotId } from "../Redis";
import { fetch } from "../utils/misc";

const router = express.Router();
const path = "/login";

router.post("/", async (req, res) => {
  const { username, password } = req.body;

  try {
    let response = await fetch(
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

    if (response.data.error) {
      res.status(400).json({
        success: false,
        error: response.data.error,
      });
    } else if (response.data.type === "multifactor") {
      res.json({
        mfaRequired: true,
        mfaEmail: response.data.multifactor.email,
        cookie: response.headers["set-cookie"],
      });
    } else if (response.data.type === "response") {
      const accessToken = response.data.response.parameters.uri.match(
        /access_token=((?:[a-zA-Z]|\d|\.|-|_)*).*id_token=((?:[a-zA-Z]|\d|\.|-|_)*).*expires_in=(\d*)/
      )[1];
      const entitlementsToken = await getEntitlementsToken(accessToken);
      const riotId = await getId(accessToken);

      // Cache token
      await setRiotId(accessToken, riotId);

      res.json({
        success: true,
        accessToken,
        entitlementsToken,
      });
      console.log(`${riotId} log in done.`);
    }
  } catch (error: any) {
    console.log(error);
    res.status(400).json({
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

  if (response.data.type === "response") {
    const accessToken = response.data.response.parameters.uri.match(
      /access_token=((?:[a-zA-Z]|\d|\.|-|_)*).*id_token=((?:[a-zA-Z]|\d|\.|-|_)*).*expires_in=(\d*)/
    )[1];
    const entitlementsToken = await getEntitlementsToken(accessToken);
    const riotId = await getId(accessToken);

    // Cache token
    await setRiotId(accessToken, riotId);

    res.json({ success: true, accessToken, entitlementsToken });
    console.log(`${riotId} log in done.`);
  } else if (response.data.type) {
    res.status(400).json({ success: false, error: response.data.type });
  } else {
    res.status(400).json({ success: false, error: "unknown" });
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
  return response.data.entitlements_token;
};

const getId = async (accessToken: string) => {
  const res = await fetch("https://auth.riotgames.com/userinfo/", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });

  return res.data.sub as string;
};

export { router, path };
