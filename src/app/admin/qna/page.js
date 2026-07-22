import { requireSession } from "@/lib/session";
import { listAllQuestions } from "@/lib/qna";
import { answerQuestionAction, deleteQuestionAction } from "./actions";

function fmt(v) {
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}.${p(d.getMonth() + 1)}.${p(d.getDate())}`;
}

export default async function QnaAdmin() {
  await requireSession();
  const qs = await listAllQuestions();
  const unanswered = qs.filter((q) => !q.answer).length;

  return (
    <section>
      <h1 className="adm-h1">묻고답하기 관리</h1>
      <p style={{ color: "var(--ink-soft)", marginBottom: "16px" }}>
        미답변 <b>{unanswered}</b> · 전체 {qs.length}
      </p>

      {qs.length === 0 ? (
        <p className="adm-empty">등록된 질문이 없습니다.</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {qs.map((q) => (
            <div key={q.id} className="adm-qna-item">
              <div className="adm-qna-head">
                <div>
                  <b>{q.is_secret ? "🔒 " : ""}{q.title}</b>{" "}
                  <span style={{ color: "var(--ink-soft)", fontSize: "13.5px" }}>
                    · {q.author_name} · {q.phone ?? ""} · {fmt(q.created_at)}
                  </span>
                </div>
                <form action={deleteQuestionAction}>
                  <input type="hidden" name="id" value={q.id} />
                  <button className="adm-link-btn danger" type="submit">삭제</button>
                </form>
              </div>
              <div className="adm-qna-body">{q.body}</div>
              <form action={answerQuestionAction} className="adm-qna-answer">
                <input type="hidden" name="id" value={q.id} />
                <textarea name="answer" rows={3} defaultValue={q.answer ?? ""} placeholder="답변을 입력하세요" className="qna-textarea" />
                <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "8px" }}>
                  {q.answer ? "답변 수정" : "답변 등록"}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
