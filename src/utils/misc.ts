import axios from "axios";
import { Request, Response } from "express";
import { Agent } from "https";
import { SocksProxyAgent } from "socks-proxy-agent";

const ciphers = ["TLS_AES_128_GCM_SHA256"];
const socksUrl = `socks5://${process.env.PROXY_USERNAME}:${process.env.PROXY_PASSWORD}@${process.env.PROXY_HOST}:${process.env.PROXY_PORT}`;
const userAgent =
  "RiotClient/43.0.1.4195386.4190634 rso-auth (Windows; 10;;Professional, x64)";
const clientVersion = "release-04.11-shipping-7-720199";
const clientPlatform = {
  Type: "PC",
  OS: "Windows",
  Version: "10.0.19043.1.256.64bit",
  Chipset: "Unknown",
};

const agent = new Agent({
  ciphers: ciphers.join(":"),
  honorCipherOrder: true,
  minVersion: "TLSv1.3",
  keepAlive: true,
});

let httpsAgent = new SocksProxyAgent(socksUrl);
httpsAgent.options = {
  ciphers: ciphers.join(":"),
  honorCipherOrder: true,
  minVersion: "TLSv1.3",
  keepAlive: true,
};

let httpAgent = new SocksProxyAgent(socksUrl);
httpAgent.options = {
  keepAlive: true,
};

let fetchPaused = false;
export const fetch = async (
  url: string,
  options: { method: string; headers?: object; body?: object | string }
) => {
  if (!fetchPaused) {
    const res = await axios({
      method: options.method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": userAgent,
        "X-ClientVersion": clientVersion,
        "X-ClientPlatform": Buffer.from(
          JSON.stringify(clientPlatform)
        ).toString("base64"),
        ...options.headers,
      },
      data: options.body,
      url,
      httpsAgent: agent,
    });
    if (res.status === 429) {
      fetchPaused = true;
      console.log("Rate limited by server, pausing fetch...");
      console.log(res.headers);
      setTimeout(() => {
        fetchPaused = false;
        console.log("Resuming fetch...");
      }, Number.parseInt(res.headers["retry-after"]));
    } else {
      console.log(`${options.method} ${url}, status: ${res.status}`);
    }
    return res;
  } else {
    throw "fetch paused";
  }
};

export const VCurrencies = {
  VP: "85ad13f7-3d1b-5128-9eb2-7cd8ee0b5741", // VP
  RAD: "e59aa87c-4cbf-517a-5983-6e81511be9b7", // Radianite Points
  FAG: "f08d4ae3-939c-4576-ab26-09ce1f23bb37", // Free Agents
};

const sendNotification = async (msg: string) => {
  await fetch(process.env.WEBHOOK_URL || "", {
    method: "POST",
    body: JSON.stringify({ content: msg }),
    headers: {
      "Content-Type": "application/json",
    },
  });
};

export const getIP = (req: Request, res: Response) =>
  (req.headers["cf-connecting-ip"] as string) || req.ip;
