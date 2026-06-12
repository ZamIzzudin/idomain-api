import { Router } from "express";
import multer from "multer";
import { articleController } from "./article.controller";
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

export const articleRouter = Router();

// Public
articleRouter.get("/", articleController.list);
articleRouter.get("/filter-options", articleController.filterOptions);
articleRouter.get("/slug/:slug", articleController.getBySlug);
articleRouter.get("/:id", articleController.getById);

// Protected
articleRouter.post(
  "/",
  isAuthenticated,
  upload.single("featuredImage"),
  articleController.create
);
articleRouter.put(
  "/:id",
  isAuthenticated,
  upload.single("featuredImage"),
  articleController.update
);
articleRouter.delete("/:id", isAuthenticated, articleController.remove);
