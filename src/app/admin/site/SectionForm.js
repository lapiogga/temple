"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className="btn btn-primary" disabled={pending}>
      {pending ? "저장 중…" : "저장"}
    </button>
  );
}

export default function SectionForm({ section, initial = {}, action }) {
  const [state, formAction] = useFormState(action, {});

  return (
    <form action={formAction} className="adm-form ev-form">
      {state?.error ? <p className="adm-form-err" role="alert">{state.error}</p> : null}
      {state?.ok ? <p className="adm-form-ok">저장되었습니다. 공개 화면에 반영됩니다.</p> : null}

      {section === "hero" && (
        <>
          <label className="adm-field"><span>상단 소문구</span>
            <input name="eyebrow" defaultValue={initial.eyebrow || ""} maxLength={80} />
          </label>
          <label className="adm-field"><span>제목</span>
            <input name="title" defaultValue={initial.title || ""} maxLength={80} />
          </label>
          <label className="adm-field"><span>소개 문구</span>
            <textarea name="lede" rows={2} defaultValue={initial.lede || ""} />
          </label>
          <label className="adm-field"><span>배경 이미지 (한 줄에 하나 · 예: /uploads/hall-left.jpg)</span>
            <textarea name="images" rows={5} defaultValue={(initial.images || []).join("\n")} />
          </label>
        </>
      )}

      {section === "greeting" && (
        <>
          <label className="adm-check-row">
            <input type="checkbox" name="isDraft" defaultChecked={!!initial.isDraft} />
            <span>초안 표시 (“※ 초안입니다” 문구 노출)</span>
          </label>
          <label className="adm-field"><span>인삿말 (문단은 빈 줄로 구분)</span>
            <textarea name="paragraphs" rows={9} defaultValue={(initial.paragraphs || []).join("\n\n")} />
          </label>
          <label className="adm-field"><span>서명</span>
            <input name="sign" defaultValue={initial.sign || ""} maxLength={120} />
          </label>
        </>
      )}

      {section === "history" && (
        <label className="adm-field"><span>연혁 (한 줄에 하나 · 형식: 연도 | 제목 | 설명)</span>
          <textarea name="entries" rows={9}
            defaultValue={(Array.isArray(initial) ? initial : []).map((h) => `${h.yr} | ${h.title} | ${h.desc}`).join("\n")} />
        </label>
      )}

      {section === "sansindo" && (
        <>
          <label className="adm-field"><span>문화재 지정</span>
            <input name="heritage" defaultValue={initial.heritage || ""} maxLength={120} />
          </label>
          <label className="adm-field"><span>조성 연대</span>
            <input name="year" defaultValue={initial.year || ""} maxLength={80} />
          </label>
          <label className="adm-field"><span>요약</span>
            <textarea name="summary" rows={4} defaultValue={initial.summary || ""} />
          </label>
          <label className="adm-field"><span>상세 설명 (문단은 빈 줄로 구분)</span>
            <textarea name="detail" rows={10} defaultValue={(initial.detail || []).join("\n\n")} />
          </label>
        </>
      )}

      {section === "visit" && (
        <>
          <label className="adm-field"><span>주소</span>
            <input name="addressFull" defaultValue={initial.addressFull || ""} maxLength={200} />
          </label>
          <label className="adm-field"><span>대중교통 안내</span>
            <input name="transit" defaultValue={initial.transit || ""} maxLength={200} />
          </label>
          <label className="adm-field"><span>주차 안내</span>
            <input name="parking" defaultValue={initial.parking || ""} maxLength={200} />
          </label>
          <label className="adm-field"><span>지도 URL (길찾기)</span>
            <input name="mapUrl" defaultValue={initial.mapUrl || ""} maxLength={400} />
          </label>
          <div className="ev-lunar-row">
            <label className="adm-field"><span>후원 은행</span>
              <input name="bank" defaultValue={initial.donation?.bank || ""} maxLength={40} />
            </label>
            <label className="adm-field"><span>계좌번호</span>
              <input name="account" defaultValue={initial.donation?.account || ""} maxLength={60} />
            </label>
            <label className="adm-field"><span>예금주</span>
              <input name="holder" defaultValue={initial.donation?.holder || ""} maxLength={40} />
            </label>
          </div>
        </>
      )}

      <div className="adm-form-actions">
        <SubmitBtn />
        <Link href="/admin/site" className="btn btn-ghost">목록</Link>
      </div>
    </form>
  );
}
