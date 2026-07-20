import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { ProductServices } from "./product.service";
import { StatusCodes } from "http-status-codes";
import { revalidateFrontend } from "../../utils/revalidateFrontend";

const createProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.createProduct(req.body);

  revalidateFrontend(result?.slug);

  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Product created successfully",
    data: result,
  });
});

const getAllProducts = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getAllProducts(req.query);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Products fetched successfully",
    meta: result.meta,
    data: result.data,
  });
});

const getProductsByCategory = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProductServices.getProductsByCategory(req.query);

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Products by category fetched successfully",
      data: result,
    });
  }
);

const getProductsByCategorySlug = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ProductServices.getProductsByCategorySlug(
      req.params.slug,
      req.query
    );

    if (!result) {
      return sendResponse(res, {
        statusCode: StatusCodes.NOT_FOUND,
        success: false,
        message: "Category not found",
        data: null,
      });
    }

    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Products for category fetched successfully",
      data: result,
    });
  }
);

const getCategoryCounts = catchAsync(async (_req: Request, res: Response) => {
  const result = await ProductServices.getCategoryProductCounts();

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Category product counts fetched successfully",
    data: result,
  });
});

const getSingleProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.getSingleProduct(req.params.id);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product fetched successfully",
    data: result,
  });
});

const updateProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.updateProduct(req.params.id, req.body);

  revalidateFrontend(result?.slug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product updated successfully",
    data: result,
  });
});

const deleteProduct = catchAsync(async (req: Request, res: Response) => {
  const result = await ProductServices.deleteProduct(req.params.id);

  revalidateFrontend(result?.slug);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Product deleted successfully",
    data: result,
  });
});

export const ProductControllers = {
  createProduct,
  getAllProducts,
  getProductsByCategory,
  getProductsByCategorySlug,
  getCategoryCounts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
