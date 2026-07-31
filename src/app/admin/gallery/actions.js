"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/session";
import {
  createAlbum, updateAlbum, removeAlbum, addPhoto, removePhoto,
} from "@/lib/gallery";
import { saveImage } from "@/lib/upload";

const albumSchema = z.object({
  title: z.string().trim().min(1, "앨범 제목을 입력하세요.").max(120),
  visibility: z.enum(["public", "member"]),
});

function readAlbum(formData) {
  return {
    title: formData.get("title") ?? "",
    visibility: formData.get("visibility") === "member" ? "member" : "public",
  };
}

export async function createAlbumAction(prevState, formData) {
  await requireSession();
  const parsed = albumSchema.safeParse(readAlbum(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  let album;
  try {
    album = await createAlbum(parsed.data);
  } catch (err) {
    console.error("createAlbum 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath("/admin/gallery");
  redirect(`/admin/gallery/${album.id}`);
}

export async function updateAlbumAction(id, prevState, formData) {
  await requireSession();
  const parsed = albumSchema.safeParse(readAlbum(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };
  }
  try {
    await updateAlbum(id, parsed.data);
  } catch (err) {
    console.error("updateAlbum 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath("/admin/gallery");
  revalidatePath(`/admin/gallery/${id}`);
  return { ok: true };
}

export async function deleteAlbumAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await removeAlbum(id);
  } catch (err) {
    console.error("removeAlbum 실패:", err);
  }
  revalidatePath("/admin/gallery");
  redirect("/admin/gallery");
}

// 여러 장을 한 번에. 파일 하나씩 올리던 흐름이 사진 수십 장에서는 감당이 안 됐다.
// 한 장이 실패해도 나머지는 올리고, 어떤 파일이 왜 실패했는지 돌려준다.
const MAX_BATCH = 15;

export async function addPhotosAction(albumId, prevState, formData) {
  await requireSession();
  const files = formData.getAll("images").filter((f) => f && typeof f.arrayBuffer === "function" && f.size > 0);
  if (files.length === 0) return { error: "사진을 선택하세요." };
  if (files.length > MAX_BATCH) {
    return { error: `한 번에 최대 ${MAX_BATCH}장까지 올릴 수 있습니다. (선택 ${files.length}장)` };
  }
  // 파일 순서와 같은 순서로 온 설명. 비어 있으면 null.
  const captions = formData.getAll("captions").map((c) => (c ?? "").toString().trim() || null);

  let added = 0;
  const failed = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const imageUrl = await saveImage(files[i]);
      await addPhoto(albumId, { imageUrl, caption: captions[i] ?? null });
      added++;
    } catch (err) {
      // saveImage 는 형식·용량 위반을 사용자용 문구로 throw 한다.
      failed.push(`${files[i].name || "이름없음"}: ${err?.message ?? "실패"}`);
    }
  }
  revalidatePath(`/admin/gallery/${albumId}`);
  revalidatePath("/admin/gallery");
  revalidatePath(`/gallery/${albumId}`);
  if (added === 0) return { error: `모두 실패했습니다. ${failed.join(" / ")}` };
  return failed.length
    ? { ok: true, added, warn: `${added}장 등록. 실패 ${failed.length}장 — ${failed.join(" / ")}` }
    : { ok: true, added };
}

export async function deletePhotoAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const albumId = Number(formData.get("albumId"));
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await removePhoto(id);
  } catch (err) {
    console.error("removePhoto 실패:", err);
  }
  if (Number.isInteger(albumId) && albumId > 0) {
    revalidatePath(`/admin/gallery/${albumId}`);
  }
}
