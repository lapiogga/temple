"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { setSection } from "@/lib/site-content";
import { saveImage } from "@/lib/upload";

// 화면 쪽 제한(SectionForm 의 maxLength, HeroImages 의 MAX)과 같은 값.
// 브라우저 제한은 우회할 수 있으므로 서버에서도 자른다.
const HERO_EYEBROW_MAX = 50;
const HERO_LEDE_MAX = 250;
const HERO_MAX_IMAGES = 10;

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
      // 남길 기존 이미지(순서대로) + 이번에 새로 올린 파일.
      // 목록과 문구를 한 번의 저장으로 묶는다 — 업로드를 따로 실행하면 중간에
      // 폼을 벗어났을 때 이미지와 문구가 서로 다른 시점의 상태로 남는다.
      const kept = formData.getAll("images").map(str).filter((u) => u.startsWith("/uploads/") || u.startsWith("/"));
      const files = formData
        .getAll("newImages")
        .filter((f) => f && typeof f.arrayBuffer === "function" && f.size > 0);
      if (kept.length + files.length > HERO_MAX_IMAGES) {
        return { error: `배경 이미지는 최대 ${HERO_MAX_IMAGES}장까지 등록할 수 있습니다.` };
      }
      const added = [];
      for (const f of files) added.push(await saveImage(f));
      value = {
        eyebrow: str(formData.get("eyebrow")).slice(0, HERO_EYEBROW_MAX),
        title: str(formData.get("title")).slice(0, 80),
        lede: str(formData.get("lede")).slice(0, HERO_LEDE_MAX),
        images: [...kept, ...added],
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
