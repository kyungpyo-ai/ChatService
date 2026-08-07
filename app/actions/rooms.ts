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

    const passwordHash = isPrivate ? await bcrypt.hash(validatedFields.data.password!, 10) : null;

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
      return { success: false, message: "방 생성에 실패했습니다." };
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
 * 폼이 아닌 클릭 핸들러에서 직접 호출되므로 redirect()는 쓰지 않고, 성공 여부만 반환해
 * 클라이언트에서 라우팅을 처리하게 한다.
 */
export async function leaveRoomAction(roomId: string): Promise<ActionResult> {
  try {
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
  } catch {
    return { success: false, message: "방 나가기 중 오류가 발생했습니다." };
  }
}
