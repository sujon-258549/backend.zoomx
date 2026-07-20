import { Role } from "../modules/role/role.model";
import { UserRole } from "../modules/user/user.interface";

const seedRole = async () => {
  try {
    const existing = await Role.findOne({ role: UserRole.SUPER_ADMIN });
    if (existing) {
      console.log("SUPER_ADMIN role already exists.");
      return existing;
    }

    const created = await Role.create({
      role: UserRole.SUPER_ADMIN,
      description: "System super admin with unrestricted access",
      isActive: true,
    });
    console.log("SUPER_ADMIN role created successfully.");
    return created;
  } catch (error) {
    console.error("Error seeding SUPER_ADMIN role:", error);
    throw error;
  }
};

export default seedRole;
