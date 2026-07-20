import { StatusCodes } from "http-status-codes";
import AppError from "../../errors/appError";
import { paginationHelper } from "../../helpers/paginationHelper";
import { IPaginationOptions } from "../../interface/pagination";
import { withCache } from "../../shared/redis";
import {
  COUNTRY_CACHE,
  COUNTRY_KEYS,
  hashQuery,
  invalidateCountryCache,
} from "./country.cache";
import { countrySearchableFields } from "./country.constant";
import { ICountry } from "./country.interface";
import Country from "./country.model";

const createCountry = async (payload: Partial<ICountry>) => {
  const count = await Country.countDocuments();
  const docToCreate = { ...payload, serial_no: count + 1 };
  const result = await Country.create(docToCreate);
  await invalidateCountryCache();
  return result;
};

const updateCountry = async (id: string, payload: Partial<ICountry>) => {
  const { serial_no: _ignored, ...rest } = payload;
  const result = await Country.findByIdAndUpdate(id, rest, { new: true });
  if (!result) {
    throw new AppError(StatusCodes.NOT_FOUND, "Country not found");
  }
  await invalidateCountryCache(id);
  return result;
};

const deleteCountry = async (id: string) => {
  const target = await Country.findById(id);
  if (!target) {
    throw new AppError(StatusCodes.NOT_FOUND, "Country not found");
  }
  const removedSerial = target.serial_no;
  await Country.findByIdAndDelete(id);
  await Country.updateMany(
    { serial_no: { $gt: removedSerial } },
    { $inc: { serial_no: -1 } }
  );
  await invalidateCountryCache(id);
  return target;
};

const getAllCountries = async (
  params: Record<string, unknown>,
  options: IPaginationOptions
) => {
  const cacheKey = COUNTRY_KEYS.list(
    hashQuery({ ...params, ...(options as Record<string, unknown>) })
  );

  return withCache(
    { key: cacheKey, ttl: COUNTRY_CACHE.LIST_TTL },
    async () => {
      const { page, limit, skip, sortBy, sortOrder } =
        paginationHelper.calculatePagination({
          ...options,
          sortBy: options.sortBy || "serial_no",
          sortOrder: options.sortOrder || "asc",
        });

      const { keyword, ...filterData } = params;

      const searchCondition =
        keyword && countrySearchableFields.length > 0
          ? {
              $or: countrySearchableFields.map((field) => ({
                [field]: { $regex: keyword, $options: "i" },
              })),
            }
          : {};

      const filterCondition =
        Object.keys(filterData).length > 0
          ? {
              $and: Object.entries(filterData).map(([key, value]) => ({
                [key]: value,
              })),
            }
          : {};

      const whereConditions = { ...searchCondition, ...filterCondition };

      const data = await Country.find(whereConditions)
        .sort({ [sortBy]: sortOrder === "asc" ? 1 : -1 })
        .skip(skip)
        .limit(limit);

      const total = await Country.countDocuments(whereConditions);
      const totalPage = limit > 0 ? Math.ceil(total / limit) : 0;

      return {
        meta: { page, limit, total, totalPage },
        data,
      };
    }
  );
};

const getCountryById = async (id: string) => {
  const cached = await withCache(
    { key: COUNTRY_KEYS.single(id), ttl: COUNTRY_CACHE.SINGLE_TTL },
    async () => Country.findById(id)
  );
  if (!cached) {
    throw new AppError(StatusCodes.NOT_FOUND, "Country not found");
  }
  return cached;
};

const toggleCountryStatus = async (id: string) => {
  const country = await Country.findById(id);
  if (!country) {
    throw new AppError(StatusCodes.NOT_FOUND, "Country not found");
  }
  country.isActive = !country.isActive;
  const result = await country.save();
  await invalidateCountryCache(id);
  return result;
};

const updateCountrySerial = async (id: string, targetSerial: number) => {
  const country = await Country.findById(id);
  if (!country) {
    throw new AppError(StatusCodes.NOT_FOUND, "Country not found");
  }

  const total = await Country.countDocuments();
  if (targetSerial < 1 || targetSerial > total) {
    throw new AppError(
      StatusCodes.BAD_REQUEST,
      `Serial number must be between 1 and ${total}.`
    );
  }

  const sourceSerial = country.serial_no;
  if (sourceSerial === targetSerial) {
    return country;
  }

  if (sourceSerial < targetSerial) {
    await Country.updateMany(
      {
        _id: { $ne: country._id },
        serial_no: { $gt: sourceSerial, $lte: targetSerial },
      },
      { $inc: { serial_no: -1 } }
    );
  } else {
    await Country.updateMany(
      {
        _id: { $ne: country._id },
        serial_no: { $gte: targetSerial, $lt: sourceSerial },
      },
      { $inc: { serial_no: 1 } }
    );
  }

  country.serial_no = targetSerial;
  const result = await country.save();
  await invalidateCountryCache(id);
  return result;
};

export const CountryService = {
  createCountry,
  updateCountry,
  deleteCountry,
  getAllCountries,
  getCountryById,
  toggleCountryStatus,
  updateCountrySerial,
};
