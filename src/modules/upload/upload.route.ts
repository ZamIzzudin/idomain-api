import { Router } from "express";
import { isAuthenticated } from "../../middlewares/auth";
import { uploadToCloudinary } from "../../lib/cloudinary";

export const uploadRouter = Router();

uploadRouter.post("/image", isAuthenticated, async (req, res) => {
  try {
    const { image } = req.body;

    if (!image || typeof image !== "string") {
      return res.status(400).json({ status: 400, message: "Base64 image is required" });
    }

    // Extract mime type and data from data URI: data:image/png;base64,xxxxx
    const matches = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ status: 400, message: "Invalid base64 image format" });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const ext = mimeType.split("/")[1] || "png";
    const buffer = Buffer.from(base64Data, "base64");

    if (buffer.length > 1 * 1024 * 1024) {
      return res.status(400).json({ status: 400, message: "Ukuran gambar tidak boleh melebihi 1 MB" });
    }

    const result = await uploadToCloudinary(buffer, "editor", "image");

    return res.json({ status: 200, message: "success", data: { url: result.secure_url } });
  } catch (error: any) {
    console.error("Image upload error:", error);
    return res.status(500).json({ status: 500, message: error.message || "Failed to upload image" });
  }
});
