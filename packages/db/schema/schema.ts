import { type SQL, relations, sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import type { TechnicalSpecification } from "../../../apps/core/src/lib/extractSpecs";

import { customType } from "drizzle-orm/pg-core";
import { z } from "zod";
import { jsonb, tsVector } from "../custom-types";

export const profile = pgTable("profile", {
  // Matches id from auth.users table in Supabase
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  image: text("image"),
});

export type Profile = typeof profile.$inferSelect;

export const profileRelations = relations(profile, ({ many, one }) => ({
  organizations: many(organizationMembers),
  onboarding: one(onboarding),
}));

export const onboarding = pgTable("onboarding", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => profile.id),
  completed: boolean("completed").default(false),
});

export const onboardingRelations = relations(onboarding, ({ one }) => ({
  user: one(profile, { fields: [onboarding.userId], references: [profile.id] }),
}));

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  lot: integer("lot_id").references(() => lots.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profile.id),
  organizationId: uuid("organization_id").references(() => organizations.id),
});

export type Deal = typeof deals.$inferSelect & {
  lot: Lot;
};

export const dealRelations = relations(deals, ({ one, many }) => ({
  lot: one(lots, { fields: [deals.lot], references: [lots.id] }),
  tasks: many(dealTasks),
  organization: one(organizations, {
    fields: [deals.organizationId],
    references: [organizations.id],
  }),
}));
// Define the enums
export const taskStatusEnum = pgEnum("task_status", [
  "not_started",
  "in_progress",
  "completed",
]);

export const taskStatusEnumSchema = z.enum(taskStatusEnum.enumValues);

export type TaskStatus = z.infer<typeof taskStatusEnumSchema>;

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
]);

export const taskPriorityEnumSchema = z.enum(taskPriorityEnum.enumValues);

export type TaskPriority = z.infer<typeof taskPriorityEnumSchema>;

export const dealTasks = pgTable("deal_tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  deal: uuid("deal_id").references(() => deals.id),
  name: text("name"),
  description: text("description"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profile.id),
  isCompleted: boolean("is_completed").default(false),
  isArchived: boolean("is_archived").default(false),
  completedAt: timestamp("completed_at"),
  completedBy: uuid("completed_by").references(() => profile.id),
  assignedTo: uuid("assigned_to").references(() => profile.id),
  assignedAt: timestamp("assigned_at").default(sql`now()`),
  assignedBy: uuid("assigned_by").references(() => profile.id),
  dueDate: timestamp("due_date"),
  // Add these new fields
  status: taskStatusEnum("status").default("not_started").notNull(),
  priority: taskPriorityEnum("priority").default("medium").notNull(),
});

export type DealTask = typeof dealTasks.$inferSelect;

export const dealTasksRelations = relations(dealTasks, ({ one }) => ({
  deal: one(deals, { fields: [dealTasks.deal], references: [deals.id] }),
}));

export const dealBoard = pgTable("deal_board", {
  id: uuid("id").defaultRandom().primaryKey(),
  deal: uuid("deal_id").references(() => deals.id),
  status: uuid("status_id")
    .default(sql`'d4fe1764-18e8-4322-a833-f0b25a498989'::uuid`)
    .references(() => boardsStatuses.id),
  board: uuid("board_id").references(() => boards.id),
});

export type BoardDeal = typeof dealBoard.$inferSelect & {
  deal: Deal;
  board: Board;
  status: Status;
};

export const dealBoardRelations = relations(dealBoard, ({ one }) => ({
  deal: one(deals, { fields: [dealBoard.deal], references: [deals.id] }),
  board: one(boards, { fields: [dealBoard.board], references: [boards.id] }),
  status: one(boardsStatuses, {
    fields: [dealBoard.status],
    references: [boardsStatuses.id],
  }),
}));

export const boards = pgTable("boards", {
  id: uuid("id").defaultRandom().primaryKey(),
  boardOwner: uuid("board_owner").references(() => profile.id),
  name: text("name"),
  organizationId: uuid("organization_id").references(() => organizations.id),
});

export type Board = typeof boards.$inferSelect & {
  statuses: Status[];
};

export const boardRelations = relations(boards, ({ many, one }) => ({
  statuses: many(boardsStatuses),
  deals: many(dealBoard),
  organization: one(organizations, {
    fields: [boards.organizationId],
    references: [organizations.id],
  }),
}));

export const boardsStatuses = pgTable("boards_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  board: uuid("board_id").references(() => boards.id),
  status: text("status"),
  order: integer("order"),
  isArchived: boolean("is_archived").default(false),
});

export const boardsStatusesRelations = relations(boardsStatuses, ({ one }) => ({
  board: one(boards, {
    fields: [boardsStatuses.board],
    references: [boards.id],
  }),
}));

export type Status = typeof boardsStatuses.$inferSelect;

export const tenders = pgTable("tenders", {
  id: serial("id").primaryKey(),
  purchaseNumber: text("purchase_number"),
  name: text("name"),
  status: text("status"),
  applicationStartDate: text("application_start_date"),
  applicationEndDate: text("application_end_date"),
  budget: doublePrecision("budget"),
});

export const tenderRelations = relations(tenders, ({ many }) => ({
  lots: many(lots),
}));

export const lots = pgTable(
  "lots",
  {
    id: integer("id").primaryKey(), // Consider if you need a separate PK
    tenderId: integer("tender_id"),
    purchaseNumber: text("purchase_number"),
    purchaseName: text("purchase_name"),
    lotNumber: text("lot_number").notNull(),
    lotName: text("lot_name"),
    lotDescription: text("lot_description"),
    lotAdditionalDescription: text("lot_additional_description"),
    quantity: doublePrecision("quantity"),
    unitOfMeasure: text("unit_of_measure"),
    budget: doublePrecision("budget"),
    deliveryPlaces: text("delivery_places"),
    lotSpecifications: text("lot_specifications"),
    deliveryTerm: text("delivery_term"),
    consultingServices: integer("consulting_services"),
    customerId: integer("customer_id"),
    customerBin: text("customer_bin"),
    customerNameRu: text("customer_name_ru"),
    enstruList: integer("enstru_list")
      .array()
      .notNull()
      .default(sql`ARRAY[]::int[]`),
    trdBuyNumberAnno: text("trd_buy_number_anno"),
    refLotsStatus: jsonb("ref_lots_status").$type<{
      id: number;
      nameRu: string;
      code: string;
    }>(),
    count: integer("count"),
    indexDate: text("index_date"), // Consider changing to a date type
    refTradeMethods: jsonb("ref_trade_methods").$type<{
      nameRu: string;
      id: number;
      code: string;
    }>(),
    plnPointKatoList: text("pln_point_kato_list")
      .array()
      .notNull()
      .default(sql`ARRAY[]::text[]`),
    files:
      jsonb("files").$type<
        Array<{
          nameRu: string;
          filePath: string;
          originalName: string;
        }>
      >(),
    filesWithText:
      jsonb("files_with_text").$type<
        Array<{
          nameRu: string;
          filePath: string;
          originalName: string;
          text: string | string[];
        }>
      >(),
    createdAt: timestamp("created_at").default(sql`now()`).notNull(),
    updatedAt: timestamp("updated_at").default(sql`now()`).notNull(),
    embedding: vector("embedding", {
      dimensions: 1536,
    }),
    // Generated column for full-text search (Russian)
    fts: tsVector("fts").generatedAlwaysAs(
      (): SQL =>
        sql`to_tsvector('russian', coalesce(${lots.lotName}, '') || ' ' || coalesce(${lots.lotDescription}, '') || ' ' || coalesce(${lots.lotAdditionalDescription}, ''))`,
    ),
  },
  (table) => ({
    ftsIdx: index("idx_lots_fts").using("gin", table.fts),
  }),
);
export type Lot = typeof lots.$inferSelect;

export const lotRelations = relations(lots, ({ one, many }) => ({
  tender: one(tenders, { fields: [lots.tenderId], references: [tenders.id] }),
  recommendedProducts: many(recommendedProducts),
  plagiarismCheck: one(plagiarismCheck),
}));

export const recommendedProducts = pgTable("recommended_products", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").references(() => lots.id, { onDelete: "cascade" }),
  productName: text("product_name"),
  productDescription: text("product_description"),
  productSpecifications: text("product_specifications"),
  sourceUrl: text("source_url"),
  price: doublePrecision("price"),
  unitOfMeasure: text("unit_of_measure"),
  currency: text("currency"),
  imageUrl: text("image_url"),
  complianceScore: integer("compliance_score"),
  complianceDetails: jsonb("compliance_details"),
});

export type RecommendedProduct = typeof recommendedProducts.$inferSelect;

export const recommendedProductsRelations = relations(
  recommendedProducts,
  ({ one }) => ({
    lot: one(lots, {
      fields: [recommendedProducts.lotId],
      references: [lots.id],
    }),
  }),
);

export const plagiarismCheck = pgTable("plagiarism_check", {
  id: serial("id").primaryKey(),
  lotId: integer("lot_id").references(() => lots.id, { onDelete: "cascade" }),
  unique: doublePrecision("unique"),
  urls: jsonb("urls").$type<{ url: string; plagiat: number }[]>(),
});

export const plagiarismCheckRelations = relations(
  plagiarismCheck,
  ({ one }) => ({
    lot: one(lots, { fields: [plagiarismCheck.lotId], references: [lots.id] }),
  }),
);

export const tradeMethods = pgTable("trade_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export type TradeMethod = typeof tradeMethods.$inferSelect;

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  bin: text("bin").notNull().unique(),
  name: text("name").notNull(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profile.id),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  isContractsIngested: boolean("is_contracts_ingested").default(false),
});

export type Organization = typeof organizations.$inferSelect;

export const organizationRelations = relations(
  organizations,
  ({ one, many }) => ({
    owner: one(profile, {
      fields: [organizations.ownerId],
      references: [profile.id],
    }),
    members: many(organizationMembers),
  }),
);

export const organizationMembers = pgTable("organization_members", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id),
  role: text("role").notNull().default("member"),
  joinedAt: timestamp("joined_at").default(sql`now()`).notNull(),
});

export type OrganizationMember = typeof organizationMembers.$inferSelect;

export const organizationMemberRelations = relations(
  organizationMembers,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationMembers.organizationId],
      references: [organizations.id],
    }),
    profile: one(profile, {
      fields: [organizationMembers.profileId],
      references: [profile.id],
    }),
  }),
);

export const organizationInvitations = pgTable("organization_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  email: text("email").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  invitedById: uuid("invited_by_id")
    .notNull()
    .references(() => profile.id),
});

export const organizationInvitationsRelations = relations(
  organizationInvitations,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationInvitations.organizationId],
      references: [organizations.id],
    }),
    invitedBy: one(profile, {
      fields: [organizationInvitations.invitedById],
      references: [profile.id],
    }),
  }),
);

export const organizationSettings = pgTable("organization_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  allowMemberInvites: boolean("allow_member_invites").default(false),
  defaultMemberRole: text("default_member_role").default("member"),
});

export const organizationSettingsRelations = relations(
  organizationSettings,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationSettings.organizationId],
      references: [organizations.id],
    }),
  }),
);

export const organizationActivityLog = pgTable("organization_activity_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id),
  actorId: uuid("actor_id")
    .notNull()
    .references(() => profile.id),
  action: text("action").notNull(),
  details: jsonb("details"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const organizationActivityLogRelations = relations(
  organizationActivityLog,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationActivityLog.organizationId],
      references: [organizations.id],
    }),
    actor: one(profile, {
      fields: [organizationActivityLog.actorId],
      references: [profile.id],
    }),
  }),
);
export const scheduleFrequencyEnum = pgEnum("schedule_frequency", [
  "daily",
  "weekly",
  "monthly",
]);

export const scheduleFrequencyEnumSchema = z.enum(
  scheduleFrequencyEnum.enumValues,
);

export type ScheduleFrequency = z.infer<typeof scheduleFrequencyEnumSchema>;

export const schedules = pgTable("schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profile.id),
  query: text("query").notNull(),
  filters: jsonb("filters"),
  frequency: scheduleFrequencyEnum("frequency").default("daily"),
  organizationId: uuid("organization_id").references(() => organizations.id),
});

export type Schedule = typeof schedules.$inferSelect;

export const scheduleRelations = relations(schedules, ({ many, one }) => ({
  results: many(scheduleResults),
  organization: one(organizations, {
    fields: [schedules.organizationId],
    references: [organizations.id],
  }),
}));

export const scheduleResults = pgTable("schedule_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  scheduleId: uuid("schedule_id").references(() => schedules.id),
  result: jsonb("result"),
});

export type ScheduleResult = typeof scheduleResults.$inferSelect;

export const recommendedLots = pgTable("recommended_lots", {
  id: uuid("id").defaultRandom().primaryKey(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  results: jsonb("results"),
});

export type RecommendedLots = typeof recommendedLots.$inferSelect;

export const scheduleResultsRelations = relations(
  scheduleResults,
  ({ one }) => ({
    schedule: one(schedules, {
      fields: [scheduleResults.scheduleId],
      references: [schedules.id],
    }),
  }),
);

export const telegramUsers = pgTable("telegram_users", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profile.id)
    .notNull(),
  telegramId: text("telegram_id").notNull().unique(),
  chatId: text("chat_id").notNull(),
  username: text("username"),
  firstName: text("first_name"),
  lastName: text("last_name"),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

export const telegramUserRelations = relations(telegramUsers, ({ one }) => ({
  profile: one(profile, {
    fields: [telegramUsers.profileId],
    references: [profile.id],
  }),
}));

// Add this new table for notification preferences
export const notificationPreferences = pgTable("notification_preferences", {
  id: serial("id").primaryKey(),
  profileId: uuid("profile_id")
    .references(() => profile.id)
    .notNull(),
  newReports: boolean("new_reports").default(true),
  newRecommendations: boolean("new_recommendations").default(true),
});

export const notificationPreferencesRelations = relations(
  notificationPreferences,
  ({ one }) => ({
    profile: one(profile, {
      fields: [notificationPreferences.profileId],
      references: [profile.id],
    }),
  }),
);

// Contracts table
export const contracts = pgTable("contracts", {
  id: text("id"),
  contractSum: text("contract_sum").notNull(),
  faktSum: text("fakt_sum").notNull(),
  supplierBik: text("supplier_bik"),
  supplierBiin: text("supplier_biin"),
  supplierId: integer("supplier_id"),
  customerBik: text("customer_bik"),
  descriptionRu: text("description_ru"),
  customerBin: text("customer_bin"),
  technicalSpecification: text("technical_specification"),
  contractDate: timestamp("contract_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
  localContentProjectedShare: doublePrecision("local_content_projected_share"),
  truHistory: jsonb("tru_history").$type<{
    code: string;
    ru: string;
    briefRu: string;
  }>(),
  // JSONB fields
  refSubjectType: jsonb("ref_subject_type").$type<{
    nameRu: string;
    id: number;
  }>(),
  refContractStatus: jsonb("ref_contract_status").$type<{
    id: number;
    nameRu: string;
  }>(),
  trdBuy: jsonb("trd_buy").$type<{
    id: number;
    numberAnno: string;
    nameRu: string;
  }>(),
  contractUnit: jsonb("contract_unit").$type<{
    id: number;
    lotId: number;
  }>(),
  lot: jsonb("lot").$type<{
    id: number;
    nameRu: string;
    descriptionRu: string;
  }>(),
  embedding: vector("embedding", {
    dimensions: 1536,
  }),
});

// Goszakup contracts table
export const goszakupContracts = pgTable("goszakup_contracts", {
  id: text("id"),
  contractSum: text("contract_sum").notNull(),
  faktSum: text("fakt_sum").notNull(),
  supplierBik: text("supplier_bik"),
  supplierBiin: text("supplier_biin"),
  supplierId: integer("supplier_id"),
  customerBik: text("customer_bik"),
  descriptionRu: text("description_ru"),
  customerBin: text("customer_bin"),
  technicalSpecification: jsonb(
    "technical_specification",
  ).$type<TechnicalSpecification>(),
  contractDate: timestamp("contract_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
  localContentProjectedShare: doublePrecision("local_content_projected_share"),

  truHistory: jsonb("tru_history").$type<{
    code: string;
    ru: string;
    briefRu: string;
  }>(),
  // JSONB fields
  refSubjectType: jsonb("ref_subject_type").$type<{
    nameRu: string;
    id: number;
  }>(),
  refContractStatus: jsonb("ref_contract_status").$type<{
    id: number;
    nameRu: string;
  }>(),
  trdBuy: jsonb("trd_buy").$type<{
    id: number;
    numberAnno: string;
    nameRu: string;
  }>(),
  contractUnit: jsonb("contract_unit").$type<{
    id: number;
    lotId: number;
  }>(),
  lot: jsonb("lot").$type<{
    id: number;
    nameRu: string;
    descriptionRu: string;
    ktruCode: string;
  }>(),
  embedding: vector("embedding", {
    dimensions: 1536,
  }),
  contractms: text("contractms"),
  technicalSpecificationText: text("technical_specification_text"),
});

// Suppliers table
export const suppliers = pgTable("suppliers", {
  id: integer("id").primaryKey(),
  bin: text("bin"),
  nameRu: text("name_ru").notNull(),
  iin: text("iin"),
  fullNameRu: text("full_name_ru"),
  systemId: integer("system_id"),
});

// Customers table
export const customers = pgTable("customers", {
  id: uuid("id").defaultRandom().primaryKey(),
  systemId: integer("system_id"),
  bin: text("bin"),
  iin: text("iin"),
  nameRu: text("name_ru").notNull(),
  fullNameRu: text("full_name_ru"),
});

// Relations
export const contractRelations = relations(contracts, ({ one }) => ({
  supplier: one(suppliers, {
    fields: [contracts.supplierId],
    references: [suppliers.id],
  }),
  customer: one(customers, {
    fields: [contracts.customerBin],
    references: [customers.bin],
  }),
}));

// Add relations for goszakupContracts
export const goszakupContractRelations = relations(
  goszakupContracts,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [goszakupContracts.supplierId],
      references: [suppliers.id],
    }),
    customer: one(customers, {
      fields: [goszakupContracts.customerBin],
      references: [customers.bin],
    }),
  }),
);

// Add this new table for Samruk contracts
export const samrukContracts = pgTable("samruk_contracts", {
  id: text("id").primaryKey(),
  contractSum: text("contract_sum").notNull(),
  supplierBiin: text("supplier_biin"),
  supplierId: text("supplier_id"),
  customerBin: text("customer_bin"),
  descriptionRu: text("description_ru"),
  contractDate: timestamp("contract_date"),
  createdAt: timestamp("created_at").default(sql`now()`),
  localContentProjectedShare: doublePrecision("local_content_projected_share"),
  technicalSpecification: text("technical_specification"),
  systemNumber: text("system_number"),
  contractCardStatus: text("contract_card_status"),
  advertNumber: text("advert_number"),
  truHistory: jsonb("tru_history").$type<{
    code: string;
    ru: string;
    briefRu: string;
  }>(),
  lot: jsonb("lot").$type<{
    id: number;
    lotNumber: string;
    count: number;
    foreignPrice: number;
    sumNds: number;
  }>(),
  embedding: vector("embedding", {
    dimensions: 1536,
  }),
});

// Add relations for samrukContracts
export const samrukContractRelations = relations(
  samrukContracts,
  ({ one }) => ({
    supplier: one(suppliers, {
      fields: [samrukContracts.supplierId],
      references: [suppliers.id],
    }),
    customer: one(customers, {
      fields: [samrukContracts.customerBin],
      references: [customers.bin],
    }),
  }),
);
