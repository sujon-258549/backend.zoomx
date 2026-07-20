import mongoose from "mongoose";
import config from "../config";
import { UserRole } from "../modules/user/user.interface";
import User from "../modules/user/user.model";
import seedRole from "./seedRole";

const adminUserBase = {
  email: config.admin_email as string,
  password: config.admin_password as string,
  name: config.admin_name || "Adminesstation",
  role: UserRole.SUPER_ADMIN,
  profilePhoto: "",
  clientInfo: {
    device: "Desktop",
    browser: "Chrome",
    ipAddress: "58.145.190.207",
    pcName: "DESKTOP-8G8H8H8",
    os: "Windows 10",
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.5735.110 Safari/537.36",
  },
};

const seedAdmin = async () => {
  try {
    if (!adminUserBase.email || !adminUserBase.password) {
      throw new Error(
        "ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env to seed the super admin."
      );
    }

    // 1) Ensure the SUPER_ADMIN role exists, then capture its id
    const superAdminRole = await seedRole();

    // 2) Create the admin user linked to that role
    const isAdminExist = await User.findOne({ email: adminUserBase.email });
    if (!isAdminExist) {
      await User.create({
        ...adminUserBase,
        roleId: superAdminRole?._id,
      });
      console.log("✅ Admin user created successfully.");
    } else if (!isAdminExist.roleId && superAdminRole?._id) {
      // Backfill roleId on an existing admin that pre-dates the Role table.
      // Using updateOne to bypass the password-rehashing pre-save hook.
      await User.updateOne(
        { _id: isAdminExist._id },
        { roleId: superAdminRole._id, role: UserRole.SUPER_ADMIN }
      );
      console.log("✅ Admin user linked to SUPER_ADMIN role.");
    } else {
      console.log("ℹ️  Admin user already exists with a roleId.");
    }
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    throw error;
  }
};

/**
 * Runnable entry point so `npm run seed:user` actually executes the seed.
 * Connects to MongoDB, runs seedAdmin, then disconnects and exits.
 */
const runSeed = async () => {
  try {
    if (!config.db_url) {
      throw new Error(
        "DB_URL is not set in .env — cannot connect to MongoDB."
      );
    }
    await mongoose.connect(config.db_url as string);
    console.log("🛢  Connected to database");
    await seedAdmin();
    console.log("🌱 Seed complete");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exit(1);
  }
};

// Only run when invoked directly (e.g. `ts-node src/app/db/seed.ts`),
// not when this module is imported elsewhere.
if (require.main === module) {
  void runSeed();
}

export default seedAdmin;
