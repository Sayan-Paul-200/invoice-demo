import { Request, Response } from 'express';
import { eq, desc, inArray } from 'drizzle-orm';
import { schema } from '@invoice-management-system/db';
import { CreateProjectSchema, UpdateProjectSchema } from './dtos';

/**
 * GET /api/v1/projects
 * List projects with flattened Mode and State data for the frontend.
 */
export const listProjects = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { role, projectId } = req.context;

  try {
    // 1. Fetch Projects & Modes
    const projectsQuery = dbClient
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        modeOfProjectId: schema.projects.modeOfProjectId,
        createdAt: schema.projects.createdAt,
        updatedAt: schema.projects.updatedAt,
        modeName: schema.projectModes.name, // Flattened for Table
      })
      .from(schema.projects)
      .leftJoin(
        schema.projectModes,
        eq(schema.projects.modeOfProjectId, schema.projectModes.id)
      )
      .orderBy(desc(schema.projects.createdAt));

    // Apply Scoping
    if (role === 'staff') {
      if (!projectId) {
        res.json({ data: [] });
        return;
      }
      projectsQuery.where(eq(schema.projects.id, projectId));
    }

    const projects = await projectsQuery;

    // 2. Fetch States (Many-to-Many) efficiently
    const projectIds = projects.map((p: any) => p.id);
    const stateMap: Record<string, { id: string; name: string }[]> = {};

    if (projectIds.length > 0) {
      const statesData = await dbClient
        .select({
          projectId: schema.projectStates.projectId,
          stateId: schema.states.id,
          stateName: schema.states.name,
        })
        .from(schema.projectStates)
        .innerJoin(schema.states, eq(schema.projectStates.stateId, schema.states.id))
        .where(inArray(schema.projectStates.projectId, projectIds));

      // Group states by project ID
      for (const row of statesData) {
        // FIX: Ensure projectId is not null before using it as an index
        if (row.projectId) {
          if (!stateMap[row.projectId]) {
            stateMap[row.projectId] = [];
          }
          stateMap[row.projectId].push({ id: row.stateId, name: row.stateName });
        }
      }
    }

    // 3. Merge Data
    const results = projects.map((p: any) => {
      const states = stateMap[p.id] || [];
      return {
        ...p,
        // For Table Display: "WB, MH, DL"
        stateNames: states.map((s) => s.name).join(', '),
        // For Edit Form: ["uuid-1", "uuid-2"]
        stateIds: states.map((s) => s.id), 
      };
    });

    res.json({ data: results });
  } catch (error) {
    console.error('List Projects Error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
};

/**
 * GET /api/v1/projects/:id
 */
export const getProject = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;
  const { role, projectId } = req.context;

  if (role === 'staff' && projectId !== id) {
    res.status(403).json({ error: 'Access denied to this project' });
    return;
  }

  try {
    const projectResult = await dbClient
      .select({
        id: schema.projects.id,
        name: schema.projects.name,
        modeOfProjectId: schema.projects.modeOfProjectId,
        createdAt: schema.projects.createdAt,
        updatedAt: schema.projects.updatedAt,
        mode: {
          id: schema.projectModes.id,
          name: schema.projectModes.name,
        },
      })
      .from(schema.projects)
      .leftJoin(
        schema.projectModes,
        eq(schema.projects.modeOfProjectId, schema.projectModes.id)
      )
      .where(eq(schema.projects.id, id))
      .limit(1);

    if (projectResult.length === 0) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const project = projectResult[0];

    const statesResult = await dbClient
      .select({
        state: {
          id: schema.states.id,
          name: schema.states.name,
        },
      })
      .from(schema.projectStates)
      .innerJoin(schema.states, eq(schema.projectStates.stateId, schema.states.id))
      .where(eq(schema.projectStates.projectId, id));

    const response = {
      ...project,
      stateIds: statesResult.map((r: any) => r.state.id),
      states: statesResult.map((r: any) => ({ state: r.state })),
    };

    res.json(response);
  } catch (error) {
    console.error('Get Project Error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
};

/**
 * POST /api/v1/projects
 * Admin Only.
 */
export const createProject = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { role } = req.context;

  if (role !== 'admin') {
    res.status(403).json({ error: 'Only Admins can create projects' });
    return;
  }

  const validated = CreateProjectSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }
  const input = validated.data;

  try {
    const result = await dbClient.transaction(async (tx: any) => {
      const [newProject] = await tx
        .insert(schema.projects)
        .values({
          name: input.name,
          modeOfProjectId: input.modeOfProjectId,
        })
        .returning();

      if (input.stateIds.length > 0) {
        const stateLinks = input.stateIds.map((stateId) => ({
          projectId: newProject.id,
          stateId: stateId,
        }));
        await tx.insert(schema.projectStates).values(stateLinks);
      }

      return newProject;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create Project Error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

/**
 * PUT /api/v1/projects/:id
 * Admin Only.
 */
export const updateProject = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;
  const { role } = req.context;

  if (role !== 'admin') {
    res.status(403).json({ error: 'Only Admins can update projects' });
    return;
  }

  const validated = UpdateProjectSchema.safeParse(req.body);
  if (!validated.success) {
    res.status(400).json({ errors: validated.error.issues });
    return;
  }
  const input = validated.data;

  try {
    const updatedProject = await dbClient.transaction(async (tx: any) => {
      // 1. Update Core
      const [project] = await tx
        .update(schema.projects)
        .set({
          ...input,
          updatedAt: new Date(),
        })
        .where(eq(schema.projects.id, id))
        .returning();

      if (!project) return null;

      // 2. Update States
      if (input.stateIds !== undefined) {
        await tx
          .delete(schema.projectStates)
          .where(eq(schema.projectStates.projectId, id));

        if (input.stateIds.length > 0) {
          const stateLinks = input.stateIds.map((stateId) => ({
            projectId: id,
            stateId: stateId,
          }));
          await tx.insert(schema.projectStates).values(stateLinks);
        }
      }

      return project;
    });

    if (!updatedProject) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json(updatedProject);
  } catch (error) {
    console.error('Update Project Error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

/**
 * DELETE /api/v1/projects/:id
 * Admin Only.
 */
export const deleteProject = async (req: Request, res: Response) => {
  const { dbClient } = req.globalContext;
  const { id } = req.params;
  const { role } = req.context;

  if (role !== 'admin') {
    res.status(403).json({ error: 'Only Admins can delete projects' });
    return;
  }

  try {
    await dbClient.transaction(async (tx: any) => {
      await tx
        .delete(schema.projectStates)
        .where(eq(schema.projectStates.projectId, id));

      const [deleted] = await tx
        .delete(schema.projects)
        .where(eq(schema.projects.id, id))
        .returning();
      
      if (!deleted) throw new Error('Project not found');
    });

    res.json({ message: 'Project deleted successfully', id });
  } catch (error) {
    console.error('Delete Project Error:', error);
    if (error instanceof Error && error.message === 'Project not found') {
       res.status(404).json({ error: 'Project not found' });
    } else {
       res.status(500).json({ error: 'Failed to delete project' });
    }
  }
};