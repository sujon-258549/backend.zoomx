import dotenv from "dotenv";
import path from "path";

// Load .env.<NODE_ENV> — falls back to development when NODE_ENV is unset,
// so plain `npm run dev` picks up .env.development without extra flags.
// Old single-file load (kept for reference):
// dotenv.config({ path: path.join((process.cwd(), ".env")) });
const NODE_ENV = process.env.NODE_ENV || "development";
dotenv.config({
  path: path.join(process.cwd(), `.env.${NODE_ENV}`),
});

export default {
  NODE_ENV: process.env.NODE_ENV,
  port: process.env.PORT || "6001",
  db_url: process.env.DB_URL,
  server_url: process.env.SERVER_URL || `http://localhost:${process.env.PORT || 6001}`,
  // Comma-separated list of allowed origins, e.g. "https://shop.example.com,https://admin.example.com".
  // "*" cannot be combined with credentialed requests (cookies/auth headers) per the CORS spec —
  // browsers reject "Access-Control-Allow-Origin: *" alongside "Access-Control-Allow-Credentials: true".
  // "*" is kept as a valid value (see app.ts, which reflects the request origin instead of sending
  // a literal "*") purely as a permissive fallback for early development; list real origins in production.
  cors_origin: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
    : ["http://localhost:3010", "http://localhost:3100"],
  bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  jwt_otp_secret: process.env.JWT_OTP_SECRET,
  jwt_pass_reset_secret: process.env.JWT_PASS_RESET_SECRET,
  jwt_pass_reset_expires_in: process.env.JWT_PASS_RESET_EXPIRES_IN,
  sender_email: process.env.SENDER_EMAIL,
  sender_app_password: process.env.SENDER_APP_PASS,
  admin_email: process.env.ADMIN_EMAIL,
  admin_password: process.env.ADMIN_PASSWORD,
  admin_name: process.env.ADMIN_NAME,
  // Cloudflare R2 (S3-compatible object storage) — media/image hosting.
  r2_account_id: process.env.R2_ACCOUNT_ID,
  r2_access_key_id: process.env.R2_ACCESS_KEY_ID,
  r2_secret_access_key: process.env.R2_SECRET_ACCESS_KEY,
  r2_bucket: process.env.R2_BUCKET,
  // Public base URL for served objects (r2.dev URL or your custom domain).
  r2_public_url: process.env.R2_PUBLIC_URL,
  frontend_url: process.env.FRONTEND_URL,
  revalidate_secret: process.env.REVALIDATE_SECRET,
};
