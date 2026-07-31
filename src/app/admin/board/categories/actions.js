"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import {
  createCategory,
  updateCategory,
  setCategoryHidden,
  deleteCategory,
  getCategoryBySlug,
} from "@/lib/board-categories";

// slug 는 URL 에 그대로 실린다(/board?board=free). 한글·공백을 허용하면 인코딩된
// 주소가 되어 읽기 어렵고, posts.board 에 문자열로 저장되므로 뒤늦게 바꾸기도 번거롭다.
const slugRule = z
  .string()
  .trim()
  .min(2, "주소값은 2자 이상입니다.")
  .max(30)
  .regex(/^[a-z0-9-]+$/, "주소값은 영소문자·숫자·- 만 사용합니다.");

const createSchema = z.object({
  slug: slugRule,
  label: z.string().trim().min(1, "이름을 입력하세요.").max(30),
  sortOrder: z.coerce.number().int().min(0).max(999),
  // member = 승인 회원과 운영자 / admin = 운영자만
  writeRole: z.enum(["member", "admin"]),
  // list = 표 목록 / card = 갤러리식 카드(첫 이미지가 썸네일)
  layout: z.enum(["list", "card"]),
  // /board 탭에 낄지. 소개 메뉴에 자기 주소가 따로 있는 게시판은 끈다.
  showInBoard: z.coerce.boolean(),
});

// 체크박스는 꺼져 있으면 formData 에 아예 없다. 그래서 "on" 유무로 읽는다.
function readForm(formData) {
  return {
    slug: formData.get("slug") ?? "",
    label: formData.get("label") ?? "",
    sortOrder: formData.get("sortOrder") || 0,
    writeRole: formData.get("writeRole") === "admin" ? "admin" : "member",
    layout: formData.get("layout") === "card" ? "card" : "list",
    showInBoard: formData.get("showInBoard") === "on",
  };
}

function revalidate() {
  revalidatePath("/admin/board/categories");
  revalidatePath("/board");
  revalidatePath("/board/write");
  // 소개 메뉴에 딸린 게시판들도 카테고리 설정을 그대로 읽는다.
  revalidatePath("/about/teaching");
  revalidatePath("/about/hyusim-tapjeon");
  revalidatePath("/about/hyusim-jirisan");
}

export async function createCategoryAction(prevState, formData) {
  await requireSession();
  const parsed = createSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  if (await getCategoryBySlug(parsed.data.slug)) {
    return { error: `주소값 '${parsed.data.slug}' 은 이미 쓰이고 있습니다.` };
  }
  try {
    await createCategory(parsed.data);
  } catch (err) {
    console.error("카테고리 생성 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  revalidate();
  return { ok: `'${parsed.data.label}' 게시판을 추가했습니다.` };
}

export async function updateCategoryAction(prevState, formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "잘못된 요청입니다." };

  const parsed = createSchema.safeParse(readForm(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값을 확인하세요." };

  const dup = await getCategoryBySlug(parsed.data.slug);
  if (dup && Number(dup.id) !== id) {
    return { error: `주소값 '${parsed.data.slug}' 은 이미 쓰이고 있습니다.` };
  }
  let res;
  try {
    res = await updateCategory(id, parsed.data);
  } catch (err) {
    console.error("카테고리 수정 실패:", err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  if (!res) return { error: "없는 게시판입니다." };
  revalidate();
  return {
    ok:
      res.movedPosts > 0
        ? `'${res.label}' 저장. 주소값이 바뀌어 글 ${res.movedPosts}건도 함께 옮겼습니다.`
        : `'${res.label}' 을 저장했습니다.`,
  };
}

export async function toggleHiddenAction(formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  const hidden = formData.get("hidden") === "true";
  if (!Number.isInteger(id) || id <= 0) return;
  try {
    await setCategoryHidden(id, hidden);
  } catch (err) {
    console.error("카테고리 숨김 변경 실패:", err);
  }
  revalidate();
}

export async function deleteCategoryAction(prevState, formData) {
  await requireSession();
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) return { error: "잘못된 요청입니다." };
  let res;
  try {
    res = await deleteCategory(id);
  } catch (err) {
    console.error("카테고리 삭제 실패:", err);
    return { error: "삭제 중 오류가 발생했습니다." };
  }
  if (!res.ok) {
    if (res.reason === "has_posts") {
      return {
        error: `'${res.label}' 에 글 ${res.count}건이 있어 삭제할 수 없습니다. 대신 '숨김' 을 쓰세요.`,
      };
    }
    return { error: "없는 게시판입니다." };
  }
  revalidate();
  return { ok: `'${res.label}' 게시판을 삭제했습니다.` };
}
