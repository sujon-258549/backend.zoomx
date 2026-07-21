import fs from "fs";
import mongoose from "mongoose";
import path from "path";
import config from "../config";
import { ICaseStudy } from "../modules/caseStudy/caseStudy.interface";
import { CaseStudy } from "../modules/caseStudy/caseStudy.model";

/**
 * Seeds the case studies that used to live in the frontend's static
 * `case-study.json`. Idempotent — upserts by `slug`, so re-running only
 * refreshes content and never creates duplicates.
 *
 * Run with: `npm run seed:case-studies`
 */
const loadSeedData = (): ICaseStudy[] => {
  const file = path.join(__dirname, "caseStudy.seed.json");
  const raw = fs.readFileSync(file, "utf8");
  return JSON.parse(raw) as ICaseStudy[];
};

const seedCaseStudies = async () => {
  const data = loadSeedData();
  let created = 0;
  let updated = 0;

  for (const item of data) {
    if (!item.slug) continue;
    const existing = await CaseStudy.findOne({ slug: item.slug });
    if (existing) {
      await CaseStudy.updateOne(
        { _id: existing._id },
        { $set: { ...item, is_deleted: false } }
      );
      updated++;
    } else {
      await CaseStudy.create(item);
      created++;
    }
  }

  console.log(`✅ Case studies seeded — ${created} created, ${updated} updated.`);
};

const runSeed = async () => {
  try {
    if (!config.db_url) {
      throw new Error("DB_URL is not set in .env — cannot connect to MongoDB.");
    }
    await mongoose.connect(config.db_url as string);
    console.log("🛢  Connected to database");
    await seedCaseStudies();
    console.log("🌱 Case study seed complete");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Case study seed failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  void runSeed();
}

export default seedCaseStudies;
