import { requireMember } from "@/lib/member-session";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { DancheongDefs } from "@/components/Icons";
import { SITE } from "@/content/site";
import BoardWriteForm from "../BoardWriteForm";
import { createPostAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata = { title: `글쓰기 | ${SITE.name}` };

export default async function BoardWrite({ searchParams }) {
  await requireMember();
  const defaultBoard = searchParams?.board === "story" ? "story" : "free";
  return (
    <>
      <DancheongDefs />
      <SiteHeader />
      <section className="screen top">
        <div className="wrap" style={{ maxWidth: "760px" }}>
          <div className="sec-head">
            <div><div className="ki">Write</div><h2>글쓰기</h2></div>
          </div>
          <BoardWriteForm action={createPostAction} defaultBoard={defaultBoard} />
        </div>
      </section>
      <SiteFooter />
    </>
  );
}
