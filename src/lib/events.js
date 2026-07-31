import { query } from "@/lib/db";

// 법회/행사(events) 데이터 접근 레이어. 파라미터화 쿼리만 사용.
const COLS =
  "id, kind, title, when_text, starts_at, recurrence, recurrence_until, description, sort_order, created_at";

// 특정 월(로컬 기준)에 날짜가 박힌 일회성 일정.
// 반복 일정(recurrence 있음)은 여기서 빼고 listRecurring() 이 따로 준다 —
// 반복은 starts_at 이 '첫 회' 날짜라 그 달에만 걸리기 때문이다.
export async function listEventsInMonth(year, month) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const { rows } = await query(
    `SELECT ${COLS} FROM events
      WHERE recurrence IS NULL AND starts_at >= $1 AND starts_at < $2
      ORDER BY starts_at ASC`,
    [from, to]
  );
  return rows;
}

// 반복 일정 전부(법회·행사 구분 없이). 달력이 매 칸마다 규칙을 맞춰 본다.
// 언제부터 언제까지인지는 starts_at ~ recurrence_until 이 정한다.
export async function listRecurring() {
  const { rows } = await query(
    `SELECT ${COLS} FROM events
      WHERE recurrence IS NOT NULL
      ORDER BY sort_order ASC, id ASC`
  );
  return rows;
}

// 정기 법회(반복, 날짜 없이 표시용 when_text).
export async function listRegular() {
  const { rows } = await query(
    `SELECT ${COLS} FROM events
      WHERE kind = 'regular'
      ORDER BY sort_order ASC, id ASC`
  );
  return rows;
}

// 전체(목록 뷰). 날짜 있는 행사 우선.
export async function listAllEvents() {
  const { rows } = await query(
    `SELECT ${COLS} FROM events
      ORDER BY (starts_at IS NULL), starts_at ASC, sort_order ASC, id ASC`
  );
  return rows;
}

export async function getEvent(id) {
  const { rows } = await query(`SELECT ${COLS} FROM events WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

// ── 관리자용 ──────────────────────────────────────────────
export async function createEvent(d) {
  const { kind, title, whenText, startsAt, recurrence, recurrenceUntil, description, sortOrder } = d;
  const { rows } = await query(
    `INSERT INTO events (kind, title, when_text, starts_at, recurrence, recurrence_until, description, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    [kind, title, whenText, startsAt, recurrence, recurrenceUntil, description, sortOrder]
  );
  return rows[0];
}

export async function updateEvent(id, d) {
  const { kind, title, whenText, startsAt, recurrence, recurrenceUntil, description, sortOrder } = d;
  await query(
    `UPDATE events
       SET kind = $2, title = $3, when_text = $4, starts_at = $5,
           recurrence = $6, recurrence_until = $7, description = $8, sort_order = $9
     WHERE id = $1`,
    [id, kind, title, whenText, startsAt, recurrence, recurrenceUntil, description, sortOrder]
  );
}

export async function removeEvent(id) {
  await query("DELETE FROM events WHERE id = $1", [id]);
}

// ── 행사 첨부파일 ─────────────────────────────────────────
export async function listAttachments(eventId) {
  const { rows } = await query(
    `SELECT id, event_id, file_url, filename, mime, size, sort_order
       FROM event_attachments WHERE event_id = $1 ORDER BY sort_order, id`,
    [eventId]
  );
  return rows;
}

export async function addAttachment(eventId, { fileUrl, filename, mime = null, size = null, sortOrder = 0 }) {
  const { rows } = await query(
    `INSERT INTO event_attachments (event_id, file_url, filename, mime, size, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [eventId, fileUrl, filename, mime, size, sortOrder]
  );
  return rows[0];
}

export async function removeAttachment(id) {
  await query("DELETE FROM event_attachments WHERE id = $1", [id]);
}
