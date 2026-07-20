import { IBrands } from "./brands.interface";
import Brands from "./brands.model";

const createBrand = async (payload: IBrands): Promise<IBrands> => {
  try {
    const result = await Brands.create(payload);
    return result;
  } catch (err) {
    console.error("Error creating contact message:", err);
    throw err;
  }
};

const getBrands = async () => {
  try {
    const result = await Brands.find();
    return result;
  } catch (err) {
    console.error("Error getting brands:", err);
    throw err;
  }
};

const updateBrand = async (id: string, payload: IBrands) => {
  try {
    const result = await Brands.findByIdAndUpdate(id, payload, { new: true });
    return result;
  } catch (err) {
    console.error("Error updating brand:", err);
    throw err;
  }
};
const deleteBrand = async (id: string) => {
  try {
    const isExistBrand = await Brands.findById({ _id: id });
    if (!isExistBrand) {
      throw new Error("Brand not found");
    }
    const result = await Brands.findByIdAndDelete(id);
    return result;
  } catch (err) {
    console.error("Error deleting brand:", err);
    throw err;
  }
};

export const BrandService = {
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand,
};
