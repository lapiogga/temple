"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { removePost } from "@/lib/posts";
import { getCategoryById, updateCategory } from "@/lib/board-categories";

// 소개 게시판은 게시판 카테고리와 달리 운영자가 주소값을 바꿀 일이 거의 없다
// (주소가 대메뉴와 /about 경로에 묶여 있다). 그래서 여기서는 이름·형식만 고친다.
const settingsSchema = z.object({
  label: z.string().trim().min(1, "이름을 입력하세요.").max(30),
  layout: z.enum(["list", "card"]),
});

function revalidate(slug) {
  revalidatePath("/admin/intro");
  revalidatePath(`/admin/intro/${slug}`);
  revalidatePath(`/about/${slug}`);
}

export async function updateIntroSettingsAction(prevState, formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "잘못된 요청입니다." };

  const cat = await getCategoryById(id);
  if (!cat || cat.group_key !== "intro") return { error: "없는 게시판입니다." };

  const parsed = settingsSchema.safeParse({
    label: formData.get("label") ?? "",
    layout: formData.get("layout") === "card" ? "card" : "list",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  try {
    // slug·순서·노출·권한은 그대로 두고 이름과 형식만 바꾼다.
    await updateCategory(id, {
      slug: cat.slug,
      label: parsed.data.label,
      sortOrder: cat.sort_order,
      writeRole: cat.write_role,
      layout: parsed.data.layout,
      showInBoard: cat.show_in_board,
    });
  } catch (err) {
    console.error("소개 게시판 설정 저장 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidate(cat.slug);
  return { ok: "저장되었습니다." };
}

export async function deleteIntroPostAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const slug = String(formData.get("slug") ?? "");
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    // 글에 딸린 이미지 파일까지 함께 정리된다(lib/posts.js).
    await removePost(id);
  } catch (err) {
    console.error("글 삭제 실패:", err);
  }
  revalidate(slug);
}
