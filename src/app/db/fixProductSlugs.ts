import mongoose from "mongoose";
import config from "../config";
import { Product } from "../modules/product/product.model";
import { generateSlug } from "../utils/slug";

/**
 * One-off migration: make every product's slug URL-safe.
 *
 * Older / seeded products stored the raw name (spaces, capitals) as the slug,
 * which leaked into product URLs like /products/Sequi%20incidunt%20recu.
 * This regenerates a proper slug for those, keeps slugs that are already clean,
 * and guarantees uniqueness (appends -2, -3 … on collision).
 *
 * Run with:  npx ts-node src/app/db/fixProductSlugs.ts
 */
const run = async () => {
  await mongoose.connect(config.db_url as string);
  console.log("Connected. Scanning products…\n");

  const products = await Product.find({}, { name: 1, slug: 1 }).lean();
  const used = new Set<string>();

  // A slug is "good" when it's already URL-safe (slugifying it changes nothing).
  const isGood = (s?: string) =>
    !!s && s === generateSlug(s).toLowerCase();

  // Pass 1 — reserve all already-good slugs so we don't renumber them.
  for (const p of products) {
    if (isGood(p.slug)) used.add(p.slug as string);
  }

  // Pass 2 — fix the bad ones from the product name, keeping slugs unique.
  let fixed = 0;
  for (const p of products) {
    if (isGood(p.slug)) continue;

    const base =
      generateSlug(p.name || "").toLowerCase() ||
      generateSlug(p.slug || "").toLowerCase() ||
      "product";

    let candidate = base;
    let n = 2;
    while (used.has(candidate)) candidate = `${base}-${n++}`;
    used.add(candidate);

    await Product.updateOne({ _id: p._id }, { slug: candidate });
    console.log(`  "${p.slug}"  →  "${candidate}"`);
    fixed++;
  }

  console.log(`\nDone. Fixed ${fixed} of ${products.length} products.`);
  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
