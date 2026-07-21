import { requireSession } from "@/lib/session";
import NoticeForm from "../NoticeForm";
import { createNoticeAction } from "../actions";

export default async function NewNotice() {
  await requireSession();
  return (
    <section>
      <h1 className="adm-h1">새 소식</h1>
      <NoticeForm action={createNoticeAction} submitLabel="등록" />
    </section>
  );
}
