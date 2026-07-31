"use client";

import { useFormState, useFormStatus } from "react-dom";

function Submit({ children, className = "adm-link-btn", pendingLabel = "처리 중…" }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingLabel : children}
    </button>
  );
}

function Msg({ state }) {
  if (state?.error) return <p className="adm-form-err" role="alert">{state.error}</p>;
  if (state?.ok) return <p className="adm-form-ok">{state.ok}</p>;
  return null;
}

function CategoryRow({ c, count, onUpdate, onToggle, onDelete }) {
  const [upState, upAction] = useFormState(onUpdate, {});
  const [delState, delAction] = useFormState(onDelete, {});

  return (
    <>
      <tr>
        {/* 수정 폼과 숨김·삭제 폼은 서로 다른 칸에 둔다 — form 은 중첩할 수 없다. */}
        <td>
          <form action={upAction} className="cat-edit" id={`cat-edit-${c.id}`}>
            <input type="hidden" name="id" value={c.id} />
            <input name="label" defaultValue={c.label} maxLength={30} required aria-label="게시판 이름" />
          </form>
        </td>
        <td>
          <input
            form={`cat-edit-${c.id}`}
            name="slug"
            defaultValue={c.slug}
            maxLength={30}
            required
            aria-label="주소값"
          />
        </td>
        <td style={{ width: "1%" }}>
          <input
            form={`cat-edit-${c.id}`}
            name="sortOrder"
            type="number"
            defaultValue={c.sort_order}
            min={0}
            max={999}
            aria-label="정렬 순서"
            style={{ width: "5em" }}
          />
        </td>
        <td>{count}건</td>
        <td>
          <span className={`adm-badge ${c.is_hidden ? "off" : "on"}`}>
            {c.is_hidden ? "숨김" : "표시"}
          </span>
        </td>
        <td className="adm-actions">
          <button form={`cat-edit-${c.id}`} type="submit" className="adm-link-btn">저장</button>
          <form action={onToggle}>
            <input type="hidden" name="id" value={c.id} />
            <input type="hidden" name="hidden" value={c.is_hidden ? "false" : "true"} />
            <Submit>{c.is_hidden ? "표시" : "숨김"}</Submit>
          </form>
          <form action={delAction}>
            <input type="hidden" name="id" value={c.id} />
            <Submit className="adm-link-btn danger">삭제</Submit>
          </form>
        </td>
      </tr>
      {(upState?.error || upState?.ok || delState?.error || delState?.ok) && (
        <tr>
          <td colSpan={6}>
            <Msg state={upState} />
            <Msg state={delState} />
          </td>
        </tr>
      )}
    </>
  );
}

export default function CategoryManager({ categories, counts, onCreate, onUpdate, onToggle, onDelete }) {
  const [createState, createAction] = useFormState(onCreate, {});

  return (
    <>
      <form action={createAction} className="adm-form" style={{ maxWidth: "100%" }}>
        <Msg state={createState} />
        <div className="ev-grid">
          <label className="adm-field">
            <span>게시판 이름</span>
            <input name="label" maxLength={30} required placeholder="예: 산행수기" />
          </label>
          <label className="adm-field">
            <span>주소값 (영소문자·숫자·-)</span>
            <input name="slug" maxLength={30} required placeholder="예: hiking" />
          </label>
          <label className="adm-field">
            <span>정렬 순서</span>
            <input name="sortOrder" type="number" defaultValue={0} min={0} max={999} />
          </label>
        </div>
        <div className="adm-form-actions">
          <Submit className="btn btn-primary" pendingLabel="추가 중…">게시판 추가</Submit>
        </div>
      </form>

      {categories.length === 0 ? (
        <p className="adm-empty">등록된 게시판이 없습니다.</p>
      ) : (
        <div className="adm-table-wrap" style={{ marginTop: "var(--sp-xxl)" }}>
          <table className="adm-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>주소값</th>
                <th>순서</th>
                <th>글</th>
                <th>상태</th>
                <th className="adm-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <CategoryRow
                  key={c.id}
                  c={c}
                  count={counts[c.slug] ?? 0}
                  onUpdate={onUpdate}
                  onToggle={onToggle}
                  onDelete={onDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
