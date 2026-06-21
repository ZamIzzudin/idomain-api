import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config";
import { authRouter } from "./modules/auth/auth.route";
import { roleRouter } from "./modules/role/role.route";
import { alumniRouter } from "./modules/alumni/alumni.route";
import { articleRouter } from "./modules/article/article.route";
import { eventRouter } from "./modules/event/event.route";
import { testimonialRouter } from "./modules/testimonial/testimonial.route";
import { uploadRouter } from "./modules/upload/upload.route";
import { settingRouter } from "./modules/setting/setting.route";
import { careerRouter } from "./modules/career/career.route";
import { categoryRouter } from "./modules/category/category.route";
import { notificationRouter } from "./modules/notification/notification.route";
import { pushRouter } from "./modules/push/push.route";
import { prisma } from "./lib/prisma";
import { seedGenesisAccount, seedSiteSettings } from "./seed";

export const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));

// Request logger
app.use((req, res, next) => {
  res.on("finish", () => {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    console.log(`[${time}] ${req.method} ${req.originalUrl} ${res.statusCode}`);
  });
  next();
});

// Health check
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/", (_req, res) => {
  res.json({
    message: "Welcome to iDomain API",
  });
});

// Routes
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/roles", roleRouter);
app.use("/api/v1/alumni", alumniRouter);
app.use("/api/v1/articles", articleRouter);
app.use("/api/v1/events", eventRouter);
app.use("/api/v1/testimonials", testimonialRouter);
app.use("/api/v1/upload", uploadRouter);
app.use("/api/v1/settings", settingRouter);
app.use("/api/v1/careers", careerRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/push", pushRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({
    status: 404,
    message: "Endpoint not found",
  });
});

let initPromise: Promise<void> | null = null;

type InitializeOptions = {
  seedOnBoot?: boolean;
};

export const initializeApp = async ({
  seedOnBoot = false,
}: InitializeOptions = {}) => {
  if (!initPromise) {
    initPromise = (async () => {
      await prisma.$connect();
      if (seedOnBoot) {
        await seedGenesisAccount();
        await seedSiteSettings();
      }
    })();
  }

  await initPromise;
};
