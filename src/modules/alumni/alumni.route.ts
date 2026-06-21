import { Router } from "express";
import multer from "multer";
import { alumniController, workHistoryController } from "./alumni.controller";
import { isAuthenticated } from "../../middlewares/auth";
import { requirePermission } from "../../middlewares/role";

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

const uploadExcel = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    const ext = file.originalname?.endsWith(".xlsx") || file.originalname?.endsWith(".xls");
    if (allowed.includes(file.mimetype) || ext) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files are allowed"));
    }
  },
});

export const alumniRouter = Router();

// Public - Alumni auth
alumniRouter.post("/register", alumniController.register);
alumniRouter.post("/login", alumniController.login);
alumniRouter.get("/lookup", alumniController.lookup);
alumniRouter.post("/claim/:id", alumniController.claim);

// Protected - Alumni self-service (profile)
alumniRouter.get("/me", isAuthenticated, alumniController.getMe);
alumniRouter.put(
  "/me",
  isAuthenticated,
  upload.single("photo"),
  alumniController.updateMe
);

// Protected - Alumni notification preferences
alumniRouter.get("/me/preferences", isAuthenticated, alumniController.getPreferences);
alumniRouter.put("/me/preferences", isAuthenticated, alumniController.updatePreferences);

// Protected - Work history (for logged-in alumni managing their own)
alumniRouter.get("/me/work-histories", isAuthenticated, workHistoryController.list);
alumniRouter.post("/me/work-histories", isAuthenticated, workHistoryController.create);
alumniRouter.put("/me/work-histories/:id", isAuthenticated, workHistoryController.update);
alumniRouter.delete("/me/work-histories/:id", isAuthenticated, workHistoryController.remove);

// Public
alumniRouter.get("/", alumniController.list);
alumniRouter.get("/filter-options", alumniController.filterOptions);
alumniRouter.get("/stats", alumniController.stats);
alumniRouter.get("/export", isAuthenticated, alumniController.exportExcel);
alumniRouter.get("/import-template", isAuthenticated, alumniController.downloadTemplate);
alumniRouter.post("/import", isAuthenticated, uploadExcel.single("file"), alumniController.importExcel);
alumniRouter.get("/:id", alumniController.getById);

// Public - Work history by alumni id
alumniRouter.get("/:alumniId/work-histories", workHistoryController.listByAlumniId);

// Protected - Admin CRUD
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
alumniRouter.put(
  "/:id/approve",
  isAuthenticated,
  requirePermission("alumni.approve"),
  alumniController.approve
);
alumniRouter.put(
  "/:id/reject",
  isAuthenticated,
  requirePermission("alumni.approve"),
  alumniController.reject
);
