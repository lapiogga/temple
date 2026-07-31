import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import { getCategoryBySlug } from "@/lib/board-categories";
import CategoryBoard from "@/components/CategoryBoard";

// 글·글쓰기·상세는 게시판(posts)과 같은 것을 쓴다. 이 화면은 board_categories 의
// 'hyusim-jirisan' 만 걸러 보여 준다. 목록 생김새와 글쓰기 권한은 그 카테고리 설정을 따르며,
// 관리자 화면(/admin/board/categories)에서 바꿀 수 있다.
export const dynamic = "force-dynamic";
// 화면 제목은 CategoryBoard 가 category.label 로 그린다. 브라우저 제목만 상수로
// 박혀 있어서 관리자가 이름을 바꾸면 둘이 서로 달라졌다 — 같은 값을 보게 한다.
export async function generateMetadata() {
  const cat = await getCategoryBySlug("hyusim-jirisan").catch(() => null);
  return { title: `${cat?.label ?? "휴심선원(지리산 휴심)"} | ${SITE.name}` };
}

export default function HyusimJirisanPage({ searchParams }) {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <CategoryBoard
        slug="hyusim-jirisan"
        kicker="Hyusim"
        basePath="/about/hyusim-jirisan"
        page={searchParams?.page}
      />
      <SiteFooter />
    </>
  );
}
