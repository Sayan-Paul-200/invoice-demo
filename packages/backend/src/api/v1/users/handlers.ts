import { Request, Response } from 'express';
import { eq, desc, and } from 'drizzle-orm';
import { hash } from 'argon2'; 
import { schema } from '@invoice-management-system/db';
import { CreateUserSchema, AssignProjectSchema, UpdateUserStatusSchema, UpdateUserSchema } from './dtos';
import { sendEmail } from '../../../utils/email';

/**
 * GET /api/v1/users
 * List users with optional role filtering.
 */
export const listUsers = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { role } = req.query;

  try {
    const baseQuery = dbClient
      .select({
        id: schema.users.id,
        fullName: schema.users.fullName,
        role: schema.users.role,
        status: schema.users.status,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
        projectId: schema.users.projectId, 
        projectName: schema.projects.name,
        email: schema.userEmails.email,
        userNotes: schema.users.userNotes,
        userPhotoUrl: schema.users.userPhotoUrl,
      })
      .from(schema.users)
      .leftJoin(schema.projects, eq(schema.users.projectId, schema.projects.id))
      .leftJoin(schema.userEmails, eq(schema.users.id, schema.userEmails.userId));

    // Define Filters
    const filters = [eq(schema.userEmails.isPrimary, true)]; // Always filter primary email
    
    // FIX: Apply Role Filter if provided
    if (role && (role === 'staff' || role === 'accountant' || role === 'admin')) {
        filters.push(eq(schema.users.role, role));
    }
    
    // Exclude 'inactive' (Soft Deleted) users from the list by default
    // filters.push(ne(schema.users.status, 'inactive')); // Optional: Uncomment if you want to hide deleted users

    const rawUsers = await baseQuery
      .where(and(...filters)) // Apply all filters
      .orderBy(desc(schema.users.createdAt));

    res.json({ data: rawUsers });
  } catch (error) {
    console.error('List Users Error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

/**
 * POST /api/v1/users
 */
export const createUser = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  
  const validated = CreateUserSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }
  const input = validated.data;

  try {
    const existingEmail = await dbClient
      .select()
      .from(schema.userEmails)
      .where(eq(schema.userEmails.email, input.email))
      .limit(1);

    if (existingEmail.length > 0) {
      res.status(409).json({ error: 'Email already in use' });
      return;
    }

    const passwordHash = await hash(input.password);

    const result = await dbClient.transaction(async (tx: any) => {
      const [newUser] = await tx
        .insert(schema.users)
        .values({
          fullName: input.fullName,
          role: input.role,
          projectId: input.projectId,
          userNotes: input.userNotes,
          status: 'active',
          userPhotoUrl: input.userPhotoUrl,
        })
        .returning();

      await tx.insert(schema.userEmails).values({
        userId: newUser.id,
        email: input.email,
        isPrimary: true,
        isVerified: true,
      });

      await tx.insert(schema.userCredentials).values({
        userId: newUser.id,
        passwordHash: passwordHash,
      });

      return newUser;
    });

    await sendEmail(
      input.email,
      'Welcome to Invoice Management System',
      'userCredentials',
      {
        recipientName: input.fullName,
        emailTo: input.email,
        password: input.password,
        loginLink: process.env.FRONTEND_URL || 'http://localhost:4200/login',
      }
    );

    res.status(201).json({ 
      message: 'User created successfully', 
      user: result 
    });
  } catch (error) {
    console.error('Create User Error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

/**
 * PUT /api/v1/users/:id
 * General User Update (FullName, Project, Notes)
 */
export const updateUser = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;

  const validated = UpdateUserSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }
  
  try {
    const [updatedUser] = await dbClient
      .update(schema.users)
      .set({ 
        fullName: validated.data.fullName,
        projectId: validated.data.projectId,
        userNotes: validated.data.userNotes,
        userPhotoUrl: validated.data.userPhotoUrl,
        updatedAt: new Date()
      })
      .where(eq(schema.users.id, id))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update User Error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

/**
 * PATCH /api/v1/users/:id/assign-project
 */
export const assignProject = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;

  const validated = AssignProjectSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }
  
  try {
    const [updatedUser] = await dbClient
      .update(schema.users)
      .set({ projectId: validated.data.projectId })
      .where(eq(schema.users.id, id))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Assign Project Error:', error);
    res.status(500).json({ error: 'Failed to update user project' });
  }
};

/**
 * PATCH /api/v1/users/:id/status
 */
export const updateUserStatus = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;

  const validated = UpdateUserStatusSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }

  try {
    const [updatedUser] = await dbClient
      .update(schema.users)
      .set({ status: validated.data.status })
      .where(eq(schema.users.id, id))
      .returning();

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};

/**
 * DELETE /api/v1/users/:id
 * Soft Delete (Sets status to 'inactive')
 */
export const deleteUser = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;

  try {
    // Soft Delete: Just update status to 'inactive'
    const [deletedUser] = await dbClient
      .update(schema.users)
      .set({ status: 'inactive' })
      .where(eq(schema.users.id, id))
      .returning();

    if (!deletedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ success: true, message: 'User deactivated successfully' });
  } catch (error) {
    console.error('Delete User Error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};