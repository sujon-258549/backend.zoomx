import { Router } from "express";
import { upload } from "../middleware/upload";

const router = Router();

router.post("/upload", upload.single("file"), (req, res: any) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const fileUrl = `${req.protocol}://${req.get("host")}/uploads/${
    req.file.filename
  }`;
  res.status(200).json({ url: fileUrl });
});

export const UploadRoutes = router;
