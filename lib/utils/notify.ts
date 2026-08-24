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

const recentNotifyKeys = new Map<string, number>();
const NOTIFY_DEDUP_WINDOW_MS = 5000;

/**
 * 방 입장은 room_members INSERT(빠름, DB 쓰기 직후 도착)와 Presence join(느림, 채널 연결+
 * track() 왕복 필요) 두 신호로 동시에 감지된다 — 새 멤버가 들어오면 둘 다 울리므로, 느린
 * 쪽만 남기면 알림이 늦어지고 둘 다 울리면 중복된다. 그래서 "같은 대상에 대해 먼저 도착한
 * 신호가 우선"하도록 하되 중복은 걸러낸다: 이 함수를 호출한 쪽이 먼저면 true(알림 진행),
 * 이미 다른 신호가 같은 key로 최근에 처리했으면 false(건너뜀)를 반환한다.
 */
export function claimNotifyOnce(key: string): boolean {
  const now = Date.now();
  for (const [k, t] of recentNotifyKeys) {
    if (now - t > NOTIFY_DEDUP_WINDOW_MS) recentNotifyKeys.delete(k);
  }
  if (recentNotifyKeys.has(key)) return false;
  recentNotifyKeys.set(key, now);
  return true;
}
