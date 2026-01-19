import { sql, relations } from 'drizzle-orm';
import { pgTable, pgEnum, uuid, varchar, date, text, timestamp, boolean, uniqueIndex } from 'drizzle-orm/pg-core';
import { projects } from './projects';

// --- Enums ---
export const userStatusEnum = pgEnum('user_status', ['active', 'inactive', 'suspended']);
export const userRoleEnum = pgEnum('user_role', ['admin', 'staff', 'accountant', 'other']);

// --- Constants (Inline for simplicity) ---
const USER_NAME_LENGTH = 120;
const USER_EMAIL_LENGTH = 100;
// const USER_PHONE_LENGTH = 32;

// --- 1. Core Users Table ---
export const users = pgTable('users', {
  id: uuid('id')
    .primaryKey()
    .default(sql`uuidv7()`),
  
  // Requirement 5: Staff linked with only one project
  // Nullable because Admins/Accountants might not belong to a specific project
  projectId: uuid('project_id').references(() => projects.id),

  role: userRoleEnum('role').notNull().default('other'),

  fullName: varchar('full_name', { length: USER_NAME_LENGTH }).notNull(),
  userPhotoUrl: varchar('user_photo_url', { length: 1024 }),
  dateOfBirth: date('date_of_birth'), // Made nullable for flexibility
  userNotes: text('user_notes'),
  status: userStatusEnum('status').notNull().default('active'),
  
  lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- 2. User Emails (Multi-email support from reference) ---
export const userEmails = pgTable('user_emails', {
  email: varchar('email', { length: USER_EMAIL_LENGTH }).primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  isPrimary: boolean('is_primary').notNull().default(false),
  isVerified: boolean('is_verified').notNull().default(false),
  verificationToken: varchar('verification_token', { length: 128 }),
  
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }),
}, (t) => ({
  // Ensure only one primary email per user
  uniqPrimary: uniqueIndex('unique_primary_email_per_user')
    .on(t.userId, t.isPrimary)
    .where(sql`${t.isPrimary} = true`),
}));

// --- 3. User Credentials (Security separation) ---
export const userCredentials = pgTable('user_credentials', {
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .primaryKey(),
  passwordHash: text('password_hash').notNull(),
  lastUpdatedAt: timestamp('last_updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// --- Relations ---
export const usersRelations = relations(users, ({ one, many }) => ({
  project: one(projects, {
    fields: [users.projectId],
    references: [projects.id],
  }),
  emails: many(userEmails),
  credentials: one(userCredentials, {
    fields: [users.id],
    references: [userCredentials.userId]
  })
}));

export const userEmailsRelations = relations(userEmails, ({ one }) => ({
  user: one(users, {
    fields: [userEmails.userId],
    references: [users.id],
  }),
}));