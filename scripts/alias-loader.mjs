// node 로 이 저장소의 모듈을 직접 부를 때 쓰는 해석기.
//
// 소스가 "@/lib/..." 별칭을 쓰는데(jsconfig.json) 그것은 Next 빌드가 푸는 것이라
// 맨 node 는 모른다. 검증 스크립트가 실제 모듈을 그대로 불러야 하므로 여기서 푼다
// (모듈을 베껴서 재면 검증이 아니라 사본을 재는 것이 된다).
//
// 사용:  node --import ./scripts/alias-loader.mjs your-script.mjs
import { pathToFileURL } from "node:url";
import path from "node:path";
import { register } from "node:module";

const ROOT = process.cwd();

// 소스는 확장자 없이 쓴다("@/lib/db"). 번들러는 붙여 주지만 node 는 안 붙인다.
function withExt(p) {
  return /\.[a-z]+$/i.test(p) ? p : `${p}.js`;
}

export function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return next(pathToFileURL(withExt(path.join(ROOT, "src", specifier.slice(2)))).href, context);
  }
  return next(specifier, context);
}

register(import.meta.url, pathToFileURL("./"));
