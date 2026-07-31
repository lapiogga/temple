# temple — 응선사(應禪寺) 홈페이지

Next.js 14 App Router · JavaScript · PostgreSQL. Hostinger VPS 한 대에 prod/dev 를 같이 띄운다.

## 환경

| | 경로 | 포트 | DB | systemd |
|---|---|---|---|---|
| prod | `/var/www/temple` | 3000 | `temple` | `temple.service` |
| dev | `/home/ubuntu/temple-dev` | 3001 | `temple_dev` | `temple-dev.service` |

- **둘 다 systemd 로 돌지만 프로세스를 죽여도 되살아나지 않는다.** `Restart=on-failure` 가
  걸려 있어도 systemd 가 보는 메인 PID 는 `npx` **래퍼**이고, 실제로 포트를 잡는
  `next-server` 는 그 자식이다. 자식만 죽이면 래퍼가 `status=0/SUCCESS` 로 정상 종료해
  `on-failure` 조건에 해당하지 않는다 — 서비스가 그냥 죽은 채로 남는다.
  (2026-07-31 에 실제로 이렇게 dev 를 내려놓았다.)
  재기동은 반드시 `sudo systemctl restart temple-dev`(prod 는 `temple`). `kill` · `fuser -k`
  로는 복구되지 않는다.
- **이 환경의 `sudo` 는 비밀번호를 요구한다.** 에이전트 셸이나 `!` 프리픽스처럼 TTY 가 없는
  곳에서는 조용히 실패한다(`systemctl start` 를 쳐도 서비스가 그대로 죽어 있다).
  서비스 조작은 사람이 실제 터미널에서 해야 한다. 상태 확인(`systemctl status`)은 sudo 없이 된다.
- **예외: `next.config.mjs` 를 고치면 dev 는 스스로 되살아난다.** `next dev` 가 설정 파일을
  감시하다가 서버 자식만 exit 77 로 내리고(`server/lib/start-server.js:290-297`), CLI 부모가
  그 코드를 받아 다시 띄운다(`cli/next-dev.js:239`). systemd·sudo 가 필요 없다.
  위의 "재기동에 사람이 필요하다" 는 프로세스를 **밖에서 죽였을 때** 이야기다.
- dev 는 `npx next dev` 라 `.next` 를 계속 물고 있다. **같은 디렉터리에서 `next build` 를 돌리면
  돌아가는 dev 서버와 `.next` 를 두고 충돌한다.** 화면 검증은 `curl -s -o /dev/null -w '%{http_code}'
  http://localhost:3001/<경로>` 로 한다.
  프로덕션 빌드를 검증해야 하면 스크래치패드에 `git ls-files` 사본을 만들고 `node_modules` 를
  심볼릭 링크한 뒤 거기서 빌드한다. **`.env` 를 복사했으면 끝나고 지울 것**(실제 DB 비밀번호가 들어 있다).
- **dev 에서는 보이지 않는 결함이 두 종류 있다.** dev 는 nginx 를 거치지 않고 매 요청을
  렌더하기 때문이다. 2026-07-31 에 둘 다 운영까지 나갔다(로드맵 §2-D).
  - nginx 가 자르는 것 — `client_max_body_size` 등. dev 는 앱 한도까지 그냥 통과한다.
  - 정적 프리렌더에서만 나는 것 — `redirect()` 만 하는 페이지가 `Location` 을 잃었다.
  운영 관련 변경은 `:3000` 과 `:3001` 을 **대조**해야 한다. 한쪽만 보면 놓친다.
- **컴포넌트를 `"use client"` ↔ 서버 컴포넌트로 바꾸면 dev 서버를 재시작해야 한다.**
  Next 는 클라이언트 모듈 판정을 매니페스트에 캐시하는데, 파일만 고치면 그 판정이 남아
  `You're importing a component that needs next/headers` 로 전 라우트가 500 이 된다.
  코드는 멀쩡하다 — 재시작 + `.next` 삭제로 풀린다.
- 인증이 필요한 `/admin/*` 은 curl 로 307 이 난다. 그쪽은 esbuild 로 JSX 파싱만 확인한다.
- **nginx 는 `nginx -t` 통과 + reload 종료코드 0 인데도 옛 설정으로 계속 돌 수 있다.**
  reload 는 공유 메모리 zone 을 **이름으로 재사용**하는데 그때 키가 이전과 같아야 한다.
  돌고 있는 zone 의 키를 바꾸면 `[emerg] limit_req "…" uses the "…" key while previously
  it used the "…" key` 로 적재에 실패하고 master 는 옛 설정을 유지한다. `nginx -t` 는
  돌고 있는 인스턴스를 모르니 못 잡는다(2026-07-31 실제 발생).
  **reload 뒤에는 파일이 아니라 동작을 확인할 것.** 워커가 새로 떴는지가 가장 빠른 신호다:
  `ps -o pid,lstart -C nginx` — 워커 시각이 그대로면 적용되지 않은 것이다.
  zone 정의를 바꿀 때는 이름도 함께 바꾼다(`temple_login_post` 처럼 키를 이름에 박아 둔다).

## 코드에서 자주 걸리는 것

- **컴포넌트가 전부 `.js` 다** (src 기준 js 109 · css 3 · **tsx 0**).
  `grep --include="*.tsx"` 는 오류 없이 0건을 돌려주므로, 다 훑었다고 착각하기 쉽다.
  실제로 디자인 토큰 이전 때 이 함정에 걸려 인라인 `fontSize` 17개 값을 놓친 적이 있다.
  **전수 조사에는 반드시 `--include="*.js"` 를 넣을 것.**
- **Lint 는 `npm run lint` 로 무인 실행된다**(`.eslintrc.json` + `eslint-config-next`).
  `next lint` 는 설정이 없으면 대화형 설치를 물어보므로 예전에는 못 썼는데, 2026-07-31 에
  설정을 넣었다. 현재 src 135개 파일 지적 0건 — 새로 0건이 아닌 상태로 만들지 말 것.
  `<img>` 경고는 파일마다 `eslint-disable-next-line @next/next/no-img-element` 로 끈다
  (업로드 이미지는 크기를 모르므로 `next/image` 를 쓰지 않는다).
- CSS 는 `src/app/globals.css` · `src/app/admin/admin.css` · `src/app/login/login.css` 셋뿐이다.
- 인라인 `style={{}}` 이 여기저기 있다. CSS 만 고치면 화면이 안 따라오는 경우가 있다.

## 디자인 토큰

색·글자크기·행간·굵기·여백·모서리·그림자·모션·선굵기를 **리터럴로 쓰지 않는다.**
`globals.css` 의 `:root` 토큰을 쓴다. (Microsoft Fluent 2 의 척도를 단청 팔레트에 이식한 것.
경위와 남은 결정 사항은 `docs/10_잔여작업_로드맵.md` §2-B)

리터럴이 허용되는 자리는 **그 자리에 이유가 주석으로 적혀 있다** — 모바일 푸터 `84px`,
무단위 `line-height` 6곳, 카카오·네이버 규정색. 주석 없는 리터럴은 이전 누락이다.

고치고 나면 두 가지를 확인한다. 오타 난 토큰은 CSS 가 조용히 무시하므로
파싱만으로는 안 잡힌다.

```bash
# 1) postcss 파싱
node -e "const p=require('postcss'),f=require('fs');
['src/app/globals.css','src/app/admin/admin.css','src/app/login/login.css']
  .forEach(x=>p.parse(f.readFileSync(x,'utf8'),{from:x}))" && echo "파싱 OK"

# 2) 정의되지 않은 토큰 참조 (.js 인라인 style 까지 훑는다)
python3 -c "
import re,glob
d=set();u=set()
for f in glob.glob('src/**/*.css',recursive=True)+glob.glob('src/**/*.js',recursive=True):
    s=open(f,encoding='utf-8').read()
    if f.endswith('.css'):
        d|={m.group(1) for m in re.finditer(r'(--[a-zA-Z0-9-]+)\s*:',s)}
    u|={m.group(1) for m in re.finditer(r'var\((--[a-zA-Z0-9-]+)',s)}
print('미정의:',sorted(u-d) or '없음')"
```

## 문서

- **현행은 `docs/10_잔여작업_로드맵.md`.** `08_세션_핸드오프.md` 는 폐기됐다 —
  EC2 시절 기준이라 따라 하면 prod 를 죽이는 명령이 들어 있다.
- 발화 로그 `docs/PROMPTS-LOG.md` · 배포 `deploy/HOSTINGER_SETUP.md`
- `design/reference/*.html` 은 자체 `:root` 를 든 독립 문서라 빌드에 들어가지 않는다.
  `Fluent2_구조시안.html` 은 **이식 전** 제안서다(상단 배너 참고).

## git

- `.env` · `public/uploads/` · `.next/` · 루트 `*.png` 는 gitignore.
  브랜치를 다른 데서 받으면 **실사진이 없다** (GitHub `Attachments/` 에서 복원).
- 원격 인증은 VS Code 의 `GIT_ASKPASS` 에 붙어 있다. 세션이 없으면 무인 푸시가 막힐 수 있으므로,
  예약 푸시 전에는 `git push --dry-run` 으로 먼저 확인할 것.
- 커밋 메시지는 한국어. 무엇을 바꿨는지보다 **왜 그렇게 했는지**와 판단 근거를 적는다.
- **이 서버에는 같은 저장소의 체크아웃이 둘이다.** 운영(`/var/www/temple`)은 `git pull` 만
  받는 쪽이고, 작업·커밋·태그·푸시는 전부 개발(`/home/ubuntu/temple-dev`)에서 한다.
  **운영에서 `git push` 를 치면 "Everything up-to-date" 가 나온다** — 그 저장소 기준으로는
  정말 올릴 것이 없기 때문이다. 거짓말은 아니지만 성공한 것처럼 읽힌다
  (2026-07-31 에 태그 `Ver2.1` 이 이렇게 안 올라갔다).
  푸시한 뒤에는 `git ls-remote --tags origin` 이나 `git log --oneline origin/main -1` 로
  원격이 실제로 바뀌었는지 확인할 것.
