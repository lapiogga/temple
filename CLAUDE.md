# temple — 응선사(應禪寺) 홈페이지

Next.js 14 App Router · JavaScript · PostgreSQL. Hostinger VPS 한 대에 prod/dev 를 같이 띄운다.

## 환경

| | 경로 | 포트 | DB | systemd |
|---|---|---|---|---|
| prod | `/var/www/temple` | 3000 | `temple` | `temple.service` |
| dev | `/home/ubuntu/temple-dev` | 3001 | `temple_dev` | `temple-dev.service` |

- **둘 다 systemd 로 돌고 `Restart=on-failure` 다.** 프로세스를 직접 죽이면 5초 뒤 되살아난다.
  재기동은 `sudo systemctl restart temple`(또는 `temple-dev`). `fuser -k 3000/tcp` 는 쓰지 말 것 —
  systemd 의 자동 재시작과 경합한다.
- dev 는 `npx next dev` 라 `.next` 를 계속 물고 있다. **같은 디렉터리에서 `next build` 를 돌리면
  돌아가는 dev 서버와 `.next` 를 두고 충돌한다.** 화면 검증은 `curl -s -o /dev/null -w '%{http_code}'
  http://localhost:3001/<경로>` 로 한다.
- 인증이 필요한 `/admin/*` 은 curl 로 307 이 난다. 그쪽은 esbuild 로 JSX 파싱만 확인한다.

## 코드에서 자주 걸리는 것

- **컴포넌트가 전부 `.js` 다** (src 기준 js 109 · css 3 · **tsx 0**).
  `grep --include="*.tsx"` 는 오류 없이 0건을 돌려주므로, 다 훑었다고 착각하기 쉽다.
  실제로 디자인 토큰 이전 때 이 함정에 걸려 인라인 `fontSize` 17개 값을 놓친 적이 있다.
  **전수 조사에는 반드시 `--include="*.js"` 를 넣을 것.**
- ESLint 설정 파일이 없다. `next lint` 는 대화형 설치를 물어보므로 무인 실행에 쓸 수 없다.
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
