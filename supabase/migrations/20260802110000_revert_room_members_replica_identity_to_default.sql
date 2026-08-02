-- room_members 변경 감지를 event:"*" 단일 바인딩 + 참여자 목록 재조회(diff) 방식으로 바꾸면서
-- DELETE old row의 전체 컬럼이 더 이상 필요 없어졌다. WAL 오버헤드를 줄이기 위해 기본값으로 되돌린다.
alter table public.room_members replica identity default;
