"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendRandomImageMessageAction, sendRandomMessageAction } from "@/app/actions/messages";
import { createChatImageUploadUrlAction } from "@/app/actions/chat-images";
import { endRandomSessionAction, heartbeatRandomSessionAction } from "@/app/actions/random";
import {
  CHAT_IMAGES_BUCKET,
  CHAT_IMAGE_MAX_SIZE_BYTES,
  CHAT_IMAGE_MIME_TO_EXTENSION,
  getSignedChatImageUrl,
  isValidChatImageMimeType,
  type ChatImageMimeType,
} from "@/lib/storage/chat-images";
import { showError } from "@/lib/utils/toast";
import { generateTempId } from "@/lib/utils/temp-id";
import type { ChatMessage } from "@/components/chat/chat-message-bubble";

/**
 * 서버 액션이 sessionExpired를 반환하면(§lib/utils/stale-session.ts) 이미 삭제된 계정의
 * 세션이라는 뜻이다 — 클라이언트에서도 로그아웃 처리하고 잠시 후 새로고침해 새 세션을
 * 받도록 유도한다.
 */
async function recoverFromStaleSession(message: string) {
  showError(message);
  const supabase = createClient();
  await supabase.auth.signOut();
  window.setTimeout(() => window.location.reload(), 1500);
}

// 세션 전용 하트비트 폴링 간격 — 검색 화면의 온라인 표시 하트비트(60초, 탭 백그라운드 시 정지)와는
// 완전히 별개다. "채팅 중"과 "지금 이 탭을 보고 있음"은 다른 개념이므로 탭 가시성과 무관하게 계속
// 돈다(§DEVELOPMENT_PLAN 5.5).
const SESSION_HEARTBEAT_INTERVAL_MS = 10000;
// 상대가 25초(폴링 간격의 2.5배) 넘게 조용하면 "나갔다"고 판단한다 — 이 임계값은
// heartbeat_random_session() DB 함수 안에서 서버 시각 기준으로 적용된다(§위 주석 참고).
const ROUTINE_STALE_SECONDS = 25;
// Presence leave 재검증 전용 — 상대의 정상 하트비트 주기(10초) 한 번은 지켜본 뒤 판단하도록
// 확인 대기 시간과 재검증 임계값을 정기 폴링(25초)보다 훨씬 짧게 잡는다.
const PRESENCE_LEAVE_CONFIRM_DELAY_MS = 10000;
const PRESENCE_LEAVE_STALE_SECONDS = 8;

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

/**
 * 전송 직후 낙관적으로 붙인 메시지를 Realtime INSERT 이벤트와 매칭하기 위한 대기 큐 항목.
 *
 * 텍스트는 전송 시점에 이미 content(문자열)를 알지만, 이미지는 업로드 URL을 발급받아야
 * 비로소 Storage 경로(=content)를 알 수 있다. 그래서 이미지의 경우 낙관적 메시지를 먼저
 * 화면에 붙이고, 경로를 알게 된 시점에 이 큐에 등록한다 — 등록 시점이 실제 업로드/INSERT
 * 보다 항상 앞서므로 Realtime 이벤트를 놓치지 않는다.
 */
interface PendingSend {
  tempId: string;
  content: string;
  /** 이미지 전송인 경우의 로컬 미리보기 blob URL — reconcile 시 해제해 누수를 막는다 */
  previewUrl?: string;
}

interface RandomSessionLiveState {
  messages: ChatMessage[];
  partnerEnded: boolean;
  sendMessage: (content: string) => Promise<void>;
  sendImageMessage: (file: File) => Promise<void>;
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
 * 상대방이 "종료" 버튼 없이 그냥 사라진 경우(탭을 닫거나 네트워크가 끊김)는 두 가지 신호를
 * "힌트 + 재검증" 구조로 함께 쓴다(§2026-08-16, 최초엔 Presence leave만으로 즉시 종료했다가
 * 매칭 직후 채널 join/재연결 타이밍에 상대가 멀쩡한데도 가짜 leave가 발생해 대화가 시작하자마자
 * 끊기는 오탐을 실사용 중 겪은 뒤 이 구조로 바꿨다):
 *
 * 1. **정기 하트비트(신뢰 소스, 느림)** — `heartbeat_random_session()`을 10초마다 호출해 본인
 *    생존을 알리고, 같은 응답으로 "상대가 25초(폴링 간격의 2.5배) 넘게 조용한가"를 서버가 이미
 *    판단한 boolean(`partnerStale`)으로 받는다. 이 판단은 클라이언트 시계가 아니라 DB 서버
 *    시각 기준으로 서버에서 끝내서 내려준다 — 처음엔 상대의 마지막 활동 시각(timestamptz)을
 *    그대로 받아 클라이언트의 Date.now()와 비교했는데, 이 방식 자체가 매칭 직후 즉시 오판하는
 *    버그의 원인이었다(Supabase 로그로 end_random_session 호출 주체를 추적해 확인 — 매번
 *    자기 자신의 판단 오류였다). partnerStale이 true면 상대가 사라진 것으로 보고 직접
 *    `endRandomSessionAction()`을 호출한다. 최악의 경우에도 약 35초 안에는 확실히 잡아주는
 *    하한선이다.
 * 2. **Presence leave(빠른 힌트, 단독 신뢰 불가)** — `random-session-${sessionId}` Presence
 *    채널의 `leave` 이벤트는 소켓 연결이 끊기면 서버가 보통 수 초 내로 통지하지만, 그 자체로는
 *    못 믿는다(매칭 직후 오탐 + Supabase Realtime 서버가 접속자가 뜸하면 잠들었다 깨는 주기를
 *    타면서 이벤트가 유실되는 경우도 있었음, get_logs로 확인). 그래서 leave를 받아도 즉시
 *    종료하지 않고, `PRESENCE_LEAVE_CONFIRM_DELAY_MS`(정기 하트비트 주기만큼)만 기다렸다가
 *    더 짧은 임계값(`PRESENCE_LEAVE_STALE_SECONDS`)으로 `heartbeat_random_session()`을 한 번
 *    더 호출해 재검증한다 — 그 사이 상대가 진짜 하트비트를 보냈으면 통과(가짜 신호였던 것),
 *    여전히 조용하면 그때 종료한다. 대기 중에 상대의 Presence `join`(재연결)이 오면 재검증
 *    자체를 취소한다. 이러면 오탐 없이 보통 10초 안팎으로 감지 속도를 끌어올릴 수 있다.
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
  // Presence leave 재검증 대기 타이머 — 진행 중인 재검증이 있으면 leave를 또 받아도 새로
  // 걸지 않고, join(재연결)이 오면 취소한다(§useRandomSessionMessages 상단 주석 참고).
  const suspicionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
          async (payload) => {
            const row = payload.new as MessageRow;

            // row.content는 이미지 메시지의 경우 서명 URL이 아니라 Storage 경로다.
            // 비공개 버킷이라 표시하려면 별도로 서명 URL을 발급받아야 한다(텍스트는 즉시 null).
            const imageUrl =
              row.content_type === "image"
                ? await getSignedChatImageUrl(supabase, row.content)
                : null;

            // 내가 보낸 메시지라면 낙관적으로 붙여둔 임시 항목을 실제 row로 치환(reconcile)한다.
            if (row.sender_id === currentUserId) {
              const pendingIndex = pendingSendsRef.current.findIndex(
                (p) => p.content === row.content
              );
              if (pendingIndex !== -1) {
                const [pending] = pendingSendsRef.current.splice(pendingIndex, 1);
                if (pending.previewUrl) {
                  URL.revokeObjectURL(pending.previewUrl);
                }
                setMessages((prev) => {
                  if (prev.some((m) => m.id === row.id)) return prev;
                  return prev.map((m) =>
                    m.id === pending.tempId
                      ? {
                          id: row.id,
                          senderId: row.sender_id,
                          senderName: "나",
                          content: row.content_type === "text" ? row.content : "",
                          imageUrl,
                          createdAt: row.created_at,
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
                  imageUrl,
                  createdAt: row.created_at,
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

      // 상대방이 "종료" 버튼 없이 사라진 경우의 빠른 힌트 — 단독으로는 못 믿으므로 즉시
      // 종료하지 않고, leave를 받으면 suspicionTimeoutRef에 재검증 타이머만 건다(아래 참고).
      // 재연결(join)이 그 안에 오면 재검증 자체를 취소한다.
      const presenceChannel = supabase.channel(`random-session-${sessionId}`, {
        config: { presence: { key: currentUserId } },
      });
      presenceChannel
        .on("presence", { event: "leave" }, ({ key }) => {
          if (key === currentUserId || cancelled) return;
          if (suspicionTimeoutRef.current) return; // 이미 재검증 대기 중
          suspicionTimeoutRef.current = setTimeout(() => {
            suspicionTimeoutRef.current = null;
            void checkPartnerHeartbeat(PRESENCE_LEAVE_STALE_SECONDS);
          }, PRESENCE_LEAVE_CONFIRM_DELAY_MS);
        })
        .on("presence", { event: "join" }, ({ key }) => {
          if (key === currentUserId) return;
          if (suspicionTimeoutRef.current) {
            clearTimeout(suspicionTimeoutRef.current);
            suspicionTimeoutRef.current = null;
          }
        })
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            void presenceChannel.track({ online_at: new Date().toISOString() });
          }
        });

      channels = [messageChannel, endedChannel, presenceChannel];
    })();

    // 세션 전용 하트비트 폴링 — Presence leave 오탐/유실 모두에 흔들리지 않는 신뢰 가능한
    // 하한선(위 주석 참고). mount 시 즉시 1회 호출해, 이미 상대가 오래 전에 멈춰있는 세션에
    // 뒤늦게 들어온 경우도 첫 10초를 그냥 흘려보내지 않고 바로 확인한다.
    const checkPartnerHeartbeat = async (staleSeconds: number) => {
      const result = await heartbeatRandomSessionAction(sessionId, staleSeconds);
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

      if (result.partnerStale) {
        setPartnerEnded(true);
        void endRandomSessionAction(sessionId);
      }
    };

    void checkPartnerHeartbeat(ROUTINE_STALE_SECONDS);
    const heartbeatTimer = setInterval(
      () => void checkPartnerHeartbeat(ROUTINE_STALE_SECONDS),
      SESSION_HEARTBEAT_INTERVAL_MS
    );

    return () => {
      cancelled = true;
      clearInterval(heartbeatTimer);
      if (suspicionTimeoutRef.current) {
        clearTimeout(suspicionTimeoutRef.current);
        suspicionTimeoutRef.current = null;
      }
      channels.forEach((channel) => supabase.removeChannel(channel));
      // 언마운트 시점까지 reconcile되지 못한 이미지 낙관적 메시지의 blob URL을 정리한다.
      pendingSendsRef.current.forEach((pending) => {
        if (pending.previewUrl) {
          URL.revokeObjectURL(pending.previewUrl);
        }
      });
    };
  }, [sessionId, currentUserId]);

  // 탭을 닫거나 다른 페이지로 이동할 때 "종료" 버튼을 누른 것과 동일하게 즉시 세션을 끝내는
  // best-effort 빠른 경로 — pagehide는 언로드 도중에도 sendBeacon 전송을 보장해주는 표준
  // 이벤트다(beforeunload보다 모바일에서 더 안정적으로 발생함). event.persisted가 true면
  // 실제 종료가 아니라 브라우저의 bfcache(뒤로가기 대비 캐시)로 넘어가는 것뿐이므로 무시한다.
  // 이 신호가 실패해도(모바일 강제종료 등, §app/api/random/beacon-end/route.ts 주석 참고)
  // 위 세션 하트비트가 최종 안전망으로 남아 있어 손해가 없다.
  useEffect(() => {
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      const payload = new Blob([JSON.stringify({ sessionId })], { type: "application/json" });
      navigator.sendBeacon("/api/random/beacon-end", payload);
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      const tempId = `temp-${generateTempId()}`;

      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: "나",
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      pendingSendsRef.current.push({ tempId, content: trimmed });
      setMessages((prev) => [...prev, optimisticMessage]);

      const result = await sendRandomMessageAction(sessionId, trimmed);

      if (!result.success) {
        pendingSendsRef.current = pendingSendsRef.current.filter((p) => p.tempId !== tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (result.sessionExpired) {
          void recoverFromStaleSession(result.message);
        } else {
          showError(result.message);
        }
      }
    },
    [sessionId, currentUserId]
  );

  const sendImageMessage = useCallback(
    async (file: File) => {
      const mimeType = file.type;
      if (!isValidChatImageMimeType(mimeType)) {
        showError("JPG, PNG, WEBP 형식의 이미지만 첨부할 수 있습니다.");
        return;
      }
      if (file.size > CHAT_IMAGE_MAX_SIZE_BYTES) {
        showError("이미지는 5MB 이하만 첨부할 수 있습니다.");
        return;
      }

      const tempId = `temp-${generateTempId()}`;
      const previewUrl = URL.createObjectURL(file);

      // 1. 경로를 알기 전이라도 로컬 blob URL로 즉시 미리보기를 붙인다(낙관적 UI).
      const optimisticMessage: ChatMessage = {
        id: tempId,
        senderId: currentUserId,
        senderName: "나",
        content: "",
        imageUrl: previewUrl,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);

      const rollback = (message: string, sessionExpired?: boolean) => {
        pendingSendsRef.current = pendingSendsRef.current.filter((p) => p.tempId !== tempId);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        URL.revokeObjectURL(previewUrl);
        if (sessionExpired) {
          void recoverFromStaleSession(message);
        } else {
          showError(message);
        }
      };

      // 2. 업로드 URL 발급 — 이 시점에 비로소 Storage 경로(=content)를 알게 된다.
      const ticket = await createChatImageUploadUrlAction(
        "sessions",
        sessionId,
        CHAT_IMAGE_MIME_TO_EXTENSION[mimeType as ChatImageMimeType]
      );
      if (!ticket.success || !ticket.data) {
        rollback(ticket.message || "이미지 업로드 준비에 실패했습니다.");
        return;
      }

      // 경로를 알게 된 시점에 pending 큐에 등록한다. 업로드/INSERT는 아직 시작 전이므로
      // Realtime INSERT 이벤트보다 항상 먼저 등록되어 reconcile 매칭을 놓치지 않는다.
      pendingSendsRef.current.push({ tempId, content: ticket.data.path, previewUrl });

      // 3. 서명 URL로 Storage에 직접 업로드(파일 바이트는 서버 액션을 거치지 않는다).
      const supabase = createClient();
      const { error: uploadError } = await supabase.storage
        .from(CHAT_IMAGES_BUCKET)
        .uploadToSignedUrl(ticket.data.path, ticket.data.token, file);

      if (uploadError) {
        rollback("이미지 업로드에 실패했습니다.");
        return;
      }

      // 4. 메시지 INSERT — 성공하면 Realtime INSERT 이벤트가 위 pending 큐를 통해 reconcile한다.
      const result = await sendRandomImageMessageAction(sessionId, ticket.data.path);
      if (!result.success) {
        rollback(result.message, result.sessionExpired);
      }
    },
    [sessionId, currentUserId]
  );

  return { messages, partnerEnded, sendMessage, sendImageMessage };
}
