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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/schemas/profile";
import { showSuccess, showError } from "@/lib/utils/toast";
import { updateProfileAction, checkUsernameAction } from "@/app/actions/profile";
import { uploadAvatar, AVATAR_ALLOWED_MIME_TYPES } from "@/lib/storage/avatars";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@/lib/types/models";
import { useEffect, useRef, useState } from "react";
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
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form 초기화
  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      username: profile.username || undefined,
      avatar_url: profile.avatar_url || "",
      gender: (profile.gender as "male" | "female" | undefined) || undefined,
      age: profile.age != null ? String(profile.age) : undefined,
    },
  });

  const watchedUsername = form.watch("username");
  const watchedAvatarUrl = form.watch("avatar_url");

  // 아바타 파일 선택 시 즉시 Storage에 업로드하고, 성공하면 폼의 avatar_url을 공개 URL로
  // 갱신한다 — 저장 버튼을 누를 때는 이미 완성된 URL 문자열만 넘기면 되므로
  // updateProfileAction의 기존 저장 흐름은 그대로 재사용된다.
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setIsUploadingAvatar(true);
    try {
      const result = await uploadAvatar(createClient(), profile.id, file);
      if (!result.success) {
        showError(result.message);
        return;
      }
      form.setValue("avatar_url", result.publicUrl, { shouldDirty: true });
    } catch {
      showError("아바타 업로드 중 오류가 발생했습니다.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

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
      if (data.avatar_url !== undefined) {
        formData.append("avatar_url", data.avatar_url);
      }
      if (data.gender !== undefined) {
        formData.append("gender", data.gender);
      }
      if (data.age !== undefined) {
        formData.append("age", String(data.age));
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
        <div className="bg-surface rounded-(--radius-card) border p-5 shadow-(--shadow-card)">
          <div className="space-y-4">
            {/* 닉네임 */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>닉네임</FormLabel>
                  <FormControl>
                    <Input placeholder="예: coder1" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormDescription>
                    3-6자의 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.
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

            {/* 나이 */}
            <FormField
              control={form.control}
              name="age"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>나이</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="예: 25" {...field} disabled={isSubmitting} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 성별 */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>성별</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="성별을 선택하세요" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="male">남성</SelectItem>
                      <SelectItem value="female">여성</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 아바타 (파일 업로드) */}
            <FormField
              control={form.control}
              name="avatar_url"
              render={() => (
                <FormItem>
                  <FormLabel>아바타 (선택)</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={watchedAvatarUrl || undefined} alt="아바타 미리보기" />
                        <AvatarFallback>{(profile.username ?? "?")[0]}</AvatarFallback>
                      </Avatar>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept={AVATAR_ALLOWED_MIME_TYPES.join(",")}
                        className="hidden"
                        onChange={handleAvatarFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isSubmitting || isUploadingAvatar}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploadingAvatar ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            업로드 중...
                          </>
                        ) : (
                          "이미지 선택"
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>내 PC에서 이미지 파일을 선택하세요 (최대 2MB).</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            className="flex-1 rounded-(--radius-card)"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button
            type="submit"
            className="bg-brand hover:bg-brand/90 text-brand-foreground flex-1 rounded-(--radius-card)"
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
