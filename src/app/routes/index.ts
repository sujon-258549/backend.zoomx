import { Router } from "express";
import { activityNotifier } from "../middleware/activityNotifier";
import { ActionLogRoutes } from "../modules/actionLog/actionLog.route";
import { AuthRoutes } from "../modules/auth/auth.routes";
import { BlogRoutes } from "../modules/blog/blog.routes";
import { BrandRoutes } from "../modules/brands/brands.routes";
import { CaseStudyRoutes } from "../modules/caseStudy/caseStudy.routes";
import { CaseStudyCategoryRoutes } from "../modules/caseStudyCategory/caseStudyCategory.routes";
import { CategoryRoutes } from "../modules/category/category.route";
import { CountryRoutes } from "../modules/country/country.routes";
import { DashboardRoutes } from "../modules/dashboard/dashboard.routes";
import designationRoutes from "../modules/designation/designation.routes";
import { EmployeeRoutes } from "../modules/employee/employee.routes";
import { ErrorLogRoutes } from "../modules/errorLog/errorLog.routes";
import { FolderRoutes } from "../modules/folder/folder.routes";
import { InquiriesRoutes } from "../modules/inquiries/inquiries.routes";
import { MediaLibraryRoutes } from "../modules/media-library/media-library.routes";
import { NotificationRoutes } from "../modules/notification/notification.routes";
import { PageViewRoutes } from "../modules/pageView/pageView.routes";
import { PermissionsRoutes } from "../modules/permissions/permissions.routes";
import { RoleRoutes } from "../modules/role/role.routes";
import { RolePermissionRoutes } from "../modules/rolePermission/rolePermission.routes";
import { CommentRoutes } from "../modules/comment/comment.routes";
import { ServicesCountryRoutes } from "../modules/servicesCountry/servicesCountry.routes";
import { SitemapRoutes } from "../modules/sitemap/sitemap.route";
import { TeamMemberRoutes } from "../modules/teamMember/teamMember.routes";
import { TeamMemberContactRoutes } from "../modules/teamMemberContact/teamMemberContact.routes";
import { UserRoutes } from "../modules/user/user.routes";
import { DynamicContentRoutes } from "../modules/dynamicContent/dynamicContent.route";
import { ProductRoutes } from "../modules/product/product.routes";
import { ShippingMethodRoutes } from "../modules/shipping-method/shipping-method.route";
import { OrderRoutes } from "../modules/order/order.route";
import { ProductReviewRoutes } from "../modules/productReview/productReview.routes";
import { ProjectCategoryRoutes } from "../modules/projectCategory/projectCategory.routes";
import { ProjectRoutes } from "../modules/project/project.routes";

const router = Router();

// Broadcast an admin notification on every successful write (POST/PUT/PATCH/DELETE)
// across all module routes. GET requests are ignored.
router.use(activityNotifier);

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/services-countries",
    route: ServicesCountryRoutes,
  },
  {
    path: "/media-library",
    route: MediaLibraryRoutes,
  },
  {
    path: "/folders",
    route: FolderRoutes,
  },
  {
    path: "/blogs",
    route: BlogRoutes,
  },
  {
    path: "/case-studies",
    route: CaseStudyRoutes,
  },
  {
    path: "/case-study-categories",
    route: CaseStudyCategoryRoutes,
  },
  {
    path: "/action-logs",
    route: ActionLogRoutes,
  },
  {
    path: "/error-logs",
    route: ErrorLogRoutes,
  },
  {
    path: "/inquiries",
    route: InquiriesRoutes,
  },
  {
    path: "/brands",
    route: BrandRoutes,
  },
  {
    path: "/dynamic-content",
    route: DynamicContentRoutes,
  },
  {
    path: "/categories",
    route: CategoryRoutes,
  },
  {
    path: "/products",
    route: ProductRoutes,
  },
  {
    path: "/shipping-methods",
    route: ShippingMethodRoutes,
  },
  {
    path: "/orders",
    route: OrderRoutes,
  },
  {
    path: "/sitemap",
    route: SitemapRoutes,
  },
  {
    path: "/permissions",
    route: PermissionsRoutes,
  },
  {
    path: "/roles",
    route: RoleRoutes,
  },
  {
    path: "/role-permissions",
    route: RolePermissionRoutes,
  },
  {
    path: "/employees",
    route: EmployeeRoutes,
  },
  {
    path: "/designations",
    route: designationRoutes,
  },
  {
    path: "/team-members",
    route: TeamMemberRoutes,
  },
  {
    path: "/team-member-contacts",
    route: TeamMemberContactRoutes,
  },
  {
    path: "/notifications",
    route: NotificationRoutes,
  },
  {
    path: "/countries",
    route: CountryRoutes,
  },
  {
    path: "/dashboard",
    route: DashboardRoutes,
  },
  {
    path: "/page-views",
    route: PageViewRoutes,
  },
  {
    path: "/comments",
    route: CommentRoutes,
  },
  {
    path: "/product-reviews",
    route: ProductReviewRoutes,
  },
  {
    path: "/projects",
    route: ProjectRoutes,
  },
  {
    path: "/project-categories",
    route: ProjectCategoryRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
