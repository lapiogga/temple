import Link from "next/link";
import PageHead from "@/components/PageHead";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";

export const metadata = { title: `이메일 무단수집 거부 | ${SITE.name}` };

export default function EmailPolicy() {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />

      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "760px" }}>
          <PageHead title="이메일 무단수집 거부" ki="Notice" back={{ href: "/", label: "홈으로" }} />
          <div className="legal-doc">
            <p>
              본 웹사이트에 게시된 이메일 주소가 전자우편 수집 프로그램이나 그 밖의
              기술적 장치를 이용하여 무단으로 수집되는 것을 거부하며, 이를 위반 시
              「정보통신망 이용촉진 및 정보보호 등에 관한 법률」에 의해 형사처벌됨을
              알려 드립니다.
            </p>
            <p className="legal-date">게시일 : 2026년 9월 1일</p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
