-- 비공개방 비밀번호가 정확히 입력해도 항상 "비밀번호가 올바르지 않습니다"로 실패하는 문제
-- 수정(§사용자 재현 확인). createRoomAction(app/actions/rooms.ts)이 bcryptjs로 해시를
-- 만드는데, bcryptjs 3.x가 생성하는 "$2b$" 버전 태그를 Supabase pgcrypto의 crypt()가
-- 인식하지 못해(같은 해시를 pgcrypto가 만든 "$2a$" 태그로만 바꿔도 그대로 일치) 매번
-- invalid_password로 판정됐다. $2a$/$2b$/$2x$/$2y$는 해시 알고리즘 자체는 동일하고 버전
-- 태그만 다르므로, 태그만 "$2a$"로 정규화해 기존 데이터를 즉시 복구한다(앱 코드 쪽도
-- createRoomAction에서 해시 생성 직후 동일하게 정규화하도록 별도 수정함).
update public.rooms
set password_hash = regexp_replace(password_hash, '^\$2[a-z]\$', '$2a$')
where is_private = true and password_hash ~ '^\$2[a-y]\$' and password_hash !~ '^\$2a\$';
