/**
 * 프로필 폼 검증 스키마
 *
 * 프로필 설정 및 수정 시 사용하는 Zod 검증 스키마를 정의합니다.
 */

import { z } from "zod";
import { containsBannedWord } from "@/lib/utils/content-filter";

/**
 * 성별 스키마 — 남성/여성 중 필수 선택
 */
const genderSchema = z.enum(["male", "female"], {
  message: "성별을 선택해주세요",
});

/**
 * 나이 스키마 — 숫자로 변환하지 않고 검증된 문자열로 유지한다.
 * (z.coerce/transform은 react-hook-form과 제네릭 충돌을 일으켜, DB 저장 직전
 * 서버 액션에서만 Number()로 변환한다. username과 동일한 방식이다.)
 */
const ageSchema = z
  .string()
  .min(1, "나이를 입력해주세요")
  .regex(/^\d+$/, "숫자로 입력해주세요")
  .refine((value) => {
    const numeric = Number(value);
    return numeric >= 14 && numeric <= 120;
  }, "만 14세~120세 사이로 입력해주세요");

/**
 * 회원가입 후 닉네임 설정 스키마
 *
 * OAuth 로그인 후 최초 프로필 설정 시 사용합니다.
 * 닉네임, 성별, 나이는 모두 필수이며 미입력 시 다음 단계로 진행할 수 없습니다.
 */
export const setupProfileSchema = z.object({
  username: z
    .string()
    .min(3, "닉네임은 최소 3자 이상이어야 합니다")
    .max(6, "닉네임은 최대 6자까지 가능합니다")
    .regex(/^[a-zA-Z0-9가-힣_]+$/, "닉네임은 영문, 숫자, 한글, _만 사용 가능합니다")
    .refine((v) => !containsBannedWord(v), "닉네임에 부적절한 표현이 포함되어 있습니다"),
  gender: genderSchema,
  age: ageSchema,
  termsAgreed: z.literal(true, { message: "약관에 동의해야 가입할 수 있습니다" }),
});

/**
 * 프로필 수정 스키마
 *
 * 프로필 정보 수정 시 사용합니다.
 * 닉네임, 나이, 성별을 포함해 모두 수정할 수 있습니다.
 */
export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "닉네임은 최소 3자 이상이어야 합니다")
    .max(6, "닉네임은 최대 6자까지 가능합니다")
    .regex(/^[a-zA-Z0-9가-힣_]+$/, "닉네임은 영문, 숫자, 한글, _만 사용 가능합니다")
    .refine((v) => !containsBannedWord(v), "닉네임에 부적절한 표현이 포함되어 있습니다")
    .optional(),
  full_name: z.string().optional(),
  avatar_url: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
  website: z.string().url("올바른 URL을 입력하세요").optional().or(z.literal("")),
  gender: genderSchema,
  age: ageSchema,
});

/**
 * 닉네임 설정 입력 타입
 */
export type SetupProfileInput = z.infer<typeof setupProfileSchema>;

/**
 * 프로필 수정 입력 타입
 */
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
