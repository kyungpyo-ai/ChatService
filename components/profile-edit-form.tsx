/**
 * 프로필 수정 폼 컴포넌트 (Client Component)
 *
 * 사용자 프로필 정보를 수정하는 폼입니다.
 * 닉네임 중복 확인은 300ms debounce를 적용합니다.
 */

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/schemas/profile";
import { showSuccess, showError } from "@/lib/utils/toast";
import { updateProfileAction, checkUsernameAction } from "@/app/actions/profile";
import type { User } from "@/lib/types/models";
import { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

interface ProfileEditFormProps {
  profile: User;
}

/**
 * 프로필 수정 폼
 *
 * @param profile - 현재 사용자 프로필 정보
 */
export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);

  // React Hook Form 초기화
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: profile.username || undefined,
      full_name: profile.full_name || undefined,
      avatar_url: profile.avatar_url || "",
      website: profile.website || "",
    },
  });

  const watchedUsername = form.watch("username");

  // 닉네임 중복 확인 (300ms debounce)
  const checkUsername = useDebouncedCallback(async (username: string) => {
    if (!username || username === profile.username) {
      setUsernameAvailable(null);
      return;
    }

    const { available } = await checkUsernameAction(username);
    setUsernameAvailable(available);
  }, 300);

  useEffect(() => {
    if (watchedUsername) {
      checkUsername(watchedUsername);
    }
  }, [watchedUsername, checkUsername]);

  // 폼 제출 핸들러
  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();

      if (data.username) {
        formData.append("username", data.username);
      }
      if (data.full_name !== undefined) {
        formData.append("full_name", data.full_name);
      }
      if (data.avatar_url !== undefined) {
        formData.append("avatar_url", data.avatar_url);
      }
      if (data.website !== undefined) {
        formData.append("website", data.website);
      }

      // Server Action 호출
      const result = await updateProfileAction({ success: false, message: "" }, formData);

      if (result.success) {
        showSuccess(result.message);
        router.push("/profile");
      } else {
        showError(result.message);
        // 필드별 에러가 있다면 react-hook-form에 설정
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof UpdateProfileInput, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("프로필 수정 실패:", error);
      showError("프로필 수정 중 오류가 발생했습니다.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardContent className="space-y-4 pt-6">
            {/* 닉네임 */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>닉네임</FormLabel>
                  <FormControl>
                    <Input placeholder="예: gymcoding123" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    3-20자의 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.
                  </FormDescription>
                  {usernameAvailable === false && (
                    <p className="text-sm text-red-500">이미 사용 중인 닉네임입니다</p>
                  )}
                  {usernameAvailable === true && (
                    <p className="text-sm text-green-500">사용 가능한 닉네임입니다</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 전체 이름 */}
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>전체 이름</FormLabel>
                  <FormControl>
                    <Input placeholder="예: 짐코딩" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>프로필에 표시될 이름입니다.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 아바타 URL */}
            <FormField
              control={form.control}
              name="avatar_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>아바타 URL (선택)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://example.com/avatar.jpg"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>프로필 사진 URL을 입력하세요.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 웹사이트 */}
            <FormField
              control={form.control}
              name="website"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>웹사이트 (선택)</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>개인 웹사이트 또는 블로그 URL</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 제출 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isSubmitting || usernameAvailable === false}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                저장 중...
              </>
            ) : (
              "저장"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
