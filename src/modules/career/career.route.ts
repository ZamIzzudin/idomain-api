import { Router } from "express";
import multer from "multer";
import { careerController } from "./career.controller";
import { isAuthenticated } from "../../middlewares/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 1 * 1024 * 1024 }, // 1MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

export const careerRouter = Router();

// Public
careerRouter.get("/", careerController.list);
careerRouter.get("/filter-options", careerController.filterOptions);
careerRouter.get("/slug/:slug", careerController.getBySlug);
careerRouter.get("/:id", careerController.getById);

// Protected - Alumni (create, manage own)
careerRouter.post(
  "/",
  isAuthenticated,
  upload.single("logo"),
  careerController.create
);
careerRouter.put(
  "/:id",
  isAuthenticated,
  upload.single("logo"),
  careerController.update
);
careerRouter.delete("/:id", isAuthenticated, careerController.remove);

// Protected - Admin only (approve/reject)
careerRouter.put("/:id/approve", isAuthenticated, careerController.approve);
careerRouter.put("/:id/reject", isAuthenticated, careerController.reject);
