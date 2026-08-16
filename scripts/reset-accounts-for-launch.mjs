/**
 * 배포(정식 오픈) 직전 실행하는 1회성 스크립트 — 남아있는 모든 계정(auth.users)을 삭제해
 * 초기화한다.
 *
 * 배경(§ROADMAP Phase 9): 회원가입 시 나이 검증·약관 동의 관문(app/(main)/layout.tsx)은
 * "닉네임 없는 로그인 사용자"만 거치도록 되어 있어, 그 관문이 생기기 전에 만든 기존 계정은
 * 약관 동의를 받은 적이 없다. 아직 서비스를 실제로 운영 중이 아니므로 별도 백필 로직 대신
 * 배포 시점에 계정을 전부 지워 초기화하기로 결정했다 — 이후 생기는 모든 계정은 예외 없이
 * 신규 가입 경로(=약관 동의 관문)를 거치게 된다.
 *
 * auth.users 삭제는 rooms/random_sessions BEFORE DELETE 트리거(§Phase 7)를 그대로 타므로
 * cascade로 삭제되는 방/세션도 자동으로 아카이브된다 — 이 스크립트에서 별도 데이터 정리는
 * 하지 않는다.
 *
 * 실행: node scripts/reset-accounts-for-launch.mjs
 * (레포 루트에서, .env.local에 SUPABASE_SERVICE_ROLE_KEY가 설정된 상태로 실행해야 한다)
 *
 * ⚠️ 파괴적 작업이다 — 실제 배포 직전에만, 실행 전 반드시 삭제 대상 계정 수를 확인하고
 * 진행할 것.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const get = (key) => env.match(new RegExp(`^${key}=(.*)$`, "m"))?.[1]?.trim();

const url = get("NEXT_PUBLIC_SUPABASE_URL");
const serviceKey = get("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !serviceKey) {
  console.error(
    "NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY를 .env.local에서 찾을 수 없습니다."
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey);

async function listAllUsers() {
  const users = [];
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("사용자 목록 조회 실패:", error.message);
      process.exit(1);
    }
    users.push(...data.users);
    if (data.users.length < perPage) break;
    page += 1;
  }

  return users;
}

const users = await listAllUsers();
console.log(`삭제 대상 계정: ${users.length}명`);

for (const user of users) {
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error(`삭제 실패 (${user.id}, ${user.email ?? "익명"}):`, error.message);
  } else {
    console.log(`삭제됨: ${user.id} (${user.email ?? "익명"})`);
  }
}

console.log("완료.");
