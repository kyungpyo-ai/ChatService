/**
 * 닉네임 설정 폼 컴포넌트 (Client Component)
 *
 * OAuth 로그인 후 최초 프로필 설정 시 사용하는 폼입니다.
 * React Hook Form + Zod 검증을 사용합니다.
 */

"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { setupProfileSchema, type SetupProfileInput } from "@/lib/schemas/profile";
import { showSuccess, showError } from "@/lib/utils/toast";
import { setupProfileAction } from "@/app/actions/profile";

interface SetupProfileFormProps {
  suggestedUsername: string;
  redirectPath: string;
}

/**
 * 닉네임 설정 폼
 *
 * OAuth 로그인 후 자동 생성된 닉네임을 제안하고
 * 사용자가 수정할 수 있도록 합니다.
 *
 * @param suggestedUsername - OAuth에서 생성된 제안 닉네임
 * @param redirectPath - 완료 후 이동할 경로
 */
export function SetupProfileForm({ suggestedUsername, redirectPath }: SetupProfileFormProps) {
  const router = useRouter();

  // React Hook Form 초기화
  const form = useForm<SetupProfileInput>({
    resolver: zodResolver(setupProfileSchema),
    defaultValues: {
      username: suggestedUsername,
      // Select가 첫 렌더부터 제어 컴포넌트로 동작하도록 빈 문자열을 넣는다.
      // (실제 제출 값은 genderSchema의 "male"|"female"만 유효하므로 캐스팅 필요)
      gender: "" as unknown as SetupProfileInput["gender"],
      age: "",
      termsAgreed: false as unknown as true,
    },
  });

  // 폼 제출 핸들러
  const onSubmit = async (data: SetupProfileInput) => {
    try {
      // FormData 객체 생성
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("gender", data.gender);
      formData.append("age", String(data.age));
      formData.append("termsAgreed", String(data.termsAgreed));

      // Server Action 호출
      const result = await setupProfileAction({ success: false, message: "" }, formData);

      if (result.success) {
        showSuccess(result.message);
        router.push(redirectPath);
      } else {
        showError(result.message);
        // 필드별 에러가 있다면 react-hook-form에 설정
        if (result.errors) {
          Object.entries(result.errors).forEach(([field, messages]) => {
            if (messages && messages.length > 0) {
              form.setError(field as keyof SetupProfileInput, {
                type: "manual",
                message: messages[0],
              });
            }
          });
        }
      }
    } catch (error) {
      console.error("프로필 설정 실패:", error);
      showError("프로필 설정 중 오류가 발생했습니다.");
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* 닉네임 */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>닉네임 *</FormLabel>
              <FormControl>
                <Input placeholder="예: 김민준123" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormDescription>
                3-6자의 영문, 숫자, 한글, 언더스코어(_)만 사용 가능합니다.
              </FormDescription>
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
              <FormLabel>성별 *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
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

        {/* 나이 */}
        <FormField
          control={form.control}
          name="age"
          render={({ field }) => (
            <FormItem>
              <FormLabel>나이 *</FormLabel>
              <FormControl>
                <Input type="number" placeholder="예: 25" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 약관 동의 */}
        <FormField
          control={form.control}
          name="termsAgreed"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-start gap-2">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormLabel className="text-sm leading-normal font-normal">
                  <a
                    href="/legal/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    이용약관
                  </a>{" "}
                  및{" "}
                  <a
                    href="/legal/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2"
                  >
                    개인정보처리방침
                  </a>
                  에 동의합니다 (필수)
                </FormLabel>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 제출 버튼 */}
        <Button
          type="submit"
          className="bg-brand hover:bg-brand/90 text-brand-foreground w-full rounded-(--radius-card)"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              설정 중...
            </>
          ) : (
            "완료"
          )}
        </Button>
      </form>
    </Form>
  );
}
