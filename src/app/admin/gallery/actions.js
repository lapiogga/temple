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

export async function addPhotoAction(albumId, prevState, formData) {
  await requireSession();
  const caption = (formData.get("caption") ?? "").toString().trim() || null;
  let imageUrl;
  try {
    imageUrl = await saveImage(formData.get("image"));
  } catch (err) {
    return { error: err.message || "이미지 업로드에 실패했습니다." };
  }
  try {
    await addPhoto(albumId, { imageUrl, caption });
  } catch (err) {
    console.error("addPhoto 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidatePath(`/admin/gallery/${albumId}`);
  revalidatePath("/admin/gallery");
  return { ok: true };
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
