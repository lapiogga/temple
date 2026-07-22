"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { setSection } from "@/lib/site-content";

const str = (v) => (v ?? "").toString().trim();
// 줄 단위(빈 줄 제외)
const lines = (v) => str(v).split("\n").map((s) => s.trim()).filter(Boolean);
// 빈 줄로 구분된 문단
const paras = (v) => str(v).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean);

export async function saveSectionAction(key, prevState, formData) {
  await requireSession();
  let value;
  try {
    if (key === "hero") {
      value = {
        eyebrow: str(formData.get("eyebrow")),
        title: str(formData.get("title")),
        lede: str(formData.get("lede")),
        images: lines(formData.get("images")),
      };
    } else if (key === "greeting") {
      value = {
        isDraft: formData.get("isDraft") === "on",
        paragraphs: paras(formData.get("paragraphs")),
        sign: str(formData.get("sign")),
      };
    } else if (key === "history") {
      value = lines(formData.get("entries")).map((l) => {
        const [yr, title, desc] = l.split("|").map((s) => (s || "").trim());
        return { yr: yr || "", title: title || "", desc: desc || "" };
      });
    } else if (key === "sansindo") {
      value = {
        heritage: str(formData.get("heritage")),
        year: str(formData.get("year")),
        summary: str(formData.get("summary")),
        detail: paras(formData.get("detail")),
      };
    } else if (key === "visit") {
      const bank = str(formData.get("bank"));
      const account = str(formData.get("account"));
      const holder = str(formData.get("holder"));
      value = {
        addressFull: str(formData.get("addressFull")),
        transit: str(formData.get("transit")) || null,
        parking: str(formData.get("parking")) || null,
        mapUrl: str(formData.get("mapUrl")),
        donation: bank || account || holder ? { bank, account, holder } : null,
      };
    } else {
      return { error: "알 수 없는 섹션입니다." };
    }
    await setSection(key, value);
  } catch (err) {
    console.error("saveSection 실패:", key, err);
    return { error: "저장 중 오류가 발생했습니다." };
  }
  // 공개 페이지 갱신
  ["/", "/about/greeting", "/about/history", "/about/sansindo", "/visit"].forEach((p) => revalidatePath(p));
  return { ok: true };
}
