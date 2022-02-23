import https from "https";

// tlsChiphers from SkinPeek (https://github.com/giorgi-o/SkinPeek/blob/f26d84533b10419399010db63db00a6e9a5dd420/misc/util.js#L4)
const tlsCiphers = [
  "TLS_AES_128_GCM_SHA256",
  "TLS_AES_256_GCM_SHA384",
  "TLS_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256",
  "TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256",
  "TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384",
  "TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384",
  "TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256",
  "TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA",
  "TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA",
  "TLS_RSA_WITH_AES_128_GCM_SHA256",
  "TLS_RSA_WITH_AES_256_GCM_SHA384",
  "TLS_RSA_WITH_AES_128_CBC_SHA",
  "TLS_RSA_WITH_AES_256_CBC_SHA",
];

export const fetch = (url: string, options = {} as any) => {
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: options.method,
        headers: {
          ...options.headers,
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)",
        },
        ciphers: tlsCiphers.join(":"),
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
          }

          resolve(response);
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
