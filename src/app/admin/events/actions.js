"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  createEvent, updateEvent, removeEvent, addAttachment, removeAttachment,
} from "@/lib/events";
import { saveAttachment } from "@/lib/upload";

const eventSchema = z.object({
  kind: z.enum(["regular", "event"]),
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  whenText: z.string().trim().max(120),
  startsAt: z.string().trim().max(40),
  recurrence: z.string().trim().max(40),
  recurrenceUntil: z.string().trim().max(10),
  description: z.string().trim().max(5000),
  sortOrder: z.coerce.number().int().min(0).max(9999),
});

function readForm(formData) {
  return {
    kind: formData.get("kind") === "regular" ? "regular" : "event",
    title: formData.get("title") ?? "",
    whenText: formData.get("whenText") ?? "",
    startsAt: formData.get("startsAt") ?? "",
    recurrence: formData.get("recurrence") ?? "",
    recurrenceUntil: formData.get("recurrenceUntil") ?? "",
    description: formData.get("description") ?? "",
    sortOrder: formData.get("sortOrder") ?? "0",
  };
}

function toRecord(d) {
  return {
    kind: d.kind,
    title: d.title,
    whenText: d.whenText === "" ? null : d.whenText,
    startsAt: d.startsAt === "" ? null : new Date(d.startsAt),
    recurrence: d.recurrence === "" ? null : d.recurrence,
    recurrenceUntil: d.recurrenceUntil === "" ? null : d.recurrenceUntil,
    description: d.description === "" ? null : d.description,
    sortOrder: d.sortOrder,
  };
}

// 반복 종료일 유효성.
// 최대 2년으로 잡는 이유 — 신규는 시작일 + 1년까지지만 수정 화면에서 '1년 연장'
// 을 한 번 더 할 수 있게 했다. 화면 제한은 우회할 수 있으므로 서버가 상한을 쥔다.
// 기준일은 시작일, 시작일이 없으면 오늘이다.
const RECUR_MAX_YEARS = 2;
function validUntil(d) {
  const raw = d.recurrenceUntil;
  if (raw === "") return { ok: true };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return { ok: false, msg: "종료일 형식이 올바르지 않습니다." };
  if (d.recurrence === "") return { ok: false, msg: "반복 일정이 아니면 종료일을 둘 수 없습니다." };

  const [Y, M, D] = raw.split("-").map(Number);
  const until = new Date(Y, M - 1, D);
  if (until.getFullYear() !== Y || until.getMonth() !== M - 1 || until.getDate() !== D) {
    return { ok: false, msg: "종료일이 실제로 없는 날짜입니다." };
  }

  const base = d.startsAt ? new Date(d.startsAt) : new Date();
  if (Number.isNaN(base.getTime())) return { ok: false, msg: "시작일이 올바르지 않습니다." };
  const baseDay = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  if (until < baseDay) return { ok: false, msg: "종료일이 시작일보다 앞설 수 없습니다." };

  const cap = new Date(baseDay.getFullYear() + RECUR_MAX_YEARS, baseDay.getMonth(), baseDay.getDate());
  if (until > cap) {
    return { ok: false, msg: `종료일은 시작일로부터 ${RECUR_MAX_YEARS}년 이내여야 합니다.` };
  }
  return { ok: true };
}

// startsAt 유효성(빈 값 허용, 값이 있으면 유효한 날짜여야).
function validDate(rec, raw) {
  if (raw === "") return true;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(raw)) return false;
  const d = rec.startsAt;
  if (!d || Number.isNaN(d.getTime())) return false;
  // 라운드트립: 2/30 → 3/2 같은 오버플로 정규화 차단
  const p = (n) => String(n).padStart(2, "0");
  const rt = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
  return rt === raw;
}

export async function createEventAction(prevState, formData) {
  await requireSession();
  const parsed = eventSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  const rec = toRecord(parsed.data);
  if (!validDate(rec, parsed.data.startsAt)) {
    return { error: "행사 일시 형식이 올바르지 않습니다." };
  }
  const until = validUntil(parsed.data);
  if (!until.ok) return { error: until.msg };
  try {
    await createEvent(rec);
  } catch (err) {
    console.error("createEvent 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect("/admin/events");
}

export async function updateEventAction(id, prevState, formData) {
  await requireSession();
  const parsed = eventSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  const rec = toRecord(parsed.data);
  if (!validDate(rec, parsed.data.startsAt)) {
    return { error: "행사 일시 형식이 올바르지 않습니다." };
  }
  const until = validUntil(parsed.data);
  if (!until.ok) return { error: until.msg };
  try {
    await updateEvent(id, rec);
  } catch (err) {
    console.error("updateEvent 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
  redirect("/admin/events");
}

export async function deleteEventAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await removeEvent(id);
  } catch (err) {
    console.error("removeEvent 실패:", err);
  }
  revalidatePath("/admin/events");
  revalidatePath("/events");
}

export async function addAttachmentAction(eventId, prevState, formData) {
  await requireSession();
  let saved;
  try {
    saved = await saveAttachment(formData.get("file"));
  } catch (err) {
    return { error: err.message || "첨부 업로드에 실패했습니다." };
  }
  try {
    await addAttachment(eventId, {
      fileUrl: saved.url,
      filename: saved.filename,
      mime: saved.mime,
      size: saved.size,
    });
  } catch (err) {
    console.error("addAttachment 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath(`/admin/events/${eventId}/edit`);
  revalidatePath(`/events/${eventId}`);
  return { ok: true };
}

export async function deleteAttachmentAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const eventId = Number(formData.get("eventId"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await removeAttachment(id);
  } catch (err) {
    console.error("removeAttachment 실패:", err);
  }
  if (Number.isInteger(eventId) && eventId > 0) {
    revalidatePath(`/admin/events/${eventId}/edit`);
    revalidatePath(`/events/${eventId}`);
  }
}
