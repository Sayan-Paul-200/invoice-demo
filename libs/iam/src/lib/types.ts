export type IAMRole = 'admin' | 'staff' | 'accountant' | 'other';

export type AccountInfo = {
  role: IAMRole;
  projectId?: string; // Optional, as Admins/Accountants might not be linked to one
  projectName?: string;
  permissions: string[]; // For specific overrides (e.g. "invoice:delete:0")
};

export type JWTRefreshToken = {
  tokenUUID: string;
  application: string;
  userId: string;
};

export type JWTAccessToken = {
  tokenUUID: string;
  parentTokenUUID: string;
  application: string;
  userId: string;
  fullName: string;
  account: AccountInfo;
};

export type DefaultPermissionsDirectory = Record<string, RolePermissions>;

type RolePermissions = {
  [key in IAMRole]: DefaultPermissionValue;
};

type DefaultPermissionValue = {
  basePermission: number; // Bitmask: Create(8) | Read(4) | Update(2) | Delete(1)
  canOverride: number;    // Which bits can be overridden by DB permissions
  conditional: number;    // Which bits depend on ownership (e.g. "own invoices only")
};

export type UserInfo = {
  id: string;
  fullName: string;
  userPhotoUrl: string | null;
  email?: string;
};