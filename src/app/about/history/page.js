import SiteHeader from "@/components/SiteHeader";
import PageHead from "@/components/PageHead";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { getSection } from "@/lib/site-content";

export const dynamic = "force-dynamic";
export const metadata = { title: `응선사 연혁 | ${SITE.name}` };

export default async function HistoryPage() {
  const history = await getSection("history");
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap">
          <PageHead title="응선사 연혁" ki="History" back={{ href: "/", label: "홈으로" }} />
          <div className="timeline screen-scroll">
            {(Array.isArray(history) ? history : []).map((h, i) => (
              <div className="tnode" key={`${h.yr}-${i}`}>
                <div className="yr">{h.yr}</div>
                <h4>{h.title}</h4>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
