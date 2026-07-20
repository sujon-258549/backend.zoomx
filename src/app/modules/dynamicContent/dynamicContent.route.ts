import express from 'express';
import auth from '../../middleware/auth';
import checkPermission from '../../middleware/permission';
import validateRequest from '../../middleware/validateRequest';
import { DynamicContentController } from './dynamicContent.controller';
import { DynamicContentValidation } from './dynamicContent.validation';

const router = express.Router();

// ─── Public reads — used by the frontend ────────────────────────────────
// GET /dynamic-content/map?group=home        → { key: doc }
router.get('/map', DynamicContentController.getContentsMap);
// GET /dynamic-content/by-group/:group       → doc[]
router.get('/by-group/:group', DynamicContentController.getContentsByGroup);

// ─── Admin — list + history ─────────────────────────────────────────────
router.get(
  '/',
  auth(),
  checkPermission('Dynamic Content', 'view'),
  DynamicContentController.getAllContents
);

router.get(
  '/:key/history',
  auth(),
  checkPermission('Dynamic Content', 'view'),
  DynamicContentController.getContentHistory
);

// ─── Admin — writes ─────────────────────────────────────────────────────
router.put(
  '/upsert',
  auth(),
  checkPermission('Dynamic Content', 'update'),
  validateRequest(DynamicContentValidation.upsertZodSchema),
  DynamicContentController.upsertContent
);

router.put(
  '/bulk-upsert',
  auth(),
  checkPermission('Dynamic Content', 'update'),
  validateRequest(DynamicContentValidation.bulkUpsertZodSchema),
  DynamicContentController.bulkUpsertContents
);

router.delete(
  '/bulk-delete',
  auth(),
  checkPermission('Dynamic Content', 'delete'),
  validateRequest(DynamicContentValidation.bulkDeleteZodSchema),
  DynamicContentController.bulkDeleteContents
);

router.delete(
  '/:key',
  auth(),
  checkPermission('Dynamic Content', 'delete'),
  DynamicContentController.deleteContent
);

export const DynamicContentRoutes = router;
