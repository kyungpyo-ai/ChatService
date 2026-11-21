/**
 * 관리자 이미지 모아보기 조회 (app/admin/images)
 *
 * admin_list_chat_images RPC가 is_admin()을 확인한 뒤 진행 중/종료된 대화의 이미지 메시지를
 * 최신순으로 반환한다. 비관리자가 호출하면 RPC가 예외를 던져 빈 배열이 되므로, 서비스 롤
 * 클라이언트로 서명 URL을 발급하는 단계까지 절대 도달하지 않는다 — 서명 대상 경로도 RPC가
 * 돌려준 값만 쓰고, parseChatImagePath()로 형식을 한 번 더 검증한다.
 *
 * 종료된 대화의 이미지는 Storage RLS(현재 참여자만 SELECT)로는 조회할 수 없어 서비스 롤
 * 클라이언트로 서명한다(/api/admin/chat-image-url과 동일한 이유). 다만 이 화면은 한 번에 수십
 * 장을 띄우므로 이미지마다 API를 부르지 않고 createSignedUrls로 한 번에 발급한다.
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  CHAT_IMAGES_BUCKET,
  CHAT_IMAGE_SIGNED_URL_TTL_SECONDS,
  parseChatImagePath,
} from "@/lib/storage/chat-images";

export type AdminChatImageScope =
  | "all"
  | "active_rooms"
  | "active_random"
  | "archived_rooms"
  | "archived_random";

export type AdminChatImageSource = "room" | "random_session" | "room_archive" | "random_archive";

export interface AdminChatImageItem {
  source: AdminChatImageSource;
  contextId: string;
  contextTitle: string | null;
  senderId: string | null;
  senderName: string | null;
  path: string;
  createdAt: string;
  /** 서명 URL 발급 실패(파일이 이미 정리됨 등) 시 null */
  url: string | null;
}

interface AdminChatImageRow {
  source: string;
  context_id: string;
  context_title: string | null;
  sender_id: string | null;
  sender_name: string | null;
  path: string;
  created_at: string;
}

export async function getAdminChatImages(params: {
  dateFrom: string;
  dateTo: string;
  scope: AdminChatImageScope;
  limit: number;
  offset: number;
}): Promise<AdminChatImageItem[]> {
  const supabase = await createClient();
  const { data, error } = (await supabase.rpc("admin_list_chat_images", {
    p_date_from: params.dateFrom,
    p_date_to: params.dateTo,
    p_scope: params.scope,
    p_limit: params.limit,
    p_offset: params.offset,
  })) as { data: AdminChatImageRow[] | null; error: unknown };

  if (error || !data || data.length === 0) return [];

  const validPaths = data.map((row) => row.path).filter((path) => parseChatImagePath(path));

  const urlByPath = new Map<string, string>();
  if (validPaths.length > 0) {
    // 서비스 롤 키가 없는 환경(현재 Vercel Preview는 Production에만 키가 등록돼 있음)에서도
    // 화면 전체가 에러로 죽지 않도록, 서명 실패는 썸네일만 "파일 없음"으로 처리한다.
    try {
      const adminClient = createAdminClient();
      const { data: signed } = await adminClient.storage
        .from(CHAT_IMAGES_BUCKET)
        .createSignedUrls(validPaths, CHAT_IMAGE_SIGNED_URL_TTL_SECONDS);

      for (const item of signed ?? []) {
        if (!item.error && item.signedUrl && item.path) {
          urlByPath.set(item.path, item.signedUrl);
        }
      }
    } catch (error) {
      console.error("[admin-images] 서명 URL 발급 실패", error);
    }
  }

  return data.map((row) => ({
    source: row.source as AdminChatImageSource,
    contextId: row.context_id,
    contextTitle: row.context_title,
    senderId: row.sender_id,
    senderName: row.sender_name,
    path: row.path,
    createdAt: row.created_at,
    url: urlByPath.get(row.path) ?? null,
  }));
}
