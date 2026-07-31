import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import CategoryBoard from "@/components/CategoryBoard";

// 글·글쓰기·상세는 게시판(posts)과 같은 것을 쓴다. 이 화면은 board_categories 의
// 'teaching' 만 걸러 보여 준다. 목록 생김새와 글쓰기 권한은 그 카테고리 설정을 따르며,
// 관리자 화면(/admin/board/categories)에서 바꿀 수 있다.
export const dynamic = "force-dynamic";
export const metadata = { title: `법문-살며 생각하며 | ${SITE.name}` };

export default function TeachingPage({ searchParams }) {
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <CategoryBoard
        slug="teaching"
        kicker="Teaching"
        basePath="/about/teaching"
        page={searchParams?.page}
      />
      <SiteFooter />
    </>
  );
}
