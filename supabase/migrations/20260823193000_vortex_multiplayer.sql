begin;

create extension if not exists pgcrypto;

create schema if not exists vortex;
revoke all on schema vortex from public, anon, authenticated;
grant usage on schema vortex to service_role;

create table if not exists vortex.users (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null unique,
  email text not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_auth_user_id_not_blank check (length(btrim(auth_user_id)) > 0),
  constraint users_email_not_blank check (length(btrim(email)) > 0),
  constraint users_display_name_not_blank check (length(btrim(display_name)) > 0)
);

create table if not exists vortex.game_rooms (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  host_user_id uuid not null references vortex.users(id) on delete cascade,
  mode text not null default 'classic',
  status text not null default 'lobby',
  current_round smallint not null default 0,
  total_rounds smallint not null default 5,
  max_players smallint not null default 8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint game_rooms_code_format check (code ~ '^[A-Z2-9]{6}$'),
  constraint game_rooms_mode_check check (mode in ('classic')),
  constraint game_rooms_status_check check (status in ('lobby', 'starting', 'playing', 'playback', 'finished')),
  constraint game_rooms_round_check check (current_round between 0 and total_rounds),
  constraint game_rooms_total_rounds_check check (total_rounds = 5),
  constraint game_rooms_max_players_check check (max_players between 1 and 8)
);

create table if not exists vortex.room_players (
  room_id uuid not null references vortex.game_rooms(id) on delete cascade,
  user_id uuid not null references vortex.users(id) on delete cascade,
  seat smallint not null,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  unique (room_id, seat),
  constraint room_players_seat_check check (seat between 1 and 8)
);

create table if not exists vortex.game_rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references vortex.game_rooms(id) on delete cascade,
  round_number smallint not null,
  scene_slug text not null,
  status text not null default 'queued',
  created_at timestamptz not null default now(),
  unique (room_id, round_number),
  constraint game_rounds_number_check check (round_number between 1 and 5),
  constraint game_rounds_scene_slug_not_blank check (length(btrim(scene_slug)) > 0),
  constraint game_rounds_status_check check (status in ('queued', 'recording', 'playback', 'completed'))
);

create table if not exists vortex.round_submissions (
  id uuid primary key,
  round_id uuid not null references vortex.game_rounds(id) on delete cascade,
  user_id uuid not null references vortex.users(id) on delete cascade,
  audio_object_key text not null unique,
  content_type text not null,
  size_bytes integer not null,
  duration_ms integer not null,
  submitted_at timestamptz not null default now(),
  unique (round_id, user_id),
  constraint round_submissions_object_key_not_blank check (length(btrim(audio_object_key)) > 0),
  constraint round_submissions_content_type_check check (content_type in ('audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg')),
  constraint round_submissions_size_check check (size_bytes between 1 and 12582912),
  constraint round_submissions_duration_check check (duration_ms between 250 and 900000)
);

create index if not exists game_rooms_host_created_idx on vortex.game_rooms(host_user_id, created_at desc);
create index if not exists game_rooms_status_idx on vortex.game_rooms(status);
create index if not exists room_players_user_idx on vortex.room_players(user_id);
create index if not exists game_rounds_room_status_idx on vortex.game_rounds(room_id, status);
create index if not exists round_submissions_round_time_idx on vortex.round_submissions(round_id, submitted_at);

create or replace function vortex.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on vortex.users;
create trigger users_set_updated_at before update on vortex.users
for each row execute function vortex.set_updated_at();

drop trigger if exists game_rooms_set_updated_at on vortex.game_rooms;
create trigger game_rooms_set_updated_at before update on vortex.game_rooms
for each row execute function vortex.set_updated_at();

revoke all on function vortex.set_updated_at() from public, anon, authenticated;
grant execute on function vortex.set_updated_at() to service_role;

alter table vortex.users enable row level security;
alter table vortex.game_rooms enable row level security;
alter table vortex.room_players enable row level security;
alter table vortex.game_rounds enable row level security;
alter table vortex.round_submissions enable row level security;

revoke all on all tables in schema vortex from public, anon, authenticated;
revoke all on all sequences in schema vortex from public, anon, authenticated;
grant select, insert, update, delete on all tables in schema vortex to service_role;
grant usage, select on all sequences in schema vortex to service_role;

create or replace function public.vortex_upsert_user(
  p_auth_user_id text,
  p_email text,
  p_display_name text
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user vortex.users%rowtype;
begin
  insert into vortex.users as target (auth_user_id, email, display_name)
  values (p_auth_user_id, p_email, p_display_name)
  on conflict (auth_user_id) do update
  set email = excluded.email,
      display_name = excluded.display_name,
      updated_at = now()
  returning target.* into v_user;

  return jsonb_build_object('id', v_user.id, 'display_name', v_user.display_name);
end;
$$;

create or replace function public.vortex_create_room(p_user_id uuid, p_code text)
returns text
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room_id uuid := gen_random_uuid();
begin
  if p_code !~ '^[A-Z2-9]{6}$' then
    raise exception using errcode = 'P0001', message = 'invalid_room_code';
  end if;

  if not exists (select 1 from vortex.users where id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'user_not_found';
  end if;

  insert into vortex.game_rooms (id, code, host_user_id)
  values (v_room_id, p_code, p_user_id);

  insert into vortex.room_players (room_id, user_id, seat)
  values (v_room_id, p_user_id, 1);

  return p_code;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'room_code_unavailable';
end;
$$;

create or replace function public.vortex_join_room(p_code text, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room vortex.game_rooms%rowtype;
  v_player_count integer;
  v_next_seat smallint;
begin
  select * into v_room
  from vortex.game_rooms
  where code = upper(p_code)
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'room_not_found';
  end if;

  if exists (select 1 from vortex.room_players where room_id = v_room.id and user_id = p_user_id) then
    return;
  end if;

  if v_room.status <> 'lobby' then
    raise exception using errcode = 'P0001', message = 'game_already_started';
  end if;

  select count(*), coalesce(max(seat), 0) + 1
  into v_player_count, v_next_seat
  from vortex.room_players
  where room_id = v_room.id;

  if v_player_count >= v_room.max_players or v_next_seat > v_room.max_players then
    raise exception using errcode = 'P0001', message = 'room_full';
  end if;

  insert into vortex.room_players (room_id, user_id, seat)
  values (v_room.id, p_user_id, v_next_seat);
end;
$$;

create or replace function public.vortex_start_game(
  p_code text,
  p_user_id uuid,
  p_scene_slugs text[]
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room vortex.game_rooms%rowtype;
  v_distinct_scenes integer;
begin
  select * into v_room
  from vortex.game_rooms
  where code = upper(p_code)
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'room_not_found';
  end if;
  if v_room.host_user_id <> p_user_id then
    raise exception using errcode = 'P0001', message = 'host_only';
  end if;
  if v_room.status <> 'lobby' then
    raise exception using errcode = 'P0001', message = 'game_already_started';
  end if;

  select count(distinct slug) into v_distinct_scenes
  from unnest(p_scene_slugs) as scene(slug);
  if cardinality(p_scene_slugs) <> 5 or v_distinct_scenes <> 5 then
    raise exception using errcode = 'P0001', message = 'invalid_scene_set';
  end if;

  update vortex.game_rooms
  set status = 'starting'
  where id = v_room.id;

  insert into vortex.game_rounds (room_id, round_number, scene_slug, status)
  select v_room.id,
         item.ordinality::smallint,
         item.slug,
         case when item.ordinality = 1 then 'recording' else 'queued' end
  from unnest(p_scene_slugs) with ordinality as item(slug, ordinality);

  update vortex.game_rooms
  set status = 'playing', current_round = 1
  where id = v_room.id;
end;
$$;

create or replace function public.vortex_advance_round(p_code text, p_user_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room vortex.game_rooms%rowtype;
  v_next_round smallint;
begin
  select * into v_room
  from vortex.game_rooms
  where code = upper(p_code)
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'room_not_found';
  end if;
  if v_room.host_user_id <> p_user_id then
    raise exception using errcode = 'P0001', message = 'host_only';
  end if;
  if v_room.status <> 'playback' then
    raise exception using errcode = 'P0001', message = 'round_not_ready';
  end if;

  update vortex.game_rounds
  set status = 'completed'
  where room_id = v_room.id and round_number = v_room.current_round;

  if v_room.current_round >= v_room.total_rounds then
    update vortex.game_rooms set status = 'finished' where id = v_room.id;
    return;
  end if;

  v_next_round := v_room.current_round + 1;
  update vortex.game_rounds
  set status = 'recording'
  where room_id = v_room.id and round_number = v_next_round;

  update vortex.game_rooms
  set status = 'playing', current_round = v_next_round
  where id = v_room.id;
end;
$$;

create or replace function public.vortex_submit_round(
  p_code text,
  p_user_id uuid,
  p_submission_id uuid,
  p_audio_object_key text,
  p_content_type text,
  p_size_bytes integer,
  p_duration_ms integer
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_room vortex.game_rooms%rowtype;
  v_round vortex.game_rounds%rowtype;
  v_player_count integer;
  v_submission_count integer;
begin
  select * into v_room
  from vortex.game_rooms
  where code = upper(p_code)
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'room_not_found';
  end if;
  if not exists (select 1 from vortex.room_players where room_id = v_room.id and user_id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;
  if v_room.status <> 'playing' then
    raise exception using errcode = 'P0001', message = 'round_not_recording';
  end if;

  select * into v_round
  from vortex.game_rounds
  where room_id = v_room.id and round_number = v_room.current_round and status = 'recording';
  if not found then
    raise exception using errcode = 'P0001', message = 'round_not_recording';
  end if;

  insert into vortex.round_submissions
    (id, round_id, user_id, audio_object_key, content_type, size_bytes, duration_ms)
  values
    (p_submission_id, v_round.id, p_user_id, p_audio_object_key, p_content_type, p_size_bytes, p_duration_ms);

  select count(*) into v_player_count from vortex.room_players where room_id = v_room.id;
  select count(*) into v_submission_count from vortex.round_submissions where round_id = v_round.id;

  if v_submission_count >= v_player_count then
    update vortex.game_rounds set status = 'playback' where id = v_round.id;
    update vortex.game_rooms set status = 'playback' where id = v_room.id;
  end if;
exception
  when unique_violation then
    raise exception using errcode = 'P0001', message = 'already_submitted';
end;
$$;

create or replace function public.vortex_get_room_state(p_code text, p_user_id uuid)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_room vortex.game_rooms%rowtype;
  v_round vortex.game_rounds%rowtype;
  v_seat smallint;
  v_display_name text;
  v_players jsonb := '[]'::jsonb;
  v_submissions jsonb := '[]'::jsonb;
  v_round_json jsonb := null;
begin
  select * into v_room from vortex.game_rooms where code = upper(p_code);
  if not found then
    raise exception using errcode = 'P0001', message = 'room_not_found';
  end if;

  select rp.seat, u.display_name into v_seat, v_display_name
  from vortex.room_players rp
  join vortex.users u on u.id = rp.user_id
  where rp.room_id = v_room.id and rp.user_id = p_user_id;
  if not found then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;

  if v_room.current_round > 0 then
    select * into v_round
    from vortex.game_rounds
    where room_id = v_room.id and round_number = v_room.current_round;

    v_round_json := jsonb_build_object(
      'id', v_round.id,
      'round_number', v_round.round_number,
      'scene_slug', v_round.scene_slug,
      'status', v_round.status
    );

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', rs.id,
      'user_id', rs.user_id,
      'display_name', u.display_name,
      'seat', rp.seat
    ) order by rp.seat), '[]'::jsonb)
    into v_submissions
    from vortex.round_submissions rs
    join vortex.users u on u.id = rs.user_id
    join vortex.room_players rp on rp.user_id = rs.user_id and rp.room_id = v_room.id
    where rs.round_id = v_round.id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', u.id,
    'display_name', u.display_name,
    'seat', rp.seat,
    'submitted', case when v_room.current_round = 0 then false else exists (
      select 1
      from vortex.round_submissions rs
      join vortex.game_rounds gr on gr.id = rs.round_id
      where gr.room_id = v_room.id
        and gr.round_number = v_room.current_round
        and rs.user_id = u.id
    ) end
  ) order by rp.seat), '[]'::jsonb)
  into v_players
  from vortex.room_players rp
  join vortex.users u on u.id = rp.user_id
  where rp.room_id = v_room.id;

  return jsonb_build_object(
    'room', jsonb_build_object(
      'code', v_room.code,
      'mode', v_room.mode,
      'status', v_room.status,
      'current_round', v_room.current_round,
      'total_rounds', v_room.total_rounds,
      'max_players', v_room.max_players
    ),
    'me', jsonb_build_object(
      'id', p_user_id,
      'display_name', v_display_name,
      'is_host', v_room.host_user_id = p_user_id,
      'seat', v_seat
    ),
    'players', v_players,
    'round', v_round_json,
    'submissions', v_submissions
  );
end;
$$;

create or replace function public.vortex_get_submission_audio(
  p_code text,
  p_submission_id uuid,
  p_user_id uuid
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_room_id uuid;
  v_audio vortex.round_submissions%rowtype;
begin
  select room.id, rs into v_room_id, v_audio
  from vortex.round_submissions rs
  join vortex.game_rounds gr on gr.id = rs.round_id
  join vortex.game_rooms room on room.id = gr.room_id
  where room.code = upper(p_code) and rs.id = p_submission_id;

  if not found then
    raise exception using errcode = 'P0001', message = 'audio_not_found';
  end if;
  if not exists (select 1 from vortex.room_players where room_id = v_room_id and user_id = p_user_id) then
    raise exception using errcode = 'P0001', message = 'not_in_room';
  end if;

  return jsonb_build_object(
    'audio_object_key', v_audio.audio_object_key,
    'content_type', v_audio.content_type,
    'size_bytes', v_audio.size_bytes
  );
end;
$$;

revoke all on function public.vortex_upsert_user(text, text, text) from public, anon, authenticated;
revoke all on function public.vortex_create_room(uuid, text) from public, anon, authenticated;
revoke all on function public.vortex_join_room(text, uuid) from public, anon, authenticated;
revoke all on function public.vortex_start_game(text, uuid, text[]) from public, anon, authenticated;
revoke all on function public.vortex_advance_round(text, uuid) from public, anon, authenticated;
revoke all on function public.vortex_submit_round(text, uuid, uuid, text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.vortex_get_room_state(text, uuid) from public, anon, authenticated;
revoke all on function public.vortex_get_submission_audio(text, uuid, uuid) from public, anon, authenticated;

grant execute on function public.vortex_upsert_user(text, text, text) to service_role;
grant execute on function public.vortex_create_room(uuid, text) to service_role;
grant execute on function public.vortex_join_room(text, uuid) to service_role;
grant execute on function public.vortex_start_game(text, uuid, text[]) to service_role;
grant execute on function public.vortex_advance_round(text, uuid) to service_role;
grant execute on function public.vortex_submit_round(text, uuid, uuid, text, text, integer, integer) to service_role;
grant execute on function public.vortex_get_room_state(text, uuid) to service_role;
grant execute on function public.vortex_get_submission_audio(text, uuid, uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'vortex-round-audio',
  'vortex-round-audio',
  false,
  12582912,
  array['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;
