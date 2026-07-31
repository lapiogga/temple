// 질문 창 + 답변 창 (표 형식). 서버(page)·클라이언트(SecretGate) 양쪽에서 공용.
import { formatDate } from "@/lib/format";

// 값이 없을 때만 "-" 로 채운다(답변 전 answeredAt 이 null 이다).
const fmtDate = (v) => (v ? formatDate(v) : "-");

export default function QnaView({ title, authorName, createdAt, body, answer, answeredAt }) {
  return (
    <div className="qna-view">
      <div className="qna-card">
        <div className="qna-card-head q">질문</div>
        <table className="detail-table">
          <tbody>
            <tr>
              <th scope="row">질문 제목</th>
              <td><span className="detail-title">{title}</span></td>
            </tr>
            <tr>
              <th scope="row">질문자</th>
              <td>{authorName}</td>
            </tr>
            <tr>
              <th scope="row">질문일시</th>
              <td>{fmtDate(createdAt)}</td>
            </tr>
            <tr>
              <th scope="row">질문내용</th>
              <td className="detail-body">{body}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="qna-card">
        <div className="qna-card-head a">답변</div>
        {answer ? (
          <table className="detail-table">
            <tbody>
              <tr>
                <th scope="row">답변 내용</th>
                <td className="detail-body">{answer}</td>
              </tr>
              <tr>
                <th scope="row">답변자</th>
                <td>종무소</td>
              </tr>
              <tr>
                <th scope="row">답변일시</th>
                <td>{fmtDate(answeredAt)}</td>
              </tr>
            </tbody>
          </table>
        ) : (
          <p className="qna-noanswer">아직 답변이 등록되지 않았습니다. 종무소에서 확인 후 답변드리겠습니다.</p>
        )}
      </div>
    </div>
  );
}
