// TODO(Phase 3~5): 실제 데이터 연결 후 제거

export interface MockSearchUser {
  id: string;
  nickname: string;
  age: number;
  avatarUrl: string;
  isOnline: boolean;
}

export const mockRecentSearches = ["수다왕", "바다물아"];

export const mockSearchUsers: MockSearchUser[] = [
  {
    id: "u1",
    nickname: "수다왕",
    age: 26,
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=수다왕",
    isOnline: true,
  },
  {
    id: "u2",
    nickname: "바다물아",
    age: 25,
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=바다물아",
    isOnline: true,
  },
  {
    id: "u3",
    nickname: "영화좋아",
    age: 31,
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=영화좋아",
    isOnline: false,
  },
  {
    id: "u4",
    nickname: "해피해미",
    age: 27,
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=해피해미",
    isOnline: true,
  },
  {
    id: "u5",
    nickname: "커피한잔",
    age: 30,
    avatarUrl: "https://api.dicebear.com/9.x/thumbs/svg?seed=커피한잔",
    isOnline: false,
  },
];
