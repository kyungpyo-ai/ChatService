/**
 * 관리자 전용 레이아웃 (Phase 7.5 §7.5.1)
 *
 * (main) route group과 분리된 별도 레이아웃이다(BottomNav/SidebarNav 없음). 로그인 자체는
 * 기존 미들웨어가 그대로 막고(/admin은 isPublicPath에 없으므로 비로그인은 /auth/login으로
 * 리다이렉트됨), 여기서는 is_admin() RPC로 관리자 여부만 재확인한다. 실패 시 notFound()로
 * 404를 반환해 관리자 경로가 존재한다는 사실 자체를 비관리자에게 노출하지 않는다
 * (리다이렉트 대신 404를 선택한 이유, §DEVELOPMENT_PLAN 7.5.1).
 */

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserClaims } from "@/lib/supabase/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const claims = await getCurrentUserClaims();

  if (!claims?.sub) {
    notFound();
  }

  const supabase = await createClient();
  const { data: isAdmin, error } = await supabase.rpc("is_admin");

  if (error || !isAdmin) {
    notFound();
  }

  return (
    <div className="bg-surface-muted flex min-h-screen">
      <AdminSidebar />
      <main className="min-w-0 flex-1 p-6 md:ml-56">{children}</main>
    </div>
  );
}
