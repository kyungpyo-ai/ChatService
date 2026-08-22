/**
 * 방채팅 관련 Server Actions
 *
 * 방 생성, 방 입장을 처리합니다.
 */

"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createRoomSchema } from "@/lib/schemas/room";
import type { ActionResult } from "@/lib/types/forms";

/**
 * 방 생성 액션
 *
 * 로그인 회원만 방을 만들 수 있다(ROOM-02, 게스트/익명 계정 제외).
 * 비공개방이면 비밀번호를 bcrypt로 해시해 저장한다 — 원문은 저장하지 않는다(§5.1).
 * 방장을 room_members에 등록하는 것은 DB 트리거(handle_new_room)가 자동으로 처리한다.
 */
export async function createRoomAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  let newRoomId: string;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return { success: false, message: "게스트는 방을 만들 수 없습니다. 로그인해주세요." };
    }

    const isPrivate = formData.get("isPrivate") === "true";

    const validatedFields = createRoomSchema.safeParse({
      title: formData.get("title"),
      maxMembers: formData.get("maxMembers"),
      isPrivate,
      password: formData.get("password") || undefined,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // bcryptjs가 생성하는 "$2b$" 버전 태그를 Supabase pgcrypto의 crypt()가 인식하지 못해
    // (self-consistency는 되지만 다른 구현체가 만든 $2b$ 해시는 항상 불일치로 판정) 비밀번호가
    // 맞아도 join_room()에서 항상 invalid_password가 나는 문제가 있었다. "$2a$"로 태그만
    // 바꿔도 해시 내용(알고리즘 결과)은 동일해 검증이 정상 동작한다(실사용 재현으로 확인).
    const passwordHash = isPrivate
      ? (await bcrypt.hash(validatedFields.data.password!, 10)).replace(/^\$2[a-z]\$/, "$2a$")
      : null;

    const { data: room, error: insertError } = await supabase
      .from("rooms")
      .insert({
        title: validatedFields.data.title,
        owner_id: user.id,
        max_members: Number(validatedFields.data.maxMembers),
        is_private: isPrivate,
        password_hash: passwordHash,
      })
      .select("id")
      .single();

    if (insertError || !room) {
      const message = insertError?.message.includes("max_rooms_exceeded")
        ? "방은 1인당 최대 3개까지 만들 수 있습니다."
        : "방 생성에 실패했습니다.";
      return { success: false, message };
    }

    revalidatePath("/rooms");
    newRoomId = room.id;
  } catch {
    return { success: false, message: "방 생성 중 오류가 발생했습니다." };
  }

  redirect(`/rooms/${newRoomId}`);
}

/**
 * 방 입장 액션
 *
 * join_room() DB 함수(SECURITY DEFINER)가 로그인 여부(authenticated 역할)·정원·강퇴 이력·
 * 비밀번호를 전부 재검증한다(ROOM-02, ROOM-04, ROOM-07).
 */
export async function joinRoomAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  const roomId = formData.get("roomId") as string;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const password = (formData.get("password") as string) || undefined;

    const { error: rpcError } = await supabase.rpc("join_room", {
      p_room_id: roomId,
      p_password: password,
    });

    if (rpcError) {
      const message = rpcError.message.includes("guest_cannot_join_room")
        ? "게스트는 방에 입장할 수 없습니다. 로그인해주세요."
        : rpcError.message.includes("banned_from_room")
          ? "강퇴된 방에는 다시 입장할 수 없습니다."
          : rpcError.message.includes("invalid_password")
            ? "비밀번호가 올바르지 않습니다."
            : rpcError.message.includes("room_full")
              ? "정원이 가득 찼습니다."
              : "방 입장에 실패했습니다.";

      return { success: false, message };
    }

    revalidatePath(`/rooms/${roomId}`);
  } catch {
    return { success: false, message: "방 입장 중 오류가 발생했습니다." };
  }

  redirect(`/rooms/${roomId}`);
}

/**
 * 방 나가기 액션
 *
 * leave_room() DB 함수(SECURITY DEFINER)가 처리한다. 방장이 나가면 방 자체가 삭제되고,
 * 일반 참여자면 room_members 행만 삭제된다(§ROADMAP Phase 4).
 *
 * 여기서 redirect()를 호출하지 않는다 — 호출부(components/rooms/room-chat-view.tsx의
 * handleLeave)가 이 액션의 응답을 기다리지 않고 곧바로 클라이언트에서 router.push("/rooms")로
 * 이동시킨다. 예전에는 이 액션이 성공 시 redirect()로 이동을 전담했었는데(재입장 버그
 * 방지), 클라이언트가 이미 즉시 이동하는 지금 구조에서는 그 redirect()가 RPC 왕복이 끝난
 * 뒤(수백ms~1초 뒤) 뒤늦게 또 한 번 /rooms으로 내비게이션을 일으켜, 방을 나간 직후 방
 * 목록에 "다시 들어가지는" 것처럼 화면이 한 번 더 깜빡이는 원인이 됐다(§실사용 확인,
 * 2026-08-15). 클라이언트가 이미 이 방 화면을 벗어난 뒤이므로 재입장 버그(§app/(main)/
 * rooms/[roomId]/page.tsx의 공개방 즉시입장 로직 재실행)가 재현되지 않는 것은 그대로
 * 유지된다 — 그 버그는 "같은 페이지에 머무른 채 액션을 기다리는" 경우에만 발생했다.
 */
export async function leaveRoomAction(roomId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "로그인이 필요합니다." };
  }

  const { error: rpcError } = await supabase.rpc("leave_room", { p_room_id: roomId });

  if (rpcError) {
    return { success: false, message: "방 나가기에 실패했습니다." };
  }

  revalidatePath("/rooms");
  return { success: true, message: "" };
}

/**
 * 방장 강퇴 액션 (§ROADMAP Phase 7, ROOM-06)
 *
 * kick_member() DB 함수(SECURITY DEFINER)가 호출자가 실제로 해당 방의 방장인지
 * 재검증한다 — 일반 참여자가 이 액션을 호출해도 함수 내부에서 거부된다. 강퇴 시
 * room_members DELETE + room_bans INSERT까지 함수가 한 번에 처리하므로(§DB_SCHEMA 8),
 * 재입장 차단은 join_room()이 이미 room_bans를 확인해 별도 구현이 필요 없다.
 * 강퇴당한 사용자에게는 이미 있는 room_members DELETE Realtime 이벤트가 그대로 전달된다.
 */
export async function kickMemberAction(
  roomId: string,
  targetUserId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    const { data, error: authError } = await supabase.auth.getClaims();
    const userId = data?.claims?.sub;

    if (authError || !userId) {
      return { success: false, message: "로그인이 필요합니다." };
    }

    const { error: rpcError } = await supabase.rpc("kick_member", {
      p_room_id: roomId,
      p_target_user_id: targetUserId,
    });

    if (rpcError) {
      return { success: false, message: "강퇴에 실패했습니다. 방장만 강퇴할 수 있습니다." };
    }

    revalidatePath(`/rooms/${roomId}`);
    return { success: true, message: "" };
  } catch {
    return { success: false, message: "강퇴 중 오류가 발생했습니다." };
  }
}
