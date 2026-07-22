import { requireSession } from "@/lib/session";
import EventForm from "../EventForm";
import { createEventAction } from "../actions";

export default async function NewEvent() {
  await requireSession();
  return (
    <section>
      <h1 className="adm-h1">새 일정</h1>
      <EventForm action={createEventAction} submitLabel="등록" />
    </section>
  );
}
