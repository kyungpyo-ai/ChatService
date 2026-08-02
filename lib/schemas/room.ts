/**
 * 방 생성/입장 폼 검증 스키마
 */

import { z } from "zod";

/**
 * 방 생성 스키마
 *
 * maxMembers는 select 값(문자열)을 그대로 받아 검증한 뒤, 서버 액션에서만 숫자로 변환한다.
 * (lib/schemas/profile.ts의 age와 동일한 이유 — z.coerce는 react-hook-form 제네릭과 충돌한다.)
 */
export const createRoomSchema = z
  .object({
    title: z
      .string()
      .min(1, "방 제목을 입력해주세요")
      .max(50, "방 제목은 최대 50자까지 가능합니다"),
    maxMembers: z.enum(["5", "10", "20", "50"], {
      message: "최대 인원을 선택해주세요",
    }),
    isPrivate: z.boolean(),
    password: z.string().optional(),
  })
  .superRefine(({ isPrivate, password }, ctx) => {
    if (!isPrivate) return;
    if (!password || password.length < 4 || password.length > 20) {
      ctx.addIssue({
        code: "custom",
        path: ["password"],
        message: "비공개방 비밀번호는 4~20자로 입력해주세요",
      });
    }
  });

export type CreateRoomInput = z.infer<typeof createRoomSchema>;

/**
 * 방 입장 스키마 — 비공개방일 때만 비밀번호가 필요하며, 화면 단에서 조건부로 사용한다.
 */
export const joinRoomSchema = z.object({
  roomId: z.string().uuid(),
  password: z.string().optional(),
});

export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
