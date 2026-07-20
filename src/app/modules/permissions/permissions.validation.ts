import { z } from 'zod';

export const permissionsValidation = {
  create: z.object({
    body: z.object({
        module: z.string().min(1, 'Module is required'),
        description: z.string().optional(),
        actions: z.array(z.string()).min(1, 'Actions are required'),
      }),
  }),
  update: z.object({
    body: z.object({
      module: z.string().min(1, 'Module is required').optional(),
      description: z.string().optional(),
      actions: z.array(z.string()).min(1, 'Actions are required').optional(),
    }),
  }),
};
