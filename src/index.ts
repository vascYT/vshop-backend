import "dotenv/config";
import ExpressApp from "./ExpressApp";
const app = new ExpressApp();

async function main() {
  await app.init();
}

main().catch((e) => {
  throw e;
});
