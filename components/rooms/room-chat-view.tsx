"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { PinnedNoticeBar } from "@/components/chat/pinned-notice-bar";
import { ChatMessageBubble, type ChatMessage } from "@/components/chat/chat-message-bubble";
import { ChatInputBar } from "@/components/chat/chat-input-bar";
import { ParticipantList, ParticipantSidePanel } from "@/components/rooms/participant-list";
import { LeaveRoomDialog } from "@/components/rooms/leave-room-dialog";
import { RoomReportButton } from "@/components/rooms/report-button";
import { useRoomMessages } from "@/lib/realtime/messages";
import { useRoomPresence } from "@/lib/realtime/presence";
import { useRoomHeartbeat } from "@/lib/hooks/use-room-heartbeat";
import { kickMemberAction, leaveRoomAction } from "@/app/actions/rooms";
import { showError, showInfo } from "@/lib/utils/toast";
import { formatChatDate, isSameLocalDate } from "@/lib/utils/date";
import { isRoomNotificationsEnabled, setRoomNotificationsEnabled } from "@/lib/utils/notify";
import type { RoomMember } from "@/lib/queries/rooms";

interface RoomChatViewProps {
  roomId: string;
  title: string;
  memberCount: number;
  maxMembers: number;
  notice: string;
  initialMessages: ChatMessage[];
  participants: RoomMember[];
  currentUserId: string;
}

export function RoomChatView({
  roomId,
  title,
  maxMembers,
  notice,
  initialMessages,
  participants: initialParticipants,
  currentUserId,
}: RoomChatViewProps) {
  const router = useRouter();
  const [participantsOpen, setParticipantsOpen] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  // localStorage는 서버 렌더에서 읽을 수 없으므로, 하이드레이션 불일치를 피하려면
  // 마운트 이후에만 실제 값을 반영해야 한다(§components/theme-switcher.tsx와 동일 패턴).
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  useEffect(() => {
    // 의도적인 마운트 후 동기화 — 서버/클라이언트 hydration 불일치를 피하기 위함
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNotificationsEnabled(isRoomNotificationsEnabled(roomId));
  }, [roomId]);
  const handleToggleNotifications = () => {
    setNotificationsEnabled((prev) => {
      const next = !prev;
      setRoomNotificationsEnabled(roomId, next);
      return next;
    });
  };
  const {
    messages,
    participants,
    roomDeleted,
    kicked,
    hasMoreHistory,
    loadingOlderMessages,
    loadOlderMessages,
    sendMessage,
    sendImageMessage,
  } = useRoomMessages(roomId, initialMessages, initialParticipants, currentUserId);
  const presenceOnlineUserIds = useRoomPresence(roomId, currentUserId);
  useRoomHeartbeat(roomId);
  // Presence는 채널 연결 + track() 왕복이 끝나야 다른 사람에게 "온라인"으로 보이므로,
  // 새로 들어온 참여자를 다른 사람들 화면에서는 실제보다 늦게 온라인으로 표시하는 지연이
  // 있었다(§실사용 확인 2026-08-24). room_members에 새로 나타난(=방금 들어온) 참여자는
  // Presence 확인을 기다리지 않고 바로 온라인으로 낙관적 반영하고, 잠시 뒤 이 낙관값을
  // 지워서 이후로는 Presence의 실제 값(끊기면 오프라인으로도 바뀔 수 있어야 하므로)을 따른다.
  const prevParticipantIdsRef = useRef<Set<string>>(new Set(initialParticipants.map((p) => p.id)));
  const [recentlyJoinedIds, setRecentlyJoinedIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    const currentIds = new Set(participants.map((p) => p.id));
    const newlyJoined = participants
      .map((p) => p.id)
      .filter((id) => id !== currentUserId && !prevParticipantIdsRef.current.has(id));
    prevParticipantIdsRef.current = currentIds;
    if (newlyJoined.length === 0) return;

    setRecentlyJoinedIds((prev) => new Set([...prev, ...newlyJoined]));
    const timer = setTimeout(() => {
      setRecentlyJoinedIds((prev) => {
        const next = new Set(prev);
        newlyJoined.forEach((id) => next.delete(id));
        return next;
      });
    }, 5000);
    return () => clearTimeout(timer);
  }, [participants, currentUserId]);
  const onlineUserIds =
    recentlyJoinedIds.size === 0
      ? presenceOnlineUserIds
      : new Set([...presenceOnlineUserIds, ...recentlyJoinedIds]);
  const isOwner = participants.some((p) => p.id === currentUserId && p.isOwner);
  const memberCount = participants.length;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // "이전 대화 더 보기"로 메시지가 목록 앞에 붙을 때는 맨 아래로 스크롤하면 안 되므로,
  // 마지막 메시지 id가 실제로 바뀐 경우(=새 메시지가 뒤에 추가된 경우)에만 아래로 스크롤한다.
  const lastMessageIdRef = useRef<string | null>(null);

  // 초기 로딩 시 + 새 메시지가 뒤에 추가될 때마다 스크롤을 맨 아래로 이동한다. scrollIntoView는
  // 컨테이너의 하단 padding까지는 못 밀어줘서 스크롤이 진짜 끝까지 안 간 것처럼 보이는 문제가
  // 있어, 컨테이너의 scrollTop을 scrollHeight로 직접 맞춘다.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const lastId = messages[messages.length - 1]?.id ?? null;
    if (lastId === lastMessageIdRef.current) return;
    lastMessageIdRef.current = lastId;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // 스크롤이 맨 위 근처에 닿으면 이전 대화를 더 불러온다. 로드 전후로 스크롤 높이 차이만큼
  // scrollTop을 보정해, 새로 붙은 메시지들만큼 화면이 아래로 밀리지 않고 보던 위치가 유지되게 한다.
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el || loadingOlderMessages || !hasMoreHistory) return;
    if (el.scrollTop > 80) return;

    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;
    void loadOlderMessages().then(() => {
      requestAnimationFrame(() => {
        if (!scrollContainerRef.current) return;
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight - prevScrollHeight + prevScrollTop;
      });
    });
  };

  // 방장이 나가서 방이 삭제되면(leave_room 함수가 rooms 행을 cascade 삭제) 잔류 사용자에게
  // 안내하고 잠시 후 방 목록으로 돌려보낸다.
  useEffect(() => {
    if (!roomDeleted) return;
    showInfo("방장이 나가서 방이 삭제되었습니다.");
    const timer = setTimeout(() => router.push("/rooms"), 1800);
    return () => clearTimeout(timer);
  }, [roomDeleted, router]);

  // 방장에게 강퇴당하면 room_bans INSERT를 실시간으로 받아 kicked가 true가 된다(§lib/realtime/messages).
  useEffect(() => {
    if (!kicked) return;
    showInfo("방장에 의해 강퇴되었습니다.");
    const timer = setTimeout(() => router.push("/rooms"), 1800);
    return () => clearTimeout(timer);
  }, [kicked, router]);

  const handleSend = (text: string) => {
    if (roomDeleted || kicked) return;
    void sendMessage(text);
  };

  const handleSendImage = async (file: File) => {
    if (roomDeleted || kicked) return;
    await sendImageMessage(file);
  };

  const handleKick = async (targetUserId: string) => {
    const result = await kickMemberAction(roomId, targetUserId);
    if (!result.success) {
      showError(result.message);
    }
  };

  const handleLeave = () => {
    setLeaveDialogOpen(false);
    // leave_room RPC 왕복(네트워크 지연)을 기다리지 않고 곧장 방 목록으로 이동한다 — 실패해도
    // 이미 방을 나간 것처럼 보이는 게 어색하지 않고, 실패 시에는 아래에서 토스트로 알려준다.
    // leaveRoomAction은 redirect()를 호출하지 않는다(§app/actions/rooms.ts) — 예전엔 액션이
    // 이동까지 전담했는데, 지금처럼 클라이언트가 먼저 이동한 뒤에도 액션이 뒤늦게 redirect()로
    // 한 번 더 이동시키면 RPC가 끝나는 시점(수백ms~1초 뒤)에 방 목록으로 "다시 들어가지는"
    // 것처럼 화면이 한 번 더 깜빡이는 문제가 있었다(§실사용 확인). 재입장 버그(비멤버가 되면
    // 방 상세 페이지가 자동 재입장시키는 로직)는 애초에 "같은 페이지에 머무른 채 액션 응답을
    // 기다릴 때"만 발생했으므로, 여기서 먼저 떠나버리는 지금 구조에서는 redirect() 없이도
    // 재현되지 않는다.
    //
    // startTransition으로 감싸는 이유: 그냥 router.push()만 하면 /rooms의 loading.tsx가
    // 곧바로 화면을 대체해버려서 "빈 화면 → 깜빡임 → 목록"처럼 보인다(실사용 확인). transition
    // 안에서 push하면 Next가 목적지 데이터가 실제로 준비될 때까지 지금 화면을 그대로 유지하다가
    // 한 번에 교체한다 — 로컬처럼 응답이 빠르면 스켈레톤이 아예 안 보이고, 느릴 때만 자연스럽게
    // loading.tsx로 넘어간다.
    startTransition(() => {
      router.push("/rooms");
    });
    void leaveRoomAction(roomId).then((result) => {
      if (!result.success) {
        showError(result.message);
      }
    });
  };

  return (
    <div className="flex h-dvh">
      <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
        <ChatHeader
          title={title}
          backHref="/rooms"
          memberCount={memberCount}
          maxMembers={maxMembers}
          notificationsEnabled={notificationsEnabled}
          onToggleNotifications={handleToggleNotifications}
          onOpenParticipants={() => setParticipantsOpen(true)}
          onLeave={() => setLeaveDialogOpen(true)}
          onReport={() => setReportOpen(true)}
        />
        <PinnedNoticeBar notice={notice} />

        {roomDeleted && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 text-center text-sm font-medium">
            방장이 나가서 방이 삭제되었습니다. 잠시 후 방 목록으로 이동합니다.
          </div>
        )}
        {kicked && (
          <div className="bg-destructive/10 text-destructive px-4 py-2 text-center text-sm font-medium">
            방장에 의해 강퇴되었습니다. 잠시 후 방 목록으로 이동합니다.
          </div>
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4"
        >
          {loadingOlderMessages && (
            <p className="text-muted-foreground py-1 text-center text-xs">
              이전 대화 불러오는 중...
            </p>
          )}
          {messages.map((message, index) => {
            const prevMessage = messages[index - 1];
            const showDateDivider =
              !prevMessage || !isSameLocalDate(prevMessage.createdAt, message.createdAt);

            return (
              <div key={message.id}>
                {showDateDivider && (
                  <div className="mb-4 flex justify-center py-1">
                    <span
                      className="bg-surface-muted text-muted-foreground rounded-full px-3 py-1 text-xs"
                      suppressHydrationWarning
                    >
                      {formatChatDate(message.createdAt)}
                    </span>
                  </div>
                )}
                <ChatMessageBubble
                  message={message}
                  variant={message.senderId === currentUserId ? "me" : "other"}
                />
              </div>
            );
          })}
        </div>

        <ChatInputBar
          onSend={handleSend}
          onSendImage={handleSendImage}
          disabled={roomDeleted || kicked}
        />
      </div>

      <ParticipantSidePanel
        participants={participants}
        onlineUserIds={onlineUserIds}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onKick={handleKick}
      />
      <ParticipantList
        participants={participants}
        open={participantsOpen}
        onOpenChange={setParticipantsOpen}
        onlineUserIds={onlineUserIds}
        currentUserId={currentUserId}
        isOwner={isOwner}
        onKick={handleKick}
      />
      <LeaveRoomDialog
        open={leaveDialogOpen}
        onOpenChange={setLeaveDialogOpen}
        onConfirm={handleLeave}
        isOwner={isOwner}
      />
      <RoomReportButton roomId={roomId} open={reportOpen} onOpenChange={setReportOpen} />
    </div>
  );
}
