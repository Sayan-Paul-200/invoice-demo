import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and, inArray } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from '../libs/db/src/index'; 
import { hash } from 'argon2';
import { join } from 'path';
import dotenv from 'dotenv';

// 1. Load Environment Variables
// In .cts (CommonJS), __dirname is available globally
dotenv.config({ path: join(__dirname, '../config/.env.development') });

// 2. Setup Connection
if (!process.env.POSTGRES_USER) {
  throw new Error('❌ Environment variables not loaded. Check your .env path.');
}

const connectionString = `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`;

// Disable prefetch for simple scripts & limit connections
const queryClient = postgres(connectionString, { max: 1 });
const db = drizzle(queryClient, { schema });

async function seed() {
  console.log('🌱 Starting Database Seed...');

  try {
    // --- 1. Invoice Statuses ---
    const statuses = ["Paid", "Under Process", "Credit Note Issued", "Cancelled"];
    console.log('... Seeding Statuses');
    for (const name of statuses) {
      const existing = await db.select().from(schema.invoiceStatuses).where(eq(schema.invoiceStatuses.name, name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.invoiceStatuses).values({ name }).execute();
      }
    }

    // --- 2. Bill Categories ---
    const categories = [
        "Service", "Supply", "ROW", "AMC", "Restoration Service", 
        "Restoration Supply", "Restoration Row", "Spares", "Training"
    ];
    console.log('... Seeding Bill Categories');
    for (const name of categories) {
      const existing = await db.select().from(schema.billCategories).where(eq(schema.billCategories.name, name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.billCategories).values({ name }).execute();
      }
    }

    // --- 3. GST Percentages ---
    const gsts = [0, 5, 12, 18, 28];
    console.log('... Seeding GST Percentages');
    for (const value of gsts) {
      const valString = value.toString();
      const existing = await db.select().from(schema.gstPercentages).where(eq(schema.gstPercentages.value, valString)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.gstPercentages).values({ value: valString, label: `${value}%` }).execute();
      }
    }

    // --- 4. Milestones ---
    const milestones = ["60%", "90%", "100%"];
    console.log('... Seeding Milestones');
    for (const name of milestones) {
      const existing = await db.select().from(schema.milestones).where(eq(schema.milestones.name, name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.milestones).values({ name }).execute();
      }
    }
    
    // --- 5. Project Modes ---
    const modes = ["Back To Back", "Direct"];
    console.log('... Seeding Project Modes');
    for (const name of modes) {
      const existing = await db.select().from(schema.projectModes).where(eq(schema.projectModes.name, name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.projectModes).values({ name }).execute();
      }
    }

    // --- 6. States (Locations) ---
    const locations = [
        'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
        'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
        'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
        'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
        'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
        'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
        'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
    ];
    console.log('... Seeding Locations');
    for (const name of locations) {
      const existing = await db.select().from(schema.states).where(eq(schema.states.name, name)).limit(1);
      if (existing.length === 0) {
        await db.insert(schema.states).values({ name }).execute();
      }
    }

    // --- 7. SUPER ADMIN USER ---
    console.log('... Seeding Super Admin');
    const adminEmail = 'admin@invoice-system.local';
    const adminPassword = 'adminPassword123!';

    // Check if admin exists
    const existingAdmin = await db.select().from(schema.userEmails).where(eq(schema.userEmails.email, adminEmail)).limit(1);

    if (existingAdmin.length === 0) {
      const passwordHash = await hash(adminPassword);

      await db.transaction(async (tx) => {
        // A. Create User
        const [user] = await tx.insert(schema.users).values({
          fullName: 'System Admin',
          role: 'admin', // Enums: 'admin', 'staff', 'accountant', 'other'
          status: 'active',
          userNotes: 'Seeded Super Admin',
        }).returning();

        // B. Create Email
        await tx.insert(schema.userEmails).values({
          userId: user.id,
          email: adminEmail,
          isPrimary: true,
          isVerified: true,
        });

        // C. Create Credentials
        await tx.insert(schema.userCredentials).values({
          userId: user.id,
          passwordHash: passwordHash,
        });
      });
      console.log(`✅ Admin Created: ${adminEmail} / ${adminPassword}`);
    } else {
      console.log('ℹ️ Admin already exists');
    }

    // --- 8. SPECIFIC PROJECTS (New Requirement) ---
    console.log('... Seeding Specific Projects');
    
    // Shared list of states for these projects
    const commonStates = [
      'West Bengal', 'Delhi', 'Bihar', 'Madhya Pradesh', 
      'Kerala', 'Sikkim', 'Jharkhand', 'Andaman and Nicobar Islands'
    ];

    const specificProjects = [
      { name: 'NFS', mode: 'Back To Back' },
      { name: 'GAIL', mode: 'Direct' },
      { name: 'BGCL', mode: 'Direct' },
      { name: 'STP', mode: 'Direct' },
      { name: 'Bharat Net', mode: 'Direct' },
      { name: 'NFS AMC', mode: 'Back To Back' },
    ];

    for (const p of specificProjects) {
      // A. Resolve Mode ID
      const modeResult = await db.select().from(schema.projectModes).where(eq(schema.projectModes.name, p.mode)).limit(1);
      if (modeResult.length === 0) {
        console.warn(`⚠️ Warning: Mode '${p.mode}' not found for project '${p.name}'. Skipping.`);
        continue;
      }
      const modeId = modeResult[0].id;

      // B. Create or Get Project
      let projectId: string;
      const existingProj = await db.select().from(schema.projects).where(eq(schema.projects.name, p.name)).limit(1);
      
      if (existingProj.length === 0) {
        const [newProj] = await db.insert(schema.projects).values({
          name: p.name,
          modeOfProjectId: modeId,
        }).returning();
        projectId = newProj.id;
        console.log(`   + Created Project: ${p.name}`);
      } else {
        projectId = existingProj[0].id;
        console.log(`   = Project '${p.name}' already exists.`);
      }

      // C. Resolve State IDs
      const stateResults = await db.select().from(schema.states).where(inArray(schema.states.name, commonStates));
      
      // D. Link States to Project (Many-to-Many)
      for (const stateRow of stateResults) {
        // Check if link exists
        const linkExists = await db.select()
          .from(schema.projectStates)
          .where(and(
             eq(schema.projectStates.projectId, projectId),
             eq(schema.projectStates.stateId, stateRow.id)
          ))
          .limit(1);

        if (linkExists.length === 0) {
          await db.insert(schema.projectStates).values({
            projectId: projectId,
            stateId: stateRow.id
          });
        }
      }
    }

    console.log('✅ Seeding Complete!');
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
  } finally {
    await queryClient.end();
  }
}

seed();