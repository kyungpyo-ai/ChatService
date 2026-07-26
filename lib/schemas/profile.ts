/**
 * 프로필 폼 검증 스키마
 *
 * 프로필 설정 및 수정 시 사용하는 Zod 검증 스키마를 정의합니다.
 */

import { z } from "zod";

/**
 * 회원가입 후 닉네임 설정 스키마
 *
 * OAuth 로그인 후 최초 프로필 설정 시 사용합니다.
 */
export const setupProfileSchema = z.object({
  username: z
    .string()
    .min(3, "닉네임은 최소 3자 이상이어야 합니다")
    .max(20, "닉네임은 최대 20자까지 가능합니다")
    .regex(/^[a-zA-Z0-9가-힣_]+$/, "닉네임은 영문, 숫자, 한글, _만 사용 가능합니다"),
});

/**
 * 프로필 수정 스키마
 *
 * 프로필 정보 수정 시 사용합니다.
 * 모든 필드는 선택적이며, 제공된 필드만 업데이트됩니다.
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "닉네임은 최소 3자 이상이어야 합니다")
    .max(20, "닉네임은 최대 20자까지 가능합니다")
    .regex(/^[a-zA-Z0-9가-힣_]+$/, "닉네임은 영문, 숫자, 한글, _만 사용 가능합니다")
    .optional(),
  full_name: z.string().optional(),
  avatar_url: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
  website: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
});

/**
 * 닉네임 설정 입력 타입
 */
export type SetupProfileInput = z.infer<typeof setupProfileSchema>;

/**
 * 프로필 수정 입력 타입
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
