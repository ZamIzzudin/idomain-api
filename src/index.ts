import { config } from "./config";
import { app, initializeApp } from "./app";

const start = async () => {
  await initializeApp({ seedOnBoot: true });

  app.listen(config.port, () => {
    console.log(`iDomain API listening on http://localhost:${config.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start iDomain API", error);
  process.exit(1);
});
