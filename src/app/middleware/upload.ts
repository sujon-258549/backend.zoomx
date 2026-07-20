import fs from "fs";
import multer from "multer";
import path from "path";

// Default generic uploads (media library, misc) — flat under /uploads.
const uploadPath = path.join(__dirname, "../../../uploads");

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const originalName = path.parse(file.originalname).name;
    const ext = path.extname(file.originalname);
    let finalName = `${originalName}${ext}`;
    let counter = 1;

    while (fs.existsSync(path.join(uploadPath, finalName))) {
      finalName = `${originalName}-${counter}${ext}`;
      counter++;
    }

    cb(null, finalName);
  },
});

export const upload = multer({ storage });

// -------- Profile image uploads --------
// Kept in a dedicated subfolder so we can list / clean up / migrate them
// independently of everything else in /uploads. Filenames start with the
// uploader's user id, so ownership can be inferred without a DB lookup.

const profileImagePath = path.join(uploadPath, "profile-image");
const ALLOWED_IMAGE_MIME = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const profileImageStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(profileImagePath)) {
      fs.mkdirSync(profileImagePath, { recursive: true });
    }
    cb(null, profileImagePath);
  },
  filename: (req, file, cb) => {
    // req.user is populated by the auth middleware that must run before this
    // storage engine executes. userId prefix = owner marker on disk, so we
    // never need a DB lookup to find "which files belong to whom".
    const jwt = (req as unknown as {
      user?: { userId?: string; _id?: string; id?: string };
    }).user;
    const userId = jwt?.userId ?? jwt?._id ?? jwt?.id ?? "anonymous";
    const ext = path.extname(file.originalname).toLowerCase() || ".png";
    const timestamp = Date.now();
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

export const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB cap
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_IMAGE_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed (jpg, png, webp, gif)"));
    }
  },
});
