"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatChatTime } from "@/lib/utils/date";
import { sendRandomMessageAction } from "@/app/actions/messages";
import { endRandomSessionAction, heartbeatRandomSessionAction } from "@/app/actions/random";
import { showError } from "@/lib/utils/toast";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

// 세션 전용 하트비트 폴링 간격 — 검색 화면의 온라인 표시 하트비트(60초, 탭 백그라운드 시 정지)와는
// 완전히 별개다. "채팅 중"과 "지금 이 탭을 보고 있음"은 다른 개념이므로 탭 가시성과 무관하게 계속
// 돈다(§DEVELOPMENT_PLAN 5.5).
const SESSION_HEARTBEAT_INTERVAL_MS = 10000;
// 상대 하트비트가 이 시간 넘게 갱신되지 않으면 "나갔다"고 판단한다(폴링 간격의 2.5배 — 한 번
// 놓쳐도 오탐하지 않을 여유).
const PARTNER_STALE_MS = 25000;

interface MessageRow {
  id: string;
  sender_id: string;
  content_type: string;
  content: string;
  created_at: string;
}

interface SessionRow {
  status: string;
  ended_by: string | null;
}

/** 전송 직후 낙관적으로 붙인 메시지를 Realtime INSERT 이벤트와 매칭하기 위한 대기 큐 항목 */
interface PendingSend {
  tempId: string;
  content: string;
}

interface RandomSessionLiveState {
  messages: ChatMessage[];
  partnerEnded: boolean;
  sendMessage: (content: string) => Promise<void>;
}

/**
 * 랜덤채팅 실시간 상태 — 텍스트 메시지 송수신 + 상대방 종료 감지 (§ARCHITECTURE 7)
 *
 * useRoomMessages(lib/realtime/messages.ts)의 낙관적 전송·reconcile 로직을 세션 컨텍스트로
 * 옮긴 것 — 참여자 목록 diff가 필요 없어 room 버전보다 단순하므로 공용 훅으로 추출하지 않고
 * 별도 파일로 유지한다(§DEVELOPMENT_PLAN 5.4).
 *
 * 이 프로젝트의 Realtime 서버는 채널 하나에 postgres_changes 바인딩을 2개 이상 걸면 클라이언트는
 * "SUBSCRIBED"를 받지만 서버 측 등록이 조용히 실패하는 것으로 확인됐다(Phase 3~4에서 격리 재현).
 * 그래서 메시지 채널(INSERT)과 세션 종료 채널(UPDATE)을 분리해 각각 단일 바인딩만 건다.
 *
 * 상대방이 "종료" 버튼 없이 그냥 사라진 경우(탭을 닫거나 네트워크가 끊김)는 postgres_changes로는
 * 감지할 수 없다 — DB가 바뀌지 않으니 이벤트 자체가 없다. 그래서 `random-session-${sessionId}`
 * Presence 채널에 양쪽이 join하고, 상대방의 `leave` 이벤트(소켓 연결 끊김을 서버가 감지해 보통
 * 수 초 내로 통지)를 감지하면 즉시 `partnerEnded`로 전환하고 `endRandomSessionAction()`을
 * 호출해 세션을 정리한다 — 되면 가장 빠른 경로지만, 실제 확인해보니 100% 신뢰할 수는 없다.
 * Supabase Realtime 서버가 접속자가 뜸하면 통째로 잠들었다 깨는 주기를 타면서 leave 이벤트
 * 자체가 서버에서 유실되는 경우가 있고(get_logs로 확인), 이건 클라이언트가 이미 받은 이벤트를
 * 재확인하는 방식으로는 못 잡는다.
 *
 * 그래서 진짜 신뢰 소스는 세션 전용 하트비트다 — `heartbeat_random_session()`을 10초마다 호출해
 * 본인 생존을 알리고, 같은 응답으로 상대의 마지막 하트비트 시각을 받는다. 25초(폴링 간격의
 * 2.5배) 넘게 갱신이 없으면 상대가 사라진 것으로 보고 직접 `endRandomSessionAction()`을 호출한다.
 * Presence leave는 "되면 좋은" 빠른 경로(보통 수 초)이고, 이 하트비트가 최악의 경우에도 약
 * 35초 안에는 확실히 잡아주는 하한선이다(§DEVELOPMENT_PLAN 5.5).
 *
 * 검색 화면 온라인 표시용 하트비트(profiles/guest_profiles.last_seen_at, 60초 간격)는 탭이
 * 백그라운드면 갱신을 멈추는데, 그건 재사용하지 않는다 — 채팅 중 잠깐 다른 탭을 봤다고 상대가
 * 나간 걸로 오판하면 안 되므로, 이 세션 전용 하트비트는 탭 가시성과 무관하게 계속 돈다.
 * postgres_changes UPDATE 채널은 "상대가 명시적으로 종료 버튼을 눌렀을 때"의 즉시 반영을 맡는다.
 *
 * 랜덤채팅은 신원을 드러내지 않는 것이 설계 의도이므로(§5.0, §5.5) senderName은 실제 닉네임이
 * 아니라 본인 여부에 따른 "나"/"상대방" 고정 문자열만 사용하고 아바타는 채우지 않는다.
 */
export function useRandomSessionMessages(
  sessionId: string,
  initialMessages: ChatMessage[],
  currentUserId: string
): RandomSessionLiveState {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [partnerEnded, setPartnerEnded] = useState(false);
  // 내가 보낸 메시지 중 아직 Realtime INSERT로 되돌아오지 않은 것들의 대기 큐(FIFO)
  const pendingSendsRef = useRef<PendingSend[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let channels: ReturnType<typeof supabase.channel>[] = [];
    let cancelled = false;

    // Realtime 채널은 기본적으로 anon 권한으로 연결되므로, RLS가 auth.uid()를 참조하는
    // 이벤트를 받으려면 로그인(익명 포함) 세션의 access token을 명시적으로 전달해야 한다.
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      if (session) {
        supabase.realtime.setAuth(session.access_token);
      }

      const messageChannel = supabase
        .channel(`random-${sessionId}-messages`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            const row = payload.new as MessageRow;

            // 내가 보낸 메시지라면 낙관적으로 붙여둔 임시 항목을 실제 row로 치환(reconcile)한다.
            if (row.sender_id === currentUserId) {
              const pendingIndex = pendingSendsRef.current.findIndex(
                (p) => p.content === row.content
              );
              if (pendingIndex !== -1) {
                const [pending] = pendingSendsRef.current.splice(pendingIndex, 1);
                setMessages((prev) => {
                  if (prev.some((m) => m.id === row.id)) return prev;
                  return prev.map((m) =>
                    m.id === pending.tempId
                      ? {
                          id: row.id,
                          senderId: row.sender_id,
                          senderName: "나",
                          content: row.content_type === "text" ? row.content : "",
                          imageUrl: row.content_type === "image" ? row.content : null,
                          createdAt: formatChatTime(row.created_at),
                        }
                      : m
                  );
                });
                return;
              }
            }

            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [
                ...prev,
                {
                  id: row.id,
                  senderId: row.sender_id,
                  senderName: row.sender_id === currentUserId ? "나" : "상대방",
                  content: row.content_type === "text" ? row.content : "",
                  imageUrl: row.content_type === "image" ? row.content : null,
                  createdAt: formatChatTime(row.created_at),
                },
              ];
            });
          }
        )
        .subscribe();

      const endedChannel = supabase
        .channel(`random-${sessionId}-ended`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "random_sessions",
            filter: `id=eq.${sessionId}`,
          },
          (payload) => {
            const row = payload.new as SessionRow;
            if (row.status === "ended" && row.ended_by !== currentUserId) {
              setPartnerEnded(true);
            }
          }
        )
        .subscribe();

      // 상대방이 종료 버튼 없이 사라진 경우(탭 종료, 네트워크 끊김)의 즉시 감지 — presence
      // leave 이벤트는 소켓 연결이 끊기면 서버가 수 초 내로 통지하므로 시간 추측이 필요 없다.
      const presenceChannel = supabase.channel(`random-session-${sessionId}`, {
        config: { presence: { key: currentUserId } },
      });
      presenceChannel
        .on("presence", { event: "leave" }, ({ key }) => {
          if (key === currentUserId) return;
          setPartnerEnded(true);
          void endRandomSessionAction(sessionId);
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void presenceChannel.track({ online_at: new Date().toISOString() });
          }
        });

      channels = [messageChannel, endedChannel, presenceChannel];
    })();

    // 세션 전용 하트비트 폴링 — Presence leave 유실 시의 신뢰 가능한 하한선(위 주석 참고).
    // mount 시 즉시 1회 호출해, 이미 상대가 오래 전에 멈춰있는 세션에 뒤늦게 들어온 경우도
    // 첫 10초를 그냥 흘려보내지 않고 바로 확인한다.
    const runHeartbeat = async () => {
      const result = await heartbeatRandomSessionAction(sessionId);
      if (cancelled) return;

      if (result.status === "ended") {
        if (result.endedBy !== currentUserId) {
          setPartnerEnded(true);
        }
        return;
      }

      if (result.status === null) {
        // 세션 행이 이미 아카이브되어 삭제됨(종료 후 60초 뒤 cron이 정리) — 그 삭제 시점엔
        // ended_by 정보가 사라져 누가 종료했는지 알 수 없다. 하지만 10초 간격 폴링이 60초의
        // 아카이브 유예보다 훨씬 촘촘하므로, 상대가 종료한 경우라면 이미 그 전 폴링에서
        // status:'ended' + ended_by로 정상 처리됐을 것이다 — 여기서 또 partnerEnded를
        // 세팅하면 "내가 직접 종료한" 세션에도 뒤늦게 "상대방이 종료했습니다" 토스트가 뜨는
        // 오탐이 생기므로 아무것도 하지 않는다.
        return;
      }

      if (
        result.partnerLastSeenAt &&
        Date.now() - new Date(result.partnerLastSeenAt).getTime() > PARTNER_STALE_MS
      ) {
        setPartnerEnded(true);
        void endRandomSessionAction(sessionId);
      }
    };

    void runHeartbeat();
    const heartbeatTimer = setInterval(() => void runHeartbeat(), SESSION_HEARTBEAT_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(heartbeatTimer);
      channels.forEach((channel) => supabase.removeChannel(channel));
    };
  }, [sessionId, currentUserId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const tempId = `temp-${crypto.randomUUID()}`;

      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: "나",
        content: trimmed,
        createdAt: formatChatTime(new Date().toISOString()),
      };

      pendingSendsRef.current.push({ tempId, content: trimmed });
      setMessages((prev) => [...prev, optimisticMessage]);

      const result = await sendRandomMessageAction(sessionId, trimmed);

      if (!result.success) {
        pendingSendsRef.current = pendingSendsRef.current.filter((p) => p.tempId !== tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        showError(result.message);
      }
    },
    [sessionId, currentUserId]
  );

  return { messages, partnerEnded, sendMessage };
}
