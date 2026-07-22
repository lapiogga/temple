import { query } from "@/lib/db";

// 법회/행사(events) 데이터 접근 레이어. 파라미터화 쿼리만 사용.
const COLS =
  "id, kind, title, when_text, starts_at, recurrence, description, sort_order";

// 특정 월(로컬 기준)에 날짜(starts_at)가 있는 행사.
export async function listEventsInMonth(year, month) {
  const from = new Date(year, month - 1, 1);
  const to = new Date(year, month, 1);
  const { rows } = await query(
    `SELECT ${COLS} FROM events
      WHERE kind = 'event' AND starts_at >= $1 AND starts_at < $2
      ORDER BY starts_at ASC`,
    [from, to]
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
  const { kind, title, whenText, startsAt, recurrence, description, sortOrder } = d;
  const { rows } = await query(
    `INSERT INTO events (kind, title, when_text, starts_at, recurrence, description, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [kind, title, whenText, startsAt, recurrence, description, sortOrder]
  );
  return rows[0];
}

export async function updateEvent(id, d) {
  const { kind, title, whenText, startsAt, recurrence, description, sortOrder } = d;
  await query(
    `UPDATE events
       SET kind = $2, title = $3, when_text = $4, starts_at = $5,
           recurrence = $6, description = $7, sort_order = $8
     WHERE id = $1`,
    [id, kind, title, whenText, startsAt, recurrence, description, sortOrder]
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
