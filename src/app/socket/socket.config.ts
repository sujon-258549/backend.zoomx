import { CorsOptions } from "cors";

export const socketCorsOptions: CorsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:4007",
    "https://thezoomit.com",
    "https://www.thezoomit.com",
    "https://new.thezoomit.com",
    "https://admin.thezoomit.com",
    "https://zoom-it.vercel.app",
    "https://admin-zoomit.vercel.app",
  ],
  credentials: true,
};
