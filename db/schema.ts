import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const scenes = sqliteTable(
  'scenes',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull(),
    title: text('title').notNull(),
    sourceTitle: text('source_title').notNull(),
    sourceType: text('source_type').notNull(),
    synopsis: text('synopsis').notNull(),
    genre: text('genre').notNull(),
    ageRating: text('age_rating').notNull(),
    challengeDate: text('challenge_date').notNull(),
    durationMs: integer('duration_ms').notNull(),
    videoObjectKey: text('video_object_key'),
    previewImageObjectKey: text('preview_image_object_key'),
    status: text('status').notNull().default('draft'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex('idx_scenes_slug').on(table.slug),
    uniqueIndex('idx_scenes_challenge_date').on(table.challengeDate),
  ],
);

export const roles = sqliteTable(
  'roles',
  {
    id: text('id').primaryKey(),
    sceneId: text('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
  },
  (table) => [index('idx_roles_scene_id').on(table.sceneId)],
);

export const scriptLines = sqliteTable(
  'script_lines',
  {
    id: text('id').primaryKey(),
    sceneId: text('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
    roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
    sequence: integer('sequence').notNull(),
    startMs: integer('start_ms').notNull(),
    endMs: integer('end_ms').notNull(),
    text: text('text').notNull(),
    direction: text('direction'),
  },
  (table) => [uniqueIndex('idx_script_lines_scene_sequence').on(table.sceneId, table.sequence)],
);

export const contentLicenses = sqliteTable(
  'content_licenses',
  {
    id: text('id').primaryKey(),
    sceneId: text('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
    licensorName: text('licensor_name').notNull(),
    territory: text('territory').notNull(),
    usageStartsAt: text('usage_starts_at').notNull(),
    usageEndsAt: text('usage_ends_at'),
    proofObjectKey: text('proof_object_key'),
    status: text('status').notNull().default('pending'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('idx_content_licenses_scene_id').on(table.sceneId)],
);
