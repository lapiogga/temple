"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { setSection } from "@/lib/site-content";
import { saveImage, deleteUpload } from "@/lib/upload";
import { sanitizeHtml, stripTags } from "@/lib/sanitize";
import { GIVING_PROVIDERS } from "@/content/giving";

// 화면 쪽 제한(SectionForm 의 maxLength, HeroImages 의 MAX)과 같은 값.
// 브라우저 제한은 우회할 수 있으므로 서버에서도 자른다.
const HERO_EYEBROW_MAX = 50;
const HERO_LEDE_MAX = 250;
const HERO_MAX_IMAGES = 10;
const GIVING_URL_MAX = 400;

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
      // `u.startsWith("/uploads/") || u.startsWith("/")` 는 뒤쪽이 앞쪽을 삼켜
      // 사실상 "/로 시작하면 통과" 였다. 그러면 "//evil.com/x.png"(프로토콜 상대 URL)
      // 나 "/../.." 가 그대로 저장돼 히어로 배경으로 렌더된다. 업로드 경로 모양만 받는다.
      const kept = formData.getAll("images").map(str).filter((u) => /^\/uploads\/[A-Za-z0-9._-]+$/.test(u));
      const files = formData
        .getAll("newImages")
        .filter((f) => f && typeof f.arrayBuffer === "function" && f.size > 0);
      if (kept.length + files.length > HERO_MAX_IMAGES) {
        return { error: `배경 이미지는 최대 ${HERO_MAX_IMAGES}장까지 등록할 수 있습니다.` };
      }
      // 업로드가 통째로 실패하면 안 되는 이유가 두 가지다.
      //  · 이미지·문구가 한 폼이라, 파일 한 장 때문에 예외가 나면 setSection 에
      //    도달하지 못해 같은 제출의 문구 수정까지 함께 사라진다.
      //  · 실패 앞에서 이미 디스크에 쓴 파일은 아무도 참조하지 않는 고아로 남는다.
      // 그래서 파일마다 받아 사유를 모으고, 하나라도 실패하면 그때까지 쓴 것을 지운다.
      // 갤러리 일괄 업로드(admin/gallery/actions.js)가 이미 같은 방식이다.
      const added = [];
      const failed = [];
      for (const f of files) {
        try {
          added.push(await saveImage(f));
        } catch (err) {
          failed.push(`${f.name || "이름없음"}: ${err?.message ?? "실패"}`);
        }
      }
      if (failed.length) {
        await Promise.all(added.map((u) => deleteUpload(u).catch(() => {})));
        return { error: `이미지를 저장하지 못했습니다. ${failed.join(" / ")}` };
      }
      value = {
        eyebrow: str(formData.get("eyebrow")).slice(0, HERO_EYEBROW_MAX),
        title: str(formData.get("title")).slice(0, 80),
        lede: str(formData.get("lede")).slice(0, HERO_LEDE_MAX),
        images: [...kept, ...added],
      };
    } else if (key === "greeting") {
      // 리치 에디터가 보낸 HTML. 공개 화면이 dangerouslySetInnerHTML 로 그리므로
      // 게시판 본문과 똑같이 allowlist 정화를 거친 것만 저장한다.
      const bodyHtml = sanitizeHtml(str(formData.get("bodyHtml")));
      if (stripTags(bodyHtml).length < 1) return { error: "인삿말을 입력하세요." };
      // paragraphs 는 더 넘기지 않는다 — 두 벌을 남기면 어느 쪽이 참인지 알 수 없다.
      // 공개 화면은 bodyHtml 이 없을 때만 옛 paragraphs 를 그린다(하위호환).
      value = {
        isDraft: formData.get("isDraft") === "on",
        bodyHtml,
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
      // 디지털 시주 주소. 이 값은 공개 화면에서 QR 로 그려지고 그대로 href 가 되므로
      // 아무 문자열이나 받으면 안 된다 — `javascript:` 하나가 들어가면 그 자체로 구멍이다.
      // https 만 받는다. 간편송금 주소는 모두 https 이고, http 를 허용하면 QR 이
      // 가로챌 수 있는 주소를 실어 나르는 꼴이 된다. 후원 도관이라 더욱 그렇다.
      // 틀린 것을 조용히 버리지 않고 어느 창구인지 짚어 돌려준다 — 오타 한 글자 때문에
      // 저장은 됐는데 화면에 안 나오면 관리자가 원인을 찾을 길이 없다.
      const giving = {};
      const badGiving = [];
      for (const p of GIVING_PROVIDERS) {
        const raw = str(formData.get(`giving_${p.key}`)).slice(0, GIVING_URL_MAX);
        if (!raw) continue;
        let ok = false;
        try {
          ok = new URL(raw).protocol === "https:";
        } catch {
          ok = false;
        }
        if (ok) giving[p.key] = raw;
        else badGiving.push(p.label);
      }
      if (badGiving.length) {
        return {
          error: `${badGiving.join(" · ")} 송금 주소가 올바르지 않습니다. https:// 로 시작하는 주소를 넣어 주세요.`,
        };
      }
      value = {
        addressFull: str(formData.get("addressFull")),
        transit: str(formData.get("transit")) || null,
        parking: str(formData.get("parking")) || null,
        mapUrl: str(formData.get("mapUrl")),
        donation: bank || account || holder ? { bank, account, holder } : null,
        giving,
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
