import { Request, Response } from "express";
import { IncomingHttpHeaders } from "http";
import https, { Agent } from "https";

// credits: https://github.com/ev3nvy/valorant-reauth-script/blob/f79a5efd3ecd7757bafa7f63a1d9ca579bd1bc58/index.js#L19
const ciphers = [
  "TLS_CHACHA20_POLY1305_SHA256",
  "TLS_AES_128_GCM_SHA256",
  "TLS_AES_256_GCM_SHA384",
  "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
];
const agent = new Agent({
  ciphers: ciphers.join(":"),
  honorCipherOrder: true,
  minVersion: "TLSv1.2",
});

export const fetch = (
  url: string,
  options: { method: string; headers?: object; body?: object | string }
) => {
  return new Promise<{
    status: number | undefined;
    headers: IncomingHttpHeaders;
    body: any;
  }>((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: options.method,
        headers: {
          ...options.headers,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        },
        agent: agent,
      },
      (res) => {
        let response = {
          status: res.statusCode,
          headers: res.headers,
          body: "",
        };

        res.on("data", (chunk) => {
          response.body += chunk;
        });

        res.on("end", () => {
          try {
            response.body = JSON.parse(response.body);
          } catch (e) {
            response.body = response.body;
          } finally {
            console.log(
              `${options.method} request to ${url} done with status code ${response.status}`
            );
            resolve(response);
          }
        });
      }
    );

    req.on("error", (err) => {
      reject(err);
    });

    if (options.body) req.write(options.body);
    req.end();
  });
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
