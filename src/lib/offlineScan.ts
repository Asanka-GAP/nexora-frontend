const TODAY_CACHE_KEY = "nexora_scanned_today";
const OFFLINE_QUEUE_KEY = "nexora_offline_queue";

interface QueuedScan {
  studentCode: string;
  classId: string;
  scannedAt: string;
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// --- Today's marked cache (persisted) ---

export function loadTodayCache(): Set<string> {
  try {
    const raw = localStorage.getItem(TODAY_CACHE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (parsed.date !== todayStr()) {
      localStorage.removeItem(TODAY_CACHE_KEY);
      return new Set();
    }
    return new Set(parsed.keys as string[]);
  } catch {
    return new Set();
  }
}

export function saveTodayCache(cache: Set<string>): void {
  localStorage.setItem(TODAY_CACHE_KEY, JSON.stringify({ date: todayStr(), keys: Array.from(cache) }));
}

// --- Offline queue ---

export function getOfflineQueue(): QueuedScan[] {
  try {
    const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToOfflineQueue(scan: QueuedScan): void {
  const queue = getOfflineQueue();
  queue.push(scan);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}

export function clearOfflineQueue(): void {
  localStorage.removeItem(OFFLINE_QUEUE_KEY);
}

export function removeFromOfflineQueue(index: number): void {
  const queue = getOfflineQueue();
  queue.splice(index, 1);
  localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
}
