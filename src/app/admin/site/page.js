import Link from "next/link";
import { requireSession } from "@/lib/session";
import { CONTENT_SECTIONS } from "@/lib/site-content";

export default async function AdminSite() {
  await requireSession();
  return (
    <section>
      <h1 className="adm-h1">홈페이지 콘텐츠</h1>
      <p style={{ color: "var(--ink-soft)", fontSize: "14.5px", marginBottom: "18px" }}>
        홈페이지 각 영역의 문구·이미지를 수정합니다. 저장하면 공개 화면에 바로 반영됩니다.
      </p>
      <div className="site-cards">
        {CONTENT_SECTIONS.map((s) => (
          <Link key={s.key} className="site-card" href={`/admin/site/${s.key}`}>
            <span className="site-card-l">{s.label}</span>
            <span className="site-card-go">편집 →</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
