import { z } from 'zod';
import { uuidRegex } from '../../../utils/validators';

const uuidV7 = z.string().regex(uuidRegex.v7, "Invalid UUIDv7");

// Enum matches your DB and IAM types
const RoleEnum = z.enum(['admin', 'staff', 'accountant', 'other']);

export const CreateUserSchema = z.object({
  fullName: z.string().min(2, "Full Name is required"),
  email: z.string().email("Invalid email address"),
  role: RoleEnum,
  projectId: uuidV7.optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  userNotes: z.string().optional(),
  userPhotoUrl: z.string().optional().nullable(),
});

export const UpdateUserSchema = z.object({
  fullName: z.string().min(2, "Full Name is required").optional(),
  projectId: uuidV7.optional().nullable(),
  userNotes: z.string().optional(),
  userPhotoUrl: z.string().optional().nullable(),
});

export const AssignProjectSchema = z.object({
  projectId: uuidV7,
});

export const UpdateUserStatusSchema = z.object({
  status: z.enum(['active', 'inactive', 'suspended']),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type AssignProjectInput = z.infer<typeof AssignProjectSchema>;