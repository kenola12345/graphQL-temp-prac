import { z } from "zod";

// Zod schemas are the single source of truth for VALUE rules (length, format): the backend
// validates mutation inputs with them, the frontend validates forms with the same rules.
// GraphQL itself only checks types (String! vs Int); it cannot say "max 200 characters".

export const todoIdSchema = z.string().min(1);

export const createTodoSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
});

export const updateTodoSchema = z
  .object({
    title: createTodoSchema.shape.title.optional(),
    completed: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, "Send at least one field to update");

export type CreateTodoInput = z.infer<typeof createTodoSchema>;
export type UpdateTodoInput = z.infer<typeof updateTodoSchema>;
