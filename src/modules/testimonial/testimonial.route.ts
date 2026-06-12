import { Router } from "express";
import multer from "multer";
import { testimonialController } from "./testimonial.controller";
import { isAuthenticated } from "../../middlewares/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB (Cloudinary free plan max)
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only images are allowed"));
  },
});

export const testimonialRouter = Router();

// Public
testimonialRouter.get("/", testimonialController.list);
testimonialRouter.get("/published", testimonialController.listPublished);
testimonialRouter.get("/:id", testimonialController.getById);

// Protected
testimonialRouter.post("/", isAuthenticated, upload.single("photo"), testimonialController.create);
testimonialRouter.put("/:id", isAuthenticated, upload.single("photo"), testimonialController.update);
testimonialRouter.delete("/:id", isAuthenticated, testimonialController.remove);
