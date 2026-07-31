import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { GUIDE_MAP } from "@/content/about";

export const metadata = { title: `사찰 안내도 | ${SITE.name}` };

export default function GuidePage() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap">
          <PageHead title="사찰 안내도" ki="Guide" back={{ href: "/", label: "홈으로" }}>
            <Link className="more" href="/visit">오시는 길 →</Link>
          </PageHead>
          <figure className="guide-map">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GUIDE_MAP.image} alt={GUIDE_MAP.caption} />
            <figcaption>{GUIDE_MAP.caption}</figcaption>
          </figure>
          <p className="note-small" style={{ textAlign: "center", marginTop: "12px" }}>
            ※ 절 배치도는 준비 중이며, 현재는 위치 안내도로 대신 표시하고 있습니다.
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
