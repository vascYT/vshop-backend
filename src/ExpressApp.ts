import express from "express";
import { promises } from "fs";
import { join } from "path";
import cors from "cors";

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

    // FOR TESTING
    app.set("trust proxy", true);
    app.get("/ip", (request, response) => response.send(request.ip));

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
