// *** AUTO-GENERATED FILE - DO NOT EDIT ***
import { DefaultPermissionsDirectory } from './types';

/*
  Bitmask Guide:
  Create = 8 (1000)
  Read   = 4 (0100)
  Update = 2 (0010)
  Delete = 1 (0001)
  
  Total Access = 15 (1111)
  Read Only    = 4  (0100)
*/

export const defaultPermissionsDirectory: DefaultPermissionsDirectory = {
  'invoice:entity': {
    // Admin: Full access to all invoices
    admin: { basePermission: 0b1111, canOverride: 0b0000, conditional: 0b0000 },
    
    // Staff: Can Create, Read, Update, Delete (but Conditional bit is set)
    // The "conditional" flag tells the API to apply "WHERE created_by = user.id"
    staff: { basePermission: 0b1111, canOverride: 0b0000, conditional: 0b1111 },
    
    // Accountant: Can Create, Read, Update, Delete (but Conditional bit is set)
    // The "conditional" flag tells the API to apply "WHERE status = 'Paid'"
    accountant: { basePermission: 0b1111, canOverride: 0b0000, conditional: 0b1111 },
    
    other: { basePermission: 0b0000, canOverride: 0b0000, conditional: 0b0000 },
  },
  'project:entity': {
    // Admin: Full control over projects
    admin: { basePermission: 0b1111, canOverride: 0b0000, conditional: 0b0000 },
    
    // Staff: Read Only (scoped to their assigned project)
    staff: { basePermission: 0b0100, canOverride: 0b0000, conditional: 0b0100 },
    
    // Accountant: Read Only
    accountant: { basePermission: 0b0100, canOverride: 0b0000, conditional: 0b0000 },
    
    other: { basePermission: 0b0000, canOverride: 0b0000, conditional: 0b0000 },
  },
  'user:entity': {
    // Admin: Manage users
    admin: { basePermission: 0b1111, canOverride: 0b0000, conditional: 0b0000 },
    staff: { basePermission: 0b0100, canOverride: 0b0000, conditional: 0b0100 }, // Read self
    accountant: { basePermission: 0b0100, canOverride: 0b0000, conditional: 0b0100 }, // Read self
    other: { basePermission: 0b0100, canOverride: 0b0000, conditional: 0b0100 },
  }
};