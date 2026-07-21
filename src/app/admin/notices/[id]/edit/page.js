import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getNotice } from "@/lib/notices";
import NoticeForm from "../../NoticeForm";
import { updateNoticeAction } from "../../actions";

export default async function EditNotice({ params }) {
  await requireSession();

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const notice = await getNotice(id);
  if (!notice) notFound();

  // id 를 서버 액션에 바인딩 → (prevState, formData) 시그니처로 폼에 전달.
  const action = updateNoticeAction.bind(null, id);

  return (
    <section>
      <h1 className="adm-h1">소식 수정</h1>
      <NoticeForm action={action} initial={notice} submitLabel="수정 저장" />
    </section>
  );
}
