import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { getSection, CONTENT_SECTIONS } from "@/lib/site-content";
import SectionForm from "../SectionForm";
import { saveSectionAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditSection({ params }) {
  await requireSession();
  const key = params.key;
  const meta = CONTENT_SECTIONS.find((s) => s.key === key);
  if (!meta) notFound();
  const initial = await getSection(key);

  return (
    <section>
      <h1 className="adm-h1">{meta.label} 편집</h1>
      <SectionForm section={key} initial={initial} action={saveSectionAction.bind(null, key)} />
    </section>
  );
}
