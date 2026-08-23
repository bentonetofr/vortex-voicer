import { sql } from 'drizzle-orm';
import { index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

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

export const gameRooms = sqliteTable(
  'game_rooms',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull(),
    hostUserId: text('host_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    mode: text('mode').notNull().default('classic'),
    status: text('status').notNull().default('lobby'),
    currentRound: integer('current_round').notNull().default(0),
    totalRounds: integer('total_rounds').notNull().default(5),
    maxPlayers: integer('max_players').notNull().default(8),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('idx_game_rooms_code').on(table.code), index('idx_game_rooms_status').on(table.status)],
);

export const roomPlayers = sqliteTable(
  'room_players',
  {
    roomId: text('room_id').notNull().references(() => gameRooms.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    seat: integer('seat').notNull(),
    joinedAt: integer('joined_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [primaryKey({ columns: [table.roomId, table.userId] }), uniqueIndex('idx_room_players_seat').on(table.roomId, table.seat), index('idx_room_players_user').on(table.userId)],
);

export const gameRounds = sqliteTable(
  'game_rounds',
  {
    id: text('id').primaryKey(),
    roomId: text('room_id').notNull().references(() => gameRooms.id, { onDelete: 'cascade' }),
    roundNumber: integer('round_number').notNull(),
    sceneSlug: text('scene_slug').notNull(),
    status: text('status').notNull().default('queued'),
    createdAt: integer('created_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('idx_game_rounds_room_number').on(table.roomId, table.roundNumber), index('idx_game_rounds_room_status').on(table.roomId, table.status)],
);

export const roundSubmissions = sqliteTable(
  'round_submissions',
  {
    id: text('id').primaryKey(),
    roundId: text('round_id').notNull().references(() => gameRounds.id, { onDelete: 'cascade' }),
    userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    audioObjectKey: text('audio_object_key').notNull(),
    contentType: text('content_type').notNull(),
    sizeBytes: integer('size_bytes').notNull(),
    durationMs: integer('duration_ms').notNull(),
    submittedAt: integer('submitted_at', { mode: 'timestamp' }).notNull().default(sql`(unixepoch())`),
  },
  (table) => [uniqueIndex('idx_round_submissions_round_user').on(table.roundId, table.userId), uniqueIndex('idx_round_submissions_object').on(table.audioObjectKey), index('idx_round_submissions_round_time').on(table.roundId, table.submittedAt)],
);
