import { Router } from 'express';
import validateRequest from '../../middleware/validateRequest';
import { PermissionsController } from './permissions.controller';
import { permissionsValidation } from './permissions.validation';

const router = Router();

// Define routes
router.get('/', PermissionsController.getAllPermissions);
router.post('/', validateRequest(permissionsValidation.create), PermissionsController.createPermission);
router.put('/:id', validateRequest(permissionsValidation.update), PermissionsController.updatePermission);
router.delete('/:id', PermissionsController.deletePermission);

export const PermissionsRoutes = router;
