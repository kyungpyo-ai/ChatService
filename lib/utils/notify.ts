"use client";

/**
 * 탭이 백그라운드일 때(§notifyIfTabHidden)만 울리는 알림음. 별도 오디오 파일 없이
 * WebAudio 오실레이터로 짧은 2음 차임을 합성한다 — 애셋 관리/로딩 지연이 필요 없다.
 */
let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioContext) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioContext = new Ctor();
  }
  return audioContext;
}

function playChime() {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }

  const now = ctx.currentTime;
  [880, 1320].forEach((freq, i) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = freq;
    const start = now + i * 0.12;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.25);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + 0.3);
  });
}

const ROOM_NOTIFY_KEY_PREFIX = "room-notify:";

/** 방채팅 화면의 "알림 켜기/끄기" 토글 상태 — 기본값은 켜짐. */
export function isRoomNotificationsEnabled(roomId: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(`${ROOM_NOTIFY_KEY_PREFIX}${roomId}`) !== "off";
  } catch {
    return true;
  }
}

export function setRoomNotificationsEnabled(roomId: string, enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${ROOM_NOTIFY_KEY_PREFIX}${roomId}`, enabled ? "on" : "off");
  } catch {
    // localStorage 접근 불가(사파리 프라이빗 모드 등) 시 조용히 무시 — 토글 UI 자체는 계속 동작한다
  }
}

const GLOBAL_NOTIFY_KEY = "global-notify";

/**
 * 랜덤채팅의 알림 토글 — 세션이 매번 새로 생성되어 방채팅처럼 세션 ID별로 저장할 수 없으므로
 * 브라우저 전역 설정 하나로 둔다. 기본값은 켜짐.
 */
export function isGlobalNotificationsEnabled(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(GLOBAL_NOTIFY_KEY) !== "off";
  } catch {
    return true;
  }
}

export function setGlobalNotificationsEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(GLOBAL_NOTIFY_KEY, enabled ? "on" : "off");
  } catch {
    // localStorage 접근 불가(사파리 프라이빗 모드 등) 시 조용히 무시 — 토글 UI 자체는 계속 동작한다
  }
}

/**
 * 지금 이 창/탭을 실제로 보고 있는 중인지 판단한다. document.hidden만으로는 "다른 탭으로
 * 전환/최소화"만 잡히고, 브라우저 창 자체는 열려있는데 다른 앱 창에 가려진 경우는 탭
 * 입장에서 여전히 "보이는 상태"라 놓친다(§실사용 확인 2026-08-24) — document.hasFocus()를
 * 더해 "창이 실제로 포커스를 갖고 있는지"까지 함께 봐야 이 경우도 잡힌다.
 */
function isTabInBackground(): boolean {
  if (typeof document === "undefined") return false;
  return document.hidden || !document.hasFocus();
}

/**
 * 지금 창/탭을 보고 있지 않을 때만(다른 탭 전환, 최소화, 다른 앱 창에 가려짐 등) 알림음을
 * 울린다. 보고 있는 중이면 이미 화면에 내용이 보이므로 생략한다. 브라우저/OS 알림 팝업은
 * 띄우지 않는다(§실사용 피드백 2026-08-24 — 소리만으로 충분하고 팝업은 불필요하다는 판단).
 */
export function notifyIfTabHidden() {
  if (!isTabInBackground()) return;
  playChime();
}

type JoinSignalSource = "db" | "presence";
const pendingJoinSignals = new Map<string, JoinSignalSource>();

/**
 * 방 입장은 room_members INSERT(빠름, DB 쓰기 직후 도착)와 Presence join(느림, 채널 연결+
 * track() 왕복 필요) 두 신호로 감지된다 — 새 멤버가 들어오면 둘 다 울리므로 그대로 두면
 * 중복이다. 시간 창으로 걸러내려 했더니(예: "2초 안의 join은 중복") 두 신호 사이 실제
 * 간격이 매번 달라서 창을 넉넉히 잡으면 빠른 재입장이 씹히고, 짧게 잡으면 가끔 중복이
 * 그대로 통과했다(§실사용 확인 2026-08-24). 그래서 시간 대신 "이 사람에 대해 두 신호가
 * 각각 정확히 한 번씩 왔는지"를 추적한다: 한쪽 신호가 오면 알리고 대기시켜두다가, 다른
 * 쪽 신호가 오면 그 쌍을 소비하고 상태를 지운다(중복 없이, 다음 재입장을 위해 깨끗한
 * 상태로 되돌아감) — 같은 쪽 신호가 대기 중에 또 오면(예: 재구독) 무시한다.
 */
export function claimJoinSignal(key: string, source: JoinSignalSource): boolean {
  const pending = pendingJoinSignals.get(key);

  if (pending === undefined) {
    pendingJoinSignals.set(key, source);
    return true; // 이 쌍의 첫 신호 — 알림
  }
  if (pending === source) {
    return false; // 같은 쪽 신호 중복 도착 — 무시
  }
  pendingJoinSignals.delete(key); // 쌍이 완성됨 — 다음 재입장을 위해 상태 초기화
  return false; // 이미 첫 신호에서 알렸으므로 다시 알리지 않음
}
