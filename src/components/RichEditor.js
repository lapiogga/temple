"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// SSR 비활성(브라우저 전용 에디터). 로딩 중 대체 표시.
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="rich-loading">에디터 로딩 중…</div>,
});

// 본문 리치 에디터. 값은 숨은 input(name)으로 서버 액션에 전달된다.
export default function RichEditor({ name = "body", initialValue = "" }) {
  const [value, setValue] = useState(initialValue);

  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["blockquote", "link", "image"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="rich-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={setValue}
        modules={modules}
        placeholder="본문을 입력하세요…"
      />
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
