"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
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
import { createRoomSchema, type CreateRoomInput } from "@/lib/schemas/room";
import { showError } from "@/lib/utils/toast";
import { createRoomAction } from "@/app/actions/rooms";

export function CreateRoomForm() {
  const form = useForm<CreateRoomInput>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      maxMembers: "20",
      isPrivate: false,
      password: "",
    },
  });

  const isPrivate = form.watch("isPrivate");
  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: CreateRoomInput) => {
    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("maxMembers", data.maxMembers);
    formData.append("isPrivate", String(data.isPrivate));
    if (data.password) formData.append("password", data.password);

    const result = await createRoomAction({ success: false, message: "" }, formData);

    // 성공 시 createRoomAction 내부에서 redirect()가 페이지 이동을 처리하므로 여기까지 도달하지 않는다.
    if (!result.success) {
      showError(result.message);
      if (result.errors) {
        Object.entries(result.errors).forEach(([field, messages]) => {
          if (messages && messages.length > 0) {
            form.setError(field as keyof CreateRoomInput, {
              type: "manual",
              message: messages[0],
            });
          }
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>방 제목</FormLabel>
              <FormControl>
                <Input placeholder="예: 수다온 사람들 모여라" {...field} disabled={isSubmitting} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="maxMembers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>최대 인원</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="인원 선택" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="5">5명</SelectItem>
                  <SelectItem value="10">10명</SelectItem>
                  <SelectItem value="20">20명</SelectItem>
                  <SelectItem value="50">50명</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isPrivate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center gap-2 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isSubmitting}
                />
              </FormControl>
              <FormLabel className="font-normal">비밀번호로 잠긴 방으로 만들기</FormLabel>
            </FormItem>
          )}
        />

        {isPrivate && (
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="4~20자로 입력하세요"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button
          type="submit"
          className="bg-brand hover:bg-brand/90 text-brand-foreground w-full rounded-(--radius-card)"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              만드는 중...
            </>
          ) : (
            "방 만들기"
          )}
        </Button>
      </form>
    </Form>
  );
}
