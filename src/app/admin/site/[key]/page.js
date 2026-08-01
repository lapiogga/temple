import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getSection, CONTENT_SECTIONS } from "@/lib/site-content";
import SectionForm from "../SectionForm";
import { saveSectionAction } from "../actions";
import { uploadPostImageAction } from "@/app/board/image-actions";

export const dynamic = "force-dynamic";

const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// 인삿말은 문단 배열(paragraphs)에서 리치 에디터(bodyHtml)로 바뀌었다.
// 아직 옛 값만 있는 경우 여기서 HTML 로 올려 에디터에 넣는다. 저장하면 bodyHtml 로
// 남고 paragraphs 는 사라진다 — 공개 화면은 bodyHtml 이 없을 때만 옛 값을 그린다.
// 문단은 사람이 쓴 평문이라 <, & 가 있을 수 있어 반드시 이스케이프한다.
function withGreetingHtml(initial) {
  if (initial?.bodyHtml) return initial;
  const paras = Array.isArray(initial?.paragraphs) ? initial.paragraphs : [];
  return { ...initial, bodyHtml: paras.map((p) => `<p>${esc(p)}</p>`).join("") };
}

export default async function EditSection({ params }) {
  await requireSession();
  const key = params.key;
  const meta = CONTENT_SECTIONS.find((s) => s.key === key);
  if (!meta) notFound();
  const initial = await getSection(key);

  return (
    <section>
      <h1 className="adm-h1">{meta.label} 편집</h1>
      <SectionForm
        section={key}
        initial={key === "greeting" ? withGreetingHtml(initial) : initial}
        action={saveSectionAction.bind(null, key)}
        // 본문 에디터의 이미지 업로드. 게시판 글쓰기와 같은 액션을 쓴다 —
        // 하는 일이 'public/uploads 에 저장하고 경로를 돌려준다' 뿐이고
        // 권한도 같다(운영자 통과).
        uploadAction={key === "greeting" ? uploadPostImageAction : undefined}
      />
    </section>
  );
}
