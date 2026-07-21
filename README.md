# 포교사찰 홈페이지 (temple)

산중 포교사찰의 공개 홈페이지. **1차**(공개 홍보·사찰 소식·가람 중창기)를 우선 개발하고, **2차**에서 신도 회원·커뮤니티를 확장합니다.

- **스택**: Next.js 14 (App Router) · React 18 · PostgreSQL(자체) · Tailwind(토큰) + 커스텀 CSS
- **호스팅**: AWS EC2(서울) 자체 호스팅 · Nginx · systemd · Let's Encrypt
- **디자인**: 한지·먹·단청 팔레트 / Pretendard + Noto Serif KR / 직접 제작 SVG 자산

---

## 디렉토리 구조
```
temple/
├─ README.md                ← 이 문서
├─ package.json
├─ next.config.mjs · postcss.config.js · tailwind.config.js · jsconfig.json
├─ .env.example             ← 복사해서 .env 로 사용
├─ docs/                    ← 기획서 V1~V4 (최신: 04_기획_V4_최신.md)
├─ design/
│   └─ reference/           ← 디자인 시안·SVG 자산팩·메인 목업 (브라우저로 열어 참고)
├─ db/
│   └─ schema.sql           ← 1차 PostgreSQL 스키마 (2차 확장 고려)
├─ deploy/
│   ├─ SETUP_EC2.md         ← EC2 셋업~배포 단계별 가이드
│   ├─ nginx-temple.conf · temple.service
│   └─ deploy.sh · backup-db.sh
├─ public/assets/           ← 실제 사진·아이콘 파일 배치 예정
└─ src/
    ├─ app/
    │   ├─ layout.js · globals.css · page.js   ← 메인 페이지(데이터 주도형)
    ├─ components/
    │   └─ Icons.js          ← 심볼·아이콘 SVG 컴포넌트
    └─ lib/
        └─ db.js             ← PostgreSQL 연결 풀
```

## 로컬 개발
```bash
cp .env.example .env      # DATABASE_URL 설정
npm install
npm run dev               # http://localhost:3000
```

## DB 초기화 & 운영자 계정
```bash
npm run db:init                       # psql 로 db/schema.sql 적용
npm run db:seed -- admin '<비밀번호>' 관리자   # 운영자 계정 생성/갱신 (bcrypt 해시)
```
> `.env` 에 **`SESSION_SECRET`**(32자 이상, `openssl rand -base64 32`)이 반드시 있어야 앱이 기동됩니다.

## 관리자 화면
- 로그인: `/login` · 관리: `/admin` (소식 작성·수정·노출토글·삭제)
- 인증: bcryptjs + iron-session(HttpOnly 쿠키). `/admin/*` 는 미들웨어 + 각 액션의 `requireSession()` 으로 보호.

## 배포
EC2 셋업·배포는 **deploy/SETUP_EC2.md** 참고. 요약:
`npm ci → npm run build → systemd(temple) → Nginx → certbot`.

---

## 현재 상태 & 다음 작업
- [x] 메인 페이지(반응형, 소식/법회/중창기/오시는길/후원) — 콘텐츠는 `src/app/page.js` 상단 상수
- [x] 운영자 인증(로그인/세션) + **소식 관리화면**(작성·수정·노출토글·삭제) — bcryptjs + iron-session
- [ ] 콘텐츠를 DB 연동으로 교체 (공개 `page.js` 소식 섹션을 `src/lib/notices.js` 로)
- [ ] 관리화면 확장(중창기·갤러리·일정 등록) — 1차 필수
- [ ] 서브 페이지(사찰 소개, 중창기 상세, 소식 목록/상세)
- [ ] 실제 콘텐츠(중창기 사진·소식·연혁) 입력
- [ ] 2차: 회원·커뮤니티(members/posts/comments)

## EC2 로 옮기기 (요약)
```bash
# 로컬에서 번들을 서버로 전송
scp temple_bundle.tar.gz ubuntu@서버IP:/home/ubuntu/projects/
# 서버에서
cd /home/ubuntu/projects && tar -xzf temple_bundle.tar.gz   # → projects/temple
cd temple && cp .env.example .env && nano .env
npm ci && npm run db:init && npm run build
# 이후 systemd·Nginx·certbot (deploy/SETUP_EC2.md)
```

> 참고: 콘텐츠(사찰명·일정·계좌·사진)는 모두 예시 자리표시입니다. 실제 자료로 교체하세요.
> 문양·아이콘 등 SVG 자산은 직접 제작본이라 저작권 부담이 없습니다. 사진만 사찰 원본/공공저작물로 별도 확보(기획서 부록 A).
