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
import { saveImage, deleteUpload } from "@/lib/upload";

// 대표 이미지 주소로 허용하는 것
//
//  · 빈 값
//  · 이 사이트에 올린 파일 — /uploads/<파일명>
//  · 외부 https URL
//
// 예전에는 https 절대 URL 만 통과했다(new URL(v) 이 상대경로에서 throw 한다).
// 그런데 종무소가 파일을 올릴 방법 자체가 없어서, 커버를 넣으려면 이미지를 다른
// https 어딘가에 먼저 올려 두고 그 주소를 적어야 했다. 사실상 쓸 수 없는 칸이었다.
// 이제 폼에서 직접 올리므로 /uploads/ 경로가 정상 입력값이 된다 — 그것을 막고 있으면
// 올린 뒤에 저장이 실패한다. 콘텐츠 이관도 이 형태로 들어온다.
//
// 느슨하게 풀지는 않는다. 상대경로는 업로드 디렉터리의 파일명 모양만 받는다 —
// "//evil.com/x.png"(프로토콜 상대) 나 "../.." 는 이 정규식을 통과하지 못한다.
const UPLOAD_PATH = /^\/uploads\/[A-Za-z0-9._-]+$/;

function isAllowedCover(v) {
  if (v === "") return true;
  if (UPLOAD_PATH.test(v)) return true;
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
    .refine(isAllowedCover, "대표 이미지는 직접 올린 파일이거나 https:// 주소여야 합니다."),
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

// 새로 고른 파일이 있으면 저장하고 그 경로를 커버로 쓴다.
// 없으면 폼이 들고 있던 coverUrl(기존 값 또는 빈 값)을 그대로 쓴다.
//
// 실패하면 사유를 그대로 돌려준다. "저장 중 오류" 로 뭉개면 어느 파일이 왜 걸렸는지
// 알 수 없다(같은 릴리스의 히어로·갤러리도 이 방식으로 맞춰 두었다).
async function resolveCover(formData, fallbackUrl) {
  const file = formData.get("coverFile");
  if (!file || typeof file.arrayBuffer !== "function" || file.size === 0) {
    return { url: fallbackUrl };
  }
  try {
    return { url: await saveImage(file), uploaded: true };
  } catch (err) {
    return { error: `대표 이미지: ${err?.message ?? "저장에 실패했습니다."}` };
  }
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
  const cover = await resolveCover(formData, record.coverUrl);
  if (cover.error) return { error: cover.error };
  record.coverUrl = cover.url === "" ? null : cover.url;

  try {
    await createNotice(record);
  } catch (err) {
    console.error("createNotice 실패:", err);
    // 글이 안 만들어졌으면 방금 올린 파일은 아무도 참조하지 않는다. 남기지 않는다.
    if (cover.uploaded) await deleteUpload(cover.url).catch(() => {});
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
  const cover = await resolveCover(formData, record.coverUrl);
  if (cover.error) return { error: cover.error };
  record.coverUrl = cover.url === "" ? null : cover.url;

  try {
    await updateNotice(id, record);
  } catch (err) {
    console.error("updateNotice 실패:", err);
    if (cover.uploaded) await deleteUpload(cover.url).catch(() => {});
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
