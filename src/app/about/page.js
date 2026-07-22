import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import Reveal from "@/components/Reveal";
import { DancheongDefs, DancheongRule } from "@/components/Icons";
import { SITE } from "@/content/site";
import { GREETING, HISTORY, SANSINDO, GUIDE_MAP } from "@/content/about";

export const metadata = { title: `사찰 소개 | ${SITE.name}` };

export default function AboutPage() {
  return (
    <>
      <DancheongDefs />
      <Reveal />
      <SiteHeader />
      <DancheongRule height={12} />

      {/* 주지 스님 인사말 */}
      <section className="blk" id="greeting">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">Greeting</div><h2>주지 스님 인사말</h2></div>
          </div>
          <div className="about-greeting reveal">
            {GREETING.isDraft && (
              <p className="draft-badge">※ 초안입니다 — 주지 스님 인사말 원문으로 교체 예정입니다.</p>
            )}
            {GREETING.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            <p className="sign">{GREETING.sign}</p>
          </div>
        </div>
      </section>

      {/* 응선사 연혁 */}
      <section className="blk bg-soft" id="history">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">History</div><h2>응선사 연혁</h2></div>
          </div>
          <div className="timeline">
            {HISTORY.map((h) => (
              <div className="tnode reveal" key={h.yr}>
                <div className="yr">{h.yr}</div>
                <h4>{h.title}</h4>
                <p>{h.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 대웅전 산신도 */}
      <section className="blk" id="sansindo">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">Treasure</div><h2>대웅전 산신도</h2></div>
          </div>
          <div className="about-treasure">
            <div className="reveal">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="treasure-img" src={SANSINDO.image} alt="응선사 대웅전 산신도" />
            </div>
            <div className="reveal">
              <div className="badge2">{SANSINDO.heritage} · {SANSINDO.year}</div>
              <p style={{ lineHeight: 1.9, fontSize: "16.5px", color: "var(--ink)" }}>
                {SANSINDO.summary}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 사찰 안내도 */}
      <section className="blk bg-soft" id="guide">
        <div className="wrap">
          <div className="sec-head reveal">
            <div><div className="ki">Guide</div><h2>사찰 안내도</h2></div>
            <Link className="more" href="/#visit">오시는 길 →</Link>
          </div>
          <figure className="guide-map reveal">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={GUIDE_MAP.image} alt={GUIDE_MAP.caption} />
            <figcaption>{GUIDE_MAP.caption}</figcaption>
          </figure>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
