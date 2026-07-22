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
    description: d.description === "" ? null : d.description,
    sortOrder: d.sortOrder,
  };
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
