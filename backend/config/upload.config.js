import multer from "multer";
import sharp from "sharp";

//Multer
export const upload = multer({
  storage: multer.memoryStorage(), // keep file in RAM
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    const ok = ["image/jpeg", "image/png"].includes(file.mimetype);
    cb(ok ? null : new Error("Unsupported image type"), ok);
  },
});

export async function detectFormat(buf) {
  const { format } = await sharp(buf).metadata();
  if (format !== "jpeg" && format !== "png")
    throw new Error("Unsupported image type");
  return format; // "jpeg" | "png"
}
