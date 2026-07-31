"use server";

import { getViewer } from "@/lib/viewer";
import { saveImage } from "@/lib/upload";

// 본문 에디터에서 부르는 이미지 업로드.
// 파일은 public/uploads/ 에 저장하고 경로만 돌려준다. 글이 저장될 때
// lib/posts.js 가 본문의 /uploads/ 경로를 훑어 post_images 에 연결한다.
//
// 글쓰기와 같은 권한을 요구한다. 이 액션은 페이지 트리 밖의 독립 엔드포인트라,
// 화면에서 버튼을 감추는 것만으로는 막히지 않는다.
export async function uploadPostImageAction(formData) {
  // 글쓰기와 같은 권한을 요구한다. 계정이 지금도 유효한지까지 본다(lib/viewer.js).
  const viewer = await getViewer();
  if (!viewer.isAdmin && !viewer.isApprovedMember) {
    return { error: "이미지를 올릴 권한이 없습니다." };
  }

  const file = formData.get("file");
  try {
    const url = await saveImage(file);
    return { url };
  } catch (err) {
    // saveImage 는 형식·용량 위반을 사용자용 문구로 throw 한다.
    return { error: err?.message ?? "이미지 업로드에 실패했습니다." };
  }
}
