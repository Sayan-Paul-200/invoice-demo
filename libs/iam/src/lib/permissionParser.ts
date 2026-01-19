import { defaultPermissionsDirectory } from './defaultPermissions';
import { IAMRole } from './types';

type EvaluatePermissionInput = {
  role: IAMRole | string;
  permissions: string[]; // Custom overrides e.g. ["invoice:delete:0"]
  resourceKey: string;   // e.g. "invoice:entity"
  action: 'create' | 'read' | 'update' | 'delete';
};

type EvaluatePermissionOutput = {
  allowed: boolean;
  conditional: boolean; // If true, the API must enforce ownership checks (e.g. WHERE created_by = X)
};

const ACTION_MASK: Record<EvaluatePermissionInput['action'], number> = {
  create: 0b1000,
  read: 0b0100,
  update: 0b0010,
  delete: 0b0001,
};

function getOverridePermissions(overrides: string[], resourceKey: string): number | undefined {
  let mask: number | undefined;

  for (const override of overrides) {
    // 1. Check if the override string belongs to the requested resourceKey
    // Format: "group:resource:hex" (e.g. "invoice:entity:F")
    if (!override.startsWith(resourceKey)) continue;

    // 2. Split the string to extract the hex value
    const parts = override.split(':');
    
    // We expect at least 3 parts (group, resource, hex)
    // The hex value is always the last part
    const hexString = parts[parts.length - 1];

    // 3. Parse
    const parsedOverridePermission = Number.parseInt(hexString, 16);
    if (Number.isNaN(parsedOverridePermission)) continue;
    
    mask = parsedOverridePermission & 0b1111; // Clamp to 4 bits
  }

  return mask;
}

export function evaluatePermission(input: EvaluatePermissionInput): EvaluatePermissionOutput {
  const { role, permissions, resourceKey, action } = input;

  const defaultsResourcePermissions = defaultPermissionsDirectory[resourceKey];
  if (!defaultsResourcePermissions) {
    return { allowed: false, conditional: false };
  }

  let normalizedRole = role.toLowerCase();
  if (!['admin', 'staff', 'accountant', 'other'].includes(normalizedRole)) {
    normalizedRole = 'other';
  }

  const roleDefaults = defaultsResourcePermissions[normalizedRole as IAMRole];
  const crudBitMask = ACTION_MASK[action];

  if (!roleDefaults || crudBitMask === undefined) {
    return { allowed: false, conditional: false };
  }

  const allowed = (roleDefaults.basePermission & crudBitMask) !== 0;
  const canOverride = (roleDefaults.canOverride & crudBitMask) !== 0;
  const conditional = (roleDefaults.conditional & crudBitMask) !== 0;

  if (!canOverride || !permissions || permissions.length === 0) {
    return { allowed, conditional };
  }

  const overridePermission = getOverridePermissions(permissions, resourceKey);

  if (overridePermission === undefined) {
    return { allowed, conditional: allowed && conditional };
  }

  const overrideAllowed = (overridePermission & crudBitMask) !== 0;
  return { allowed: overrideAllowed, conditional: overrideAllowed && conditional };
}