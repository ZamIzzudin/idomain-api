import { app, initializeApp } from "../src/app";

export default async function handler(req: any, res: any) {
  await initializeApp({ seedOnBoot: false });
  return app(req, res);
}
