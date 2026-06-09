import { Router } from "express";
import multer from "multer";
import { alumniController } from "./alumni.controller";
import { isAuthenticated } from "../../middlewares/auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

export const alumniRouter = Router();

// Public - Alumni auth (register & login from compro) - MUST be before /:id
alumniRouter.post("/register", alumniController.register);
alumniRouter.post("/login", alumniController.login);

// Protected - Alumni self-service (profile)
alumniRouter.get("/me", isAuthenticated, alumniController.getMe);
alumniRouter.put(
  "/me",
  isAuthenticated,
  upload.single("photo"),
  alumniController.updateMe
);

// Public
alumniRouter.get("/", alumniController.list);
alumniRouter.get("/filter-options", alumniController.filterOptions);
alumniRouter.get("/:id", alumniController.getById);

// Protected - multipart/form-data with optional file field "photo"
alumniRouter.post(
  "/",
  isAuthenticated,
  upload.single("photo"),
  alumniController.create
);
alumniRouter.put(
  "/:id",
  isAuthenticated,
  upload.single("photo"),
  alumniController.update
);
alumniRouter.delete("/:id", isAuthenticated, alumniController.remove);

// Protected - Approve/Reject
alumniRouter.put("/:id/approve", isAuthenticated, alumniController.approve);
alumniRouter.put("/:id/reject", isAuthenticated, alumniController.reject);
