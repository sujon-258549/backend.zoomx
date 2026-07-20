export const PERMISSION_ACTIONS = [
  "view",
  "create",
  "update",
  "delete",
] as const;
export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

export interface IPermissions {
  module: string;
  description?: string;
  actions: PermissionAction[];
  is_active?: boolean;
}
