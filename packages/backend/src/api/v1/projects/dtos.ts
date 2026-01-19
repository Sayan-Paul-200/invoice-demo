import { z } from 'zod';
import { uuidRegex } from '../../../utils/validators';

const uuidV7 = z.string().regex(uuidRegex.v7, "Invalid UUIDv7");

export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Project Name is required"),
  
  // Optional: A project might not have a mode assigned initially
  modeOfProjectId: uuidV7.optional().nullable(),
  
  // Many-to-Many: A project operates in multiple states
  stateIds: z.array(uuidV7).default([]),
});

export const UpdateProjectSchema = CreateProjectSchema.partial();

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;