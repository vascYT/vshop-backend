import express, { Request, Response } from "express";
import { promises } from "fs";
import { join } from "path";
import cors from "cors";
import rateLimit from "express-rate-limit";
import requestIp from "request-ip";

const app = express();

export default class ExpressApp {
  async init() {
    this.loadRouters();
    app.use(express.json());
    app.use(
      cors({
        origin: [/\.vshop\.one$/, "https://vshop.one", "http://localhost:3000"],
      })
    );

    const limiter = rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 25, // Limit each IP to 25 requests per `window` (1 minute)
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
      keyGenerator: (req: Request, res: Response) =>
        requestIp.getClientIp(req) || req.ip, // Use the IP address as the key
    });
    app.use(limiter);

    app.get("/ip", (req, res) => {
      res.send(requestIp.getClientIp(req) || req.ip);
    });

    app.listen(process.env.PORT || 3000, () => {
      console.log(`🆙 Listening http://localhost:${process.env.PORT || 3000}`);
    });
  }

  async loadRouters() {
    const eventsPath = join(__dirname, "routers");
    const listeners = await promises.readdir(eventsPath);
    for (const listenerFile of listeners) {
      const { router, path } = require(join(eventsPath, listenerFile));
      app.use(path, router);
      console.log(`Loaded router: ${path}`);
    }
  }
}
