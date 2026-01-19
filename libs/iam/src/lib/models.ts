import { eq } from 'drizzle-orm';
import { DrizzleClient, schema } from '@invoice-management-system/db'; // Adjust package name if different
import { UserInfo, AccountInfo } from './types';

type IAMMetadataInput = {
  dbClient: DrizzleClient;
  userId: string;
};

export async function getAccountInfo({ dbClient, userId }: IAMMetadataInput): Promise<AccountInfo | null> {
  // Query the users table directly as it holds the Role and Project ID
  const userQuery = await dbClient
    .select({
      id: schema.users.id,
      role: schema.users.role,
      projectId: schema.users.projectId,
      // Optional: Join with projects table if you need the project Name
      projectName: schema.projects.name, 
    })
    .from(schema.users)
    .leftJoin(schema.projects, eq(schema.projects.id, schema.users.projectId))
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (userQuery.length === 0) return null;

  const user = userQuery[0];

  return {
    role: user.role, // 'admin' | 'staff' | 'accountant' | 'other'
    projectId: user.projectId || undefined,
    projectName: user.projectName || undefined,
    permissions: [], // Your users table doesn't have customPermissions currently, so return empty
  };
}

export async function getUserMetadataById({ dbClient, userId }: IAMMetadataInput): Promise<UserInfo> {
  const userInfo = await dbClient
    .select({
      id: schema.users.id,
      fullName: schema.users.fullName,
      userPhotoUrl: schema.users.userPhotoUrl,
      // email is in a separate table, but basic info is here
    })
    .from(schema.users)
    .where(eq(schema.users.id, userId));

  if (userInfo.length === 0) {
    throw new Error('getUserMetadataById: User entry not found');
  }

  return userInfo[0];
}