/**
 * 프로필 관련 Server Actions
 *
 * 프로필 설정, 수정, 닉네임 중복 확인 등을 처리합니다.
 */

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  setupProfileSchema,
  updateProfileSchema,
  type UpdateProfileInput,
} from "@/lib/schemas/profile";
import { checkUsernameAvailability } from "@/lib/queries/profile";
import type { ActionResult } from "@/lib/types/forms";

/**
 * OAuth 로그인 후 닉네임 설정 액션
 *
 * 회원가입 후 최초 프로필 설정 시 사용합니다.
 * 닉네임 중복 확인 후 profiles 테이블을 업데이트합니다.
 *
 * @param _prevState - 이전 상태 (React Hook Form용)
 * @param formData - 폼 데이터 (username, full_name)
 * @returns ActionResult - 성공/실패 결과
 *
 * @example
 * ```typescript
 * const [state, formAction] = useActionState(setupProfileAction, initialState);
 * <form action={formAction}>
 *   <input name="username" />
 *   <input name="full_name" />
 * </form>
 * ```
 */
export async function setupProfileAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // 1. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 2. 입력 데이터 검증
    const validatedFields = setupProfileSchema.safeParse({
      username: formData.get("username"),
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // 3. 닉네임 중복 확인
    const isAvailable = await checkUsernameAvailability(validatedFields.data.username, user.id);

    if (!isAvailable) {
      return {
        success: false,
        message: "이미 사용 중인 닉네임입니다.",
        errors: {
          username: ["이미 사용 중인 닉네임입니다."],
        },
      };
    }

    // 4. DB 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        username: validatedFields.data.username,
      })
      .eq("id", user.id);

    if (updateError) {
      return {
        success: false,
        message: "프로필 설정에 실패했습니다.",
      };
    }

    // 5. 캐시 무효화
    revalidatePath("/profile");

    return {
      success: true,
      message: "프로필이 설정되었습니다.",
    };
  } catch {
    return {
      success: false,
      message: "프로필 설정 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 프로필 수정 액션
 *
 * 사용자가 프로필 정보를 수정할 때 사용합니다.
 * 닉네임, 이름, 아바타, 웹사이트를 업데이트할 수 있습니다.
 *
 * @param _prevState - 이전 상태 (React Hook Form용)
 * @param formData - 폼 데이터 (username?, full_name?, avatar_url?, website?)
 * @returns ActionResult - 성공/실패 결과
 *
 * @example
 * ```typescript
 * const [state, formAction] = useActionState(updateProfileAction, initialState);
 * <form action={formAction}>
 *   <input name="username" />
 *   <input name="full_name" />
 *   <input name="avatar_url" />
 *   <input name="website" />
 * </form>
 * ```
 */
export async function updateProfileAction(
  _prevState: ActionResult,
  formData: FormData
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    // 1. 인증 확인
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        message: "로그인이 필요합니다.",
      };
    }

    // 2. 입력 데이터 검증
    const validatedFields = updateProfileSchema.safeParse({
      username: formData.get("username") || undefined,
      full_name: formData.get("full_name") || undefined,
      avatar_url: formData.get("avatar_url") || undefined,
      website: formData.get("website") || undefined,
    });

    if (!validatedFields.success) {
      return {
        success: false,
        message: "입력된 정보를 확인해주세요.",
        errors: validatedFields.error.flatten().fieldErrors,
      };
    }

    // 3. 닉네임 변경 시 중복 확인
    if (validatedFields.data.username && validatedFields.data.username.trim() !== "") {
      const isAvailable = await checkUsernameAvailability(validatedFields.data.username, user.id);

      if (!isAvailable) {
        return {
          success: false,
          message: "이미 사용 중인 닉네임입니다.",
          errors: {
            username: ["이미 사용 중인 닉네임입니다."],
          },
        };
      }
    }

    // 4. 업데이트할 필드만 추출 (undefined 제외)
    const updateData: Partial<UpdateProfileInput> = {};
    if (validatedFields.data.username) updateData.username = validatedFields.data.username;
    if (validatedFields.data.full_name !== undefined)
      updateData.full_name = validatedFields.data.full_name;
    if (validatedFields.data.avatar_url !== undefined)
      updateData.avatar_url = validatedFields.data.avatar_url;
    if (validatedFields.data.website !== undefined)
      updateData.website = validatedFields.data.website;

    // 빈 객체인 경우 (변경 사항 없음)
    if (Object.keys(updateData).length === 0) {
      return {
        success: false,
        message: "변경된 정보가 없습니다.",
      };
    }

    // 5. DB 업데이트
    const { error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    if (updateError) {
      return {
        success: false,
        message: "프로필 수정에 실패했습니다.",
      };
    }

    // 6. 캐시 무효화 (프로필 페이지 및 이벤트 페이지)
    revalidatePath("/profile");
    revalidatePath("/events");

    return {
      success: true,
      message: "프로필이 수정되었습니다.",
    };
  } catch {
    return {
      success: false,
      message: "프로필 수정 중 오류가 발생했습니다.",
    };
  }
}

/**
 * 닉네임 사용 가능 여부 확인 액션
 *
 * 클라이언트에서 실시간으로 닉네임 중복을 확인할 때 사용합니다.
 * 300ms 디바운스와 함께 사용하는 것을 권장합니다.
 *
 * @param username - 확인할 닉네임
 * @returns 사용 가능 여부 객체
 *
 * @example
 * ```typescript
 * const checkUsername = debounce(async (username: string) => {
 *   const result = await checkUsernameAction(username);
 *   console.log(result.available); // true or false
 * }, 300);
 * ```
 */
export async function checkUsernameAction(username: string): Promise<{ available: boolean }> {
  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 확인 (본인 닉네임은 제외하기 위함)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isAvailable = await checkUsernameAvailability(username, user?.id);

    return { available: isAvailable };
  } catch {
    return { available: false };
  }
}
