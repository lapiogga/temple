import { readFileSync } from "fs";
import path from "path";

// 법적 문서(이용약관·개인정보 보호정책) 텍스트 로드. src/content/legal/*.txt
function read(name) {
  try {
    return readFileSync(path.join(process.cwd(), "src/content/legal", name), "utf8");
  } catch (err) {
    console.error("법적 문서 읽기 실패:", name, err.message);
    return "";
  }
}

export const TERMS = read("terms.txt");
export const PRIVACY = read("privacy.txt");
