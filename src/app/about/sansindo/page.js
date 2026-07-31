import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { SANSINDO } from "@/content/about";
import { getSection } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const metadata = { title: `대웅전 산신도 | ${SITE.name}` };

export default async function SansindoPage() {
  const s = await getSection("sansindo");
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top tight">
        <div className="wrap">
          <PageHead title="대웅전 산신도" ki="Treasure" back={{ href: "/", label: "홈으로" }} />
          <div className="about-treasure">
            <figure className="treasure-fig">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="treasure-img" src={SANSINDO.image} alt="응선사 대웅전 산신도" />
              <figcaption className="badge2">{s.heritage} · {s.year}</figcaption>
            </figure>
            <div className="treasure-text">
              <p className="treasure-summary">{s.summary}</p>
              {s.detail && s.detail.length > 0 && (
                <div className="treasure-detail">
                  {s.detail.map((p, i) => (
                    <p key={i}>{p}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
