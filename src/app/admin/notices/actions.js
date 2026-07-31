"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  createNotice,
  updateNotice,
  removeNotice,
  setPublished,
} from "@/lib/notices";
import { sanitizeHtml, stripTags } from "@/lib/sanitize";

// 빈 값 또는 https URL 만 허용(javascript: 등 스킴 차단)
function isBlankOrHttpsUrl(v) {
  if (v === "") return true;
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}

const noticeSchema = z.object({
  title: z.string().trim().min(1, "제목을 입력하세요.").max(200),
  body: z.string().max(60000),
  coverUrl: z
    .string()
    .trim()
    .max(500)
    .refine(isBlankOrHttpsUrl, "대표 이미지는 https:// URL 만 가능합니다."),
  isPinned: z.boolean(),
  published: z.boolean(),
});

function readForm(formData) {
  return {
    title: formData.get("title") ?? "",
    body: formData.get("body") ?? "",
    coverUrl: formData.get("coverUrl") ?? "",
    isPinned: formData.get("isPinned") === "on",
    published: formData.get("published") === "on",
  };
}

// zod 결과 → DB 레코드(빈 coverUrl 은 null). visibility 는 1차 'public' 고정(스키마 기본값).
function toRecord(data) {
  return {
    // 공지사항으로 통일했다. 컬럼은 남겨 두되 값은 하나만 쓴다.
    category: "notice",
    title: data.title,
    body: sanitizeHtml(data.body),
    coverUrl: data.coverUrl === "" ? null : data.coverUrl,
    isPinned: data.isPinned,
    published: data.published,
  };
}

function parseId(formData) {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function createNoticeAction(prevState, formData) {
  await requireSession();
  const parsed = noticeSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  const record = toRecord(parsed.data);
  if (stripTags(record.body).length < 1) {
    return { error: "본문을 입력하세요." };
  }
  try {
    await createNotice(record);
  } catch (err) {
    console.error("createNotice 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}

export async function updateNoticeAction(id, prevState, formData) {
  await requireSession();
  const parsed = noticeSchema.safeParse(readForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  const record = toRecord(parsed.data);
  if (stripTags(record.body).length < 1) {
    return { error: "본문을 입력하세요." };
  }
  try {
    await updateNotice(id, record);
  } catch (err) {
    console.error("updateNotice 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath("/admin/notices");
  redirect("/admin/notices");
}

export async function deleteNoticeAction(formData) {
  await requireSession();
  const id = parseId(formData);
  if (!id) return;
  try {
    await removeNotice(id);
  } catch (err) {
    console.error("removeNotice 실패:", err);
  }
  revalidatePath("/admin/notices");
}

export async function togglePublishAction(formData) {
  await requireSession();
  const id = parseId(formData);
  if (!id) return;
  const next = formData.get("next") === "true";
  try {
    await setPublished(id, next);
  } catch (err) {
    console.error("setPublished 실패:", err);
  }
  revalidatePath("/admin/notices");
}
