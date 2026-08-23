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

export const users = sqliteTable(
  'users',
  {
    id: text('id').primaryKey(),
    authUserId: text('auth_user_id').notNull(),
    email: text('email').notNull(),
    displayName: text('display_name').notNull(),
    bio: text('bio'),
    currentStreak: integer('current_streak').notNull().default(0),
    longestStreak: integer('longest_streak').notNull().default(0),
    lastCompletedDate: text('last_completed_date'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('idx_users_auth_user_id').on(table.authUserId)],
);

export const submissions = sqliteTable(
  'submissions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sceneId: text('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
    roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'restrict' }),
    mode: text('mode').notNull(),
    visibility: text('visibility').notNull().default('public'),
    caption: text('caption'),
    status: text('status').notNull().default('published'),
    publishedAt: integer('published_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    index('idx_submissions_user_published').on(table.userId, table.publishedAt),
    index('idx_submissions_scene_published').on(table.sceneId, table.publishedAt),
  ],
);

export const submissionAudio = sqliteTable(
  'submission_audio',
  {
    id: text('id').primaryKey(),
    submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
    scriptLineId: text('script_line_id').notNull().references(() => scriptLines.id, { onDelete: 'restrict' }),
    objectKey: text('object_key').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    durationMs: integer('duration_ms').notNull(),
  },
  (table) => [
    uniqueIndex('idx_submission_audio_line').on(table.submissionId, table.scriptLineId),
    uniqueIndex('idx_submission_audio_object_key').on(table.objectKey),
  ],
);

export const dailyCompletions = sqliteTable(
  'daily_completions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    sceneId: text('scene_id').notNull().references(() => scenes.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
    completionDate: text('completion_date').notNull(),
    completedAt: integer('completed_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('idx_daily_completions_user_date').on(table.userId, table.completionDate)],
);

export const reactions = sqliteTable(
  'reactions',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [
    uniqueIndex('idx_reactions_user_submission_type').on(table.userId, table.submissionId, table.type),
    index('idx_reactions_submission_id').on(table.submissionId),
  ],
);

export const reports = sqliteTable(
  'reports',
  {
    id: text('id').primaryKey(),
    reporterUserId: text('reporter_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    submissionId: text('submission_id').notNull().references(() => submissions.id, { onDelete: 'cascade' }),
    reason: text('reason').notNull(),
    status: text('status').notNull().default('open'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [index('idx_reports_submission_status').on(table.submissionId, table.status)],
);
