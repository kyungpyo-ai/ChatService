// TODO(Phase 3~5): 실제 데이터 연결 후 제거

export interface MockParticipant {
  id: string;
  nickname: string;
  avatarUrl: string;
  isOwner: boolean;
}

export const mockParticipants: MockParticipant[] = [
  {
    id: "me",
    nickname: "나",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=me",
    isOwner: true,
  },
  {
    id: "u1",
    nickname: "해피해피",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=u1",
    isOwner: false,
  },
  {
    id: "u2",
    nickname: "바다홀아",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=u2",
    isOwner: false,
  },
  {
    id: "u3",
    nickname: "영화좋아",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=u3",
    isOwner: false,
  },
  {
    id: "u4",
    nickname: "커피한잔",
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=u4",
    isOwner: false,
  },
];
