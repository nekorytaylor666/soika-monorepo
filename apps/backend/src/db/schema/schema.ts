import { relations, sql } from "drizzle-orm";
import {
  doublePrecision,
  index,
  integer,
  pgSchema,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

import { customType } from "drizzle-orm/pg-core";
import jsonb from "../custom-types";

export const profile = pgTable("profile", {
  // Matches id from auth.users table in Supabase
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  image: text("image"),
});

export const deals = pgTable("deals", {
  id: uuid("id").defaultRandom().primaryKey(),
  lot: integer("lot_id").references(() => lots.id),
  createdAt: timestamp("created_at")
    .default(sql`now()`)
    .notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => profile.id),
});

export type Deal = typeof deals.$inferSelect & {
  lot: Lot;
};

export const dealRelations = relations(deals, ({ one }) => ({
  lot: one(lots, { fields: [deals.lot], references: [lots.id] }),
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
});

export type Board = typeof boards.$inferSelect;

export const boardsStatuses = pgTable("boards_statuses", {
  id: uuid("id").defaultRandom().primaryKey(),
  board: uuid("board_id").references(() => boards.id),
  status: text("status"),
  order: integer("order"),
});

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
    files: jsonb("files").$type<
      Array<{
        nameRu: string;
        filePath: string;
        originalName: string;
      }>
    >(),
    createdAt: timestamp("created_at")
      .default(sql`now()`)
      .notNull(),
    updatedAt: timestamp("updated_at")
      .default(sql`now()`)
      .notNull(),
    embedding: vector("embedding", {
      dimensions: 1536,
    }),
  },
  (table) => ({
    lotNameSearchIndex: index("lot_name_search_index").using(
      "gin",
      sql`to_tsvector('russian', ${table.lotName})`
    ),
  })
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
  })
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
  })
);

export const tradeMethods = pgTable("trade_methods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
});

export type TradeMethod = typeof tradeMethods.$inferSelect;
