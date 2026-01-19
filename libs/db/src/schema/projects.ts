import { sql, relations } from "drizzle-orm";
import { pgTable, uuid, varchar, timestamp, primaryKey } from "drizzle-orm/pg-core";
import { states } from "./locations";

// --- Lookups ---
export const projectModes = pgTable("mode_of_project", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  name: varchar("name").notNull(),
  
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- Main Entity ---
export const projects = pgTable("project", {
  id: uuid("id")
    .primaryKey()
    .default(sql`uuidv7()`),
  name: varchar("name").notNull(),
  
  modeOfProjectId: uuid("mode_of_project")
    .references(() => projectModes.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

// --- Join Table ---
export const projectStates = pgTable("project_state", {
  projectId: uuid("project")
    .references(() => projects.id),
  stateId: uuid("state")
    .references(() => states.id),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (t) => ({
  pk: primaryKey({ columns: [t.projectId, t.stateId] }),
}));

// --- Relations ---
export const projectsRelations = relations(projects, ({ one, many }) => ({
  mode: one(projectModes, {
    fields: [projects.modeOfProjectId],
    references: [projectModes.id],
  }),
  states: many(projectStates),
}));

export const projectStatesRelations = relations(projectStates, ({ one }) => ({
  project: one(projects, {
    fields: [projectStates.projectId],
    references: [projects.id],
  }),
  state: one(states, {
    fields: [projectStates.stateId],
    references: [states.id],
  }),
}));