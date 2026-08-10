/**
 * 관리자 전용 조회 함수 모음 (Phase 7.5)
 *
 * 전부 is_admin() SECURITY DEFINER 함수(§DEVELOPMENT_PLAN 7.5.1)가 지켜주는 RPC 위에서
 * 동작하므로 여기서는 별도 권한 재검증을 하지 않는다 — 비관리자가 이 함수들을 호출하면
 * RPC 자체가 `not_authorized` 예외로 거부한다. 화면 레벨(app/admin/layout.tsx)의 404는
 * 진입 자체를 막을 뿐이고, 여기 있는 함수는 서버 측 최종 방어선이 아니라 "관리자로
 * 확인된 이후"의 얇은 데이터 계층이다.
 */

import { createClient } from "@/lib/supabase/server";

/**
 * supabase-js의 .rpc() 제네릭 추론이 이 프로젝트의 postgrest-js 버전 조합에서 "returns
 * table(...)" 형태(배열 반환) 함수의 Row 타입을 제대로 좁히지 못해 `{}`로 추론되는 문제가
 * 있다(기존 lib/realtime 계열 코드도 `heartbeat_random_session` 호출에서 동일하게 `as`로
 * 우회하고 있음, app/actions/random.ts 참고). 매번 인라인 캐스팅을 반복하지 않도록 공용
 * 헬퍼로 한 번만 감싼다.
 */
function asRpcResult<T>(result: { data: unknown; error: unknown }): {
  data: T | null;
  error: unknown;
} {
  return result as { data: T | null; error: unknown };
}

export interface DashboardStats {
  // 기본 정보
  totalUsers: number;
  dau: number;
  guestCount: number;
  onlineCount: number;
  pendingReports: number;
  // 오늘의 활동 — 회원
  newUsersToday: number;
  deletedUsersToday: number;
  // 방채팅
  roomsCreatedToday: number;
  roomsDeletedToday: number;
  activeRooms: number;
  roomActiveUsers: number;
  // 랜덤채팅
  randomActiveParticipants: number;
  randomQueueWaitingCount: number;
  randomSessionsMatchedToday: number;
}

interface DashboardStatsRow {
  total_users: number;
  dau: number;
  guest_count: number;
  online_count: number;
  pending_reports: number;
  new_users_today: number;
  deleted_users_today: number;
  rooms_created_today: number;
  rooms_deleted_today: number;
  active_rooms: number;
  room_active_users: number;
  random_active_participants: number;
  random_queue_waiting_count: number;
  random_sessions_matched_today: number;
}

export async function getDashboardStats(): Promise<DashboardStats | null> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<DashboardStatsRow>(
    await supabase.rpc("admin_get_dashboard_stats").maybeSingle()
  );

  if (error || !data) return null;

  return {
    totalUsers: data.total_users,
    dau: data.dau,
    guestCount: data.guest_count,
    onlineCount: data.online_count,
    pendingReports: data.pending_reports,
    newUsersToday: data.new_users_today,
    deletedUsersToday: data.deleted_users_today,
    roomsCreatedToday: data.rooms_created_today,
    roomsDeletedToday: data.rooms_deleted_today,
    activeRooms: data.active_rooms,
    roomActiveUsers: data.room_active_users,
    randomActiveParticipants: data.random_active_participants,
    randomQueueWaitingCount: data.random_queue_waiting_count,
    randomSessionsMatchedToday: data.random_sessions_matched_today,
  };
}

export interface AdminRoomListItem {
  id: string;
  title: string;
  ownerId: string | null;
  ownerNickname: string | null;
  memberCount: number;
  maxMembers: number;
  isPrivate: boolean;
  createdAt: string;
}

interface AdminRoomListRow {
  id: string;
  title: string;
  owner_id: string | null;
  owner_nickname: string | null;
  member_count: number;
  max_members: number;
  is_private: boolean;
  created_at: string;
}

export async function getActiveRoomList(query?: string): Promise<AdminRoomListItem[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminRoomListRow[]>(
    await supabase.rpc("admin_search_rooms", { p_query: query ?? null })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    title: row.title,
    ownerId: row.owner_id,
    ownerNickname: row.owner_nickname,
    memberCount: row.member_count,
    maxMembers: row.max_members,
    isPrivate: row.is_private,
    createdAt: row.created_at,
  }));
}

export interface AdminRoomArchiveListItem {
  id: string;
  originalRoomId: string;
  title: string;
  ownerId: string | null;
  memberCount: number;
  isPrivate: boolean;
  archivedAt: string;
}

interface AdminRoomArchiveListRow {
  id: string;
  original_room_id: string;
  title: string;
  owner_id: string | null;
  member_count: number;
  is_private: boolean;
  archived_at: string;
}

export async function getRoomArchiveList(query?: string): Promise<AdminRoomArchiveListItem[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminRoomArchiveListRow[]>(
    await supabase.rpc("admin_get_room_archive_list", {
      p_query: query ?? null,
    })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    originalRoomId: row.original_room_id,
    title: row.title,
    ownerId: row.owner_id,
    memberCount: row.member_count,
    isPrivate: row.is_private,
    archivedAt: row.archived_at,
  }));
}

export interface AdminMessageTimelineItem {
  id: string;
  senderId: string | null;
  contentType: "text" | "image";
  content: string;
  createdAt: string;
}

interface AdminMessageTimelineRow {
  id: string;
  sender_id: string | null;
  content_type: string;
  content: string;
  created_at: string;
}

export async function getRoomMessageTimeline(roomId: string): Promise<AdminMessageTimelineItem[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminMessageTimelineRow[]>(
    await supabase.rpc("admin_get_room_messages", { p_room_id: roomId })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    contentType: row.content_type as "text" | "image",
    content: row.content,
    createdAt: row.created_at,
  }));
}

export interface AdminRoomArchiveDetail {
  id: string;
  originalRoomId: string;
  title: string;
  ownerId: string | null;
  maxMembers: number;
  isPrivate: boolean;
  memberIds: string[];
  createdAt: string;
  archivedAt: string;
  messages: AdminMessageTimelineItem[];
}

interface ArchivedMessageRow {
  id?: string;
  sender_id: string | null;
  content_type: "text" | "image";
  content: string;
  created_at: string;
}

interface AdminRoomArchiveDetailRow {
  id: string;
  original_room_id: string;
  title: string;
  owner_id: string | null;
  max_members: number;
  is_private: boolean;
  member_ids: string[] | null;
  created_at: string;
  messages: unknown;
  archived_at: string;
}

export async function getRoomArchiveDetail(
  archiveId: string
): Promise<AdminRoomArchiveDetail | null> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminRoomArchiveDetailRow>(
    await supabase.rpc("admin_get_room_archive_detail", { p_archive_id: archiveId }).maybeSingle()
  );

  if (error || !data) return null;

  const rawMessages = (data.messages as unknown as ArchivedMessageRow[] | null) ?? [];

  return {
    id: data.id,
    originalRoomId: data.original_room_id,
    title: data.title,
    ownerId: data.owner_id,
    maxMembers: data.max_members,
    isPrivate: data.is_private,
    memberIds: data.member_ids ?? [],
    createdAt: data.created_at,
    archivedAt: data.archived_at,
    messages: rawMessages.map((m, index) => ({
      id: m.id ?? `${archiveId}-${index}`,
      senderId: m.sender_id,
      contentType: m.content_type,
      content: m.content,
      createdAt: m.created_at,
    })),
  };
}

export interface AdminRoomMember {
  userId: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: string;
  joinedAt: string;
}

/**
 * 관리자가 참여하지 않은 방도 참여자 목록을 볼 수 있도록 admin_get_room_members() RPC를
 * 통한다 — room_members SELECT RLS는 "같은 방 참여자만" 허용하므로 일반 조회로는 불가능하다
 * (구현 중 발견, §migration 20260810090000).
 */
interface AdminRoomMemberRow {
  user_id: string;
  nickname: string | null;
  avatar_url: string | null;
  role: string;
  joined_at: string;
}

export async function getRoomMembersForAdmin(roomId: string): Promise<AdminRoomMember[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminRoomMemberRow[]>(
    await supabase.rpc("admin_get_room_members", { p_room_id: roomId })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    userId: row.user_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    role: row.role,
    joinedAt: row.joined_at,
  }));
}

export interface AdminRandomSessionListItem {
  id: string;
  userAId: string;
  userBId: string;
  startedAt: string;
  status: string;
}

interface AdminRandomSessionListRow {
  id: string;
  user_a_id: string;
  user_b_id: string;
  started_at: string;
  status: string;
}

export async function getActiveRandomSessionList(
  query?: string
): Promise<AdminRandomSessionListItem[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminRandomSessionListRow[]>(
    await supabase.rpc("admin_search_random_sessions", {
      p_query: query ?? null,
    })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    startedAt: row.started_at,
    status: row.status,
  }));
}

export async function getRandomSessionTimeline(
  sessionId: string
): Promise<AdminMessageTimelineItem[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminMessageTimelineRow[]>(
    await supabase.rpc("admin_get_random_session_messages", {
      p_session_id: sessionId,
    })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    senderId: row.sender_id,
    contentType: row.content_type as "text" | "image",
    content: row.content,
    createdAt: row.created_at,
  }));
}

export interface AdminRandomArchiveListItem {
  id: string;
  originalSessionId: string;
  userAId: string;
  userBId: string;
  startedAt: string;
  endedAt: string;
  archivedAt: string;
}

interface AdminRandomArchiveListRow {
  id: string;
  original_session_id: string;
  user_a_id: string;
  user_b_id: string;
  started_at: string;
  ended_at: string;
  archived_at: string;
}

export async function getRandomArchiveList(
  query?: string,
  dateFrom?: string,
  dateTo?: string
): Promise<AdminRandomArchiveListItem[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminRandomArchiveListRow[]>(
    await supabase.rpc("admin_get_random_archive_list", {
      p_query: query ?? null,
      p_date_from: dateFrom ?? null,
      p_date_to: dateTo ?? null,
    })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    originalSessionId: row.original_session_id,
    userAId: row.user_a_id,
    userBId: row.user_b_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    archivedAt: row.archived_at,
  }));
}

export interface AdminRandomArchiveDetail {
  id: string;
  originalSessionId: string;
  userAId: string;
  userBId: string;
  startedAt: string;
  endedAt: string;
  endedBy: string | null;
  archivedAt: string;
  messages: AdminMessageTimelineItem[];
}

interface AdminRandomArchiveDetailRow {
  id: string;
  original_session_id: string;
  user_a_id: string;
  user_b_id: string;
  started_at: string;
  ended_at: string;
  ended_by: string | null;
  messages: unknown;
  archived_at: string;
}

export async function getRandomArchiveDetail(
  archiveId: string
): Promise<AdminRandomArchiveDetail | null> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminRandomArchiveDetailRow>(
    await supabase.rpc("admin_get_random_archive_detail", { p_archive_id: archiveId }).maybeSingle()
  );

  if (error || !data) return null;

  const rawMessages = (data.messages as unknown as ArchivedMessageRow[] | null) ?? [];

  return {
    id: data.id,
    originalSessionId: data.original_session_id,
    userAId: data.user_a_id,
    userBId: data.user_b_id,
    startedAt: data.started_at,
    endedAt: data.ended_at,
    endedBy: data.ended_by,
    archivedAt: data.archived_at,
    messages: rawMessages.map((m, index) => ({
      id: m.id ?? `${archiveId}-${index}`,
      senderId: m.sender_id,
      contentType: m.content_type,
      content: m.content,
      createdAt: m.created_at,
    })),
  };
}

export interface AdminUserListItem {
  id: string;
  username: string | null;
  email: string | null;
  fullName: string | null;
  gender: string | null;
  age: number | null;
  role: string;
  createdAt: string;
  lastSeenAt: string;
  suspendedAt: string | null;
  suspendedUntil: string | null;
  suspendedReason: string | null;
}

interface AdminUserRow {
  id: string;
  username: string | null;
  email: string | null;
  full_name: string | null;
  gender: string | null;
  age: number | null;
  role: string;
  created_at: string;
  last_seen_at: string;
  suspended_at: string | null;
  suspended_until: string | null;
  suspended_reason: string | null;
}

function mapUserRow(row: AdminUserRow): AdminUserListItem {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    fullName: row.full_name,
    gender: row.gender,
    age: row.age,
    role: row.role,
    createdAt: row.created_at,
    lastSeenAt: row.last_seen_at,
    suspendedAt: row.suspended_at,
    suspendedUntil: row.suspended_until,
    suspendedReason: row.suspended_reason,
  };
}

export async function searchAdminUsers(query?: string): Promise<AdminUserListItem[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminUserRow[]>(
    await supabase.rpc("admin_search_users", { p_query: query ?? null })
  );

  if (error || !data) return [];

  return data.map(mapUserRow);
}

export interface AdminUserDetail extends AdminUserListItem {
  roomCount: number;
  reportCount: number;
}

interface AdminUserDetailRow extends AdminUserRow {
  room_count: number;
  report_count: number;
}

export async function getAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminUserDetailRow>(
    await supabase.rpc("admin_get_user_detail", { p_user_id: userId }).maybeSingle()
  );

  if (error || !data) return null;

  return {
    ...mapUserRow(data),
    roomCount: data.room_count,
    reportCount: data.report_count,
  };
}

export interface AdminReportListItem {
  id: string;
  reporterId: string | null;
  targetType: string;
  targetId: string;
  reason: string;
  detail: string | null;
  status: string;
  createdAt: string;
}

/**
 * 신고 큐 조회 — reports 테이블은 is_admin()이 이미 SELECT RLS(§20260810010000)로 열려있어
 * 별도 RPC 없이 일반 테이블 조회로 충분하다(§7.5.4 getReportQueue).
 */
export async function getReportQueue(
  status: "pending" | "resolved" | "dismissed" = "pending"
): Promise<AdminReportListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select("id, reporter_id, target_type, target_id, reason, detail, status, created_at")
    .eq("status", status)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error || !data) return [];

  return data.map((row) => ({
    id: row.id,
    reporterId: row.reporter_id,
    targetType: row.target_type,
    targetId: row.target_id,
    reason: row.reason,
    detail: row.detail,
    status: row.status,
    createdAt: row.created_at,
  }));
}

export interface AdminReportDetail extends AdminReportListItem {
  reviewedBy: string | null;
  reviewedAt: string | null;
  actionTaken: string | null;
}

export async function getReportDetail(id: string): Promise<AdminReportDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("reports")
    .select(
      "id, reporter_id, target_type, target_id, reason, detail, status, created_at, reviewed_by, reviewed_at, action_taken"
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    reporterId: data.reporter_id,
    targetType: data.target_type,
    targetId: data.target_id,
    reason: data.reason,
    detail: data.detail,
    status: data.status,
    createdAt: data.created_at,
    reviewedBy: data.reviewed_by,
    reviewedAt: data.reviewed_at,
    actionTaken: data.action_taken,
  };
}

export interface RateLimitAnomaly {
  userId: string;
  username: string | null;
  action: string;
  eventCount: number;
}

interface RateLimitAnomalyRow {
  user_id: string;
  username: string | null;
  action: string;
  event_count: number;
}

export async function getRateLimitAnomalies(): Promise<RateLimitAnomaly[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<RateLimitAnomalyRow[]>(
    await supabase.rpc("admin_get_rate_limit_anomalies", {})
  );

  if (error || !data) return [];

  return data.map((row) => ({
    userId: row.user_id,
    username: row.username,
    action: row.action,
    eventCount: row.event_count,
  }));
}

export interface CronJobStatus {
  jobId: number;
  jobName: string;
  schedule: string;
  active: boolean;
  lastStatus: string | null;
  lastStartTime: string | null;
  lastEndTime: string | null;
  lastReturnMessage: string | null;
}

interface CronJobStatusRow {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  last_status: string | null;
  last_start_time: string | null;
  last_end_time: string | null;
  last_return_message: string | null;
}

export async function getCronJobStatus(): Promise<CronJobStatus[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<CronJobStatusRow[]>(
    await supabase.rpc("admin_get_cron_job_status")
  );

  if (error || !data) return [];

  return data.map((row) => ({
    jobId: row.jobid,
    jobName: row.jobname,
    schedule: row.schedule,
    active: row.active,
    lastStatus: row.last_status,
    lastStartTime: row.last_start_time,
    lastEndTime: row.last_end_time,
    lastReturnMessage: row.last_return_message,
  }));
}

export interface AdminMessageSearchResult {
  source: "room" | "random_session" | "room_archive" | "random_archive";
  contextId: string;
  senderId: string | null;
  content: string;
  createdAt: string;
}

export type AdminMessageSearchScope =
  | "all"
  | "active_rooms"
  | "active_random"
  | "archived_rooms"
  | "archived_random";

/**
 * 관리자 메시지 내용 검색(§DEVELOPMENT_PLAN 7.5.6) — 날짜 범위는 호출부(화면)가 계산해 전달한다
 * (기본 "최근 7일"은 app/admin/messages/page.tsx에서 계산). DB 함수 자체가 날짜 누락을
 * date_range_required로 거부하므로 여기서는 그대로 전달만 한다.
 */
interface AdminMessageSearchRow {
  source: string;
  context_id: string;
  sender_id: string | null;
  content: string;
  created_at: string;
}

export async function searchAdminMessages(
  query: string,
  dateFrom: string,
  dateTo: string,
  scope: AdminMessageSearchScope = "all"
): Promise<AdminMessageSearchResult[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminMessageSearchRow[]>(
    await supabase.rpc("admin_search_messages", {
      p_query: query,
      p_date_from: dateFrom,
      p_date_to: dateTo,
      p_scope: scope,
    })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    source: row.source as AdminMessageSearchResult["source"],
    contextId: row.context_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  }));
}

export interface AdminDailyStat {
  date: string;
  // 스냅샷이 없는(이 기능 도입 이전) 과거 날짜는 null — "0"과 구분하기 위함
  totalUsers: number | null;
  newUsers: number | null;
  deletedUsers: number | null;
  activeRooms: number | null;
  roomsCreated: number | null;
  roomsDeleted: number | null;
  randomSessionsMatched: number | null;
}

interface AdminDailyStatRow {
  stat_date: string;
  total_users: number | null;
  new_users: number | null;
  deleted_users: number | null;
  active_rooms: number | null;
  rooms_created: number | null;
  rooms_deleted: number | null;
  random_sessions_matched: number | null;
}

/**
 * 대시보드에 보이는 지표 전체를 일자별로 조회한다 — 오늘은 admin_compute_live_stats()로 실시간
 * 계산되고, 과거 날짜는 매일 23:55 cron이 admin_daily_stats에 남긴 스냅샷에서 읽는다
 * (§20260811060000). 날짜 범위는 호출부가 결정한다(기본값/상한은
 * components/admin/daily-stats-panel.tsx 참고).
 */
export async function getDailyStats(dateFrom: string, dateTo: string): Promise<AdminDailyStat[]> {
  const supabase = await createClient();
  const { data, error } = asRpcResult<AdminDailyStatRow[]>(
    await supabase.rpc("admin_get_daily_stats", { p_date_from: dateFrom, p_date_to: dateTo })
  );

  if (error || !data) return [];

  return data.map((row) => ({
    date: row.stat_date,
    totalUsers: row.total_users,
    newUsers: row.new_users,
    deletedUsers: row.deleted_users,
    activeRooms: row.active_rooms,
    roomsCreated: row.rooms_created,
    roomsDeleted: row.rooms_deleted,
    randomSessionsMatched: row.random_sessions_matched,
  }));
}
