import express from "express";
import { promises } from "fs";
import { join } from "path";
const app = express();

export default class ExpressApp {
  async init() {
    this.loadRouters();
    app.use(express.json());
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
