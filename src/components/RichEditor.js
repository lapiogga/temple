"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

// SSR 비활성(브라우저 전용 에디터). 로딩 중 대체 표시.
// forwardRef 없이 dynamic 으로 감싸면 ref 가 전달되지 않으므로, 내부에서
// forwardedRef 를 받아 넘긴다.
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill-new");
    return function Wrapped({ forwardedRef, ...props }) {
      return <RQ ref={forwardedRef} {...props} />;
    };
  },
  { ssr: false, loading: () => <div className="rich-loading">에디터 로딩 중…</div> }
);

// 본문 리치 에디터. 값은 숨은 input(name)으로 서버 액션에 전달된다.
//
// uploadAction 을 주면 툴바에 이미지 버튼이 생긴다. 파일을 골라 서버로 올리고,
// 돌아온 /uploads/… 경로를 커서 자리에 <img> 로 넣는다.
// Quill 기본 이미지 동작은 파일을 base64 로 본문에 박아 넣어 본문이 수 MB 가
// 되고 목록 조회까지 무거워지므로 쓰지 않는다.
export default function RichEditor({ name = "body", initialValue = "", uploadAction }) {
  const [value, setValue] = useState(initialValue);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const quillRef = useRef(null);

  const pickAndUpload = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/jpeg,image/png,image/webp,image/gif";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      setError("");
      setUploading(true);
      try {
        const fd = new FormData();
        fd.append("file", file);
        const res = await uploadAction(fd);
        if (res?.error) {
          setError(res.error);
          return;
        }
        const editor = quillRef.current?.getEditor?.();
        if (!editor) {
          setError("에디터가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
          return;
        }
        const range = editor.getSelection(true);
        const at = range ? range.index : editor.getLength();
        editor.insertEmbed(at, "image", res.url, "user");
        editor.setSelection(at + 1, 0);
      } catch (err) {
        console.error("이미지 업로드 실패:", err);
        setError("이미지 업로드에 실패했습니다.");
      } finally {
        setUploading(false);
      }
    };
    input.click();
  }, [uploadAction]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ align: [] }],
          ["blockquote", "link"],
          ...(uploadAction ? [["image"]] : []),
          ["clean"],
        ],
        ...(uploadAction ? { handlers: { image: pickAndUpload } } : {}),
      },
    }),
    [uploadAction, pickAndUpload]
  );

  return (
    <div className="rich-editor">
      <ReactQuill
        forwardedRef={quillRef}
        theme="snow"
        value={value}
        onChange={setValue}
        modules={modules}
        placeholder="본문을 입력하세요…"
      />
      {uploading && <p className="demo-note">이미지 올리는 중…</p>}
      {error && <p className="adm-form-err" role="alert">{error}</p>}
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
