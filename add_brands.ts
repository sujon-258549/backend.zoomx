import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "c:/project/zoomx/server.zoomx/.env.development" });

const ServiceSchema = new mongoose.Schema({}, { strict: false });
const Service = mongoose.model("Service", ServiceSchema, "services");

const LOGOS = [
  { name: "Brand 1", src: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
  { name: "Brand 2", src: "https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg" },
  { name: "Brand 3", src: "https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg" },
  { name: "Brand 4", src: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  { name: "Brand 5", src: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg" }
];

async function run() {
  await mongoose.connect(process.env.DB_URL as string);
  console.log("Connected to DB");

  const services = await Service.find();
  for (const s of services) {
    s.set("trustedBrands", {
      eyebrow: "Trusted Brands",
      titleGradient: "Brands That",
      titleWhite: "Trust Us",
      logos: LOGOS
    });
    await s.save();
    console.log(`Updated service: ${s.get("name")}`);
  }

  await mongoose.disconnect();
  console.log("Done");
}

run().catch(console.error);
