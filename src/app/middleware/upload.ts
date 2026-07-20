// import fs from "fs";
// import multer from "multer";
// import path from "path";

// // Create uploads directory if it doesn't exist
// const uploadPath = path.join(__dirname, "../../../uploads");
// if (!fs.existsSync(uploadPath)) {
//   fs.mkdirSync(uploadPath);
// }

// const storage = multer.diskStorage({
//   destination: (_req, _file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (_req, file, cb) => {
//     const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
//     const ext = path.extname(file.originalname);
//     cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
//   },
// });

// export const upload = multer({ storage });
import fs from "fs";
import multer from "multer";
import path from "path";

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

    // Check for duplicates and append number if needed
    while (fs.existsSync(path.join(uploadPath, finalName))) {
      finalName = `${originalName}-${counter}${ext}`;
      counter++;
    }

    cb(null, finalName);
  },
});

export const upload = multer({ storage });
