import { Router } from "express";
import multer from "multer";
import { eventController } from "./event.controller";
import { isAuthenticated } from "../../middlewares/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (Cloudinary free plan max)
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

export const eventRouter = Router();

// Public
eventRouter.get("/", eventController.list);
eventRouter.get("/filter-options", eventController.filterOptions);
eventRouter.get("/slug/:slug", eventController.getBySlug);
eventRouter.get("/:id", eventController.getById);

// Protected
eventRouter.post(
  "/",
  isAuthenticated,
  upload.single("featuredImage"),
  eventController.create
);
eventRouter.put(
  "/:id",
  isAuthenticated,
  upload.single("featuredImage"),
  eventController.update
);
eventRouter.delete("/:id", isAuthenticated, eventController.remove);
