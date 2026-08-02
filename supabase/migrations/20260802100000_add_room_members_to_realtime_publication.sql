-- 진짜 원인: room_members가 supabase_realtime publication에 등록된 적이 없어서
-- RLS/grant/replica identity를 아무리 고쳐도 postgres_changes 구독 자체가 서버에 등록되지 않았다.
alter publication supabase_realtime add table public.room_members;
alter table public.room_members replica identity full;
