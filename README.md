# 포교사찰 홈페이지 (temple)

산중 포교사찰의 공개 홈페이지. **1차**(공개 홍보·사찰 소식·가람 중창기)를 우선 개발하고, **2차**에서 신도 회원·커뮤니티를 확장합니다.

- **스택**: Next.js 14 (App Router) · React 18 · PostgreSQL(자체) · Tailwind(토큰) + 커스텀 CSS
- **호스팅**: Hostinger VPS(쿠알라룸푸르) 자체 호스팅 · Nginx · systemd · 자체서명 HTTPS(도메인 확보 후 certbot)
  - 한 대에 운영(`/var/www/temple` · `:3000` · DB `temple`)과 개발(`/home/ubuntu/temple-dev` · `:3001` · DB `temple_dev`)이 함께 돈다
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
│   ├─ HOSTINGER_SETUP.md   ← 현행 배포 가이드
│   ├─ SETUP_EC2.md         ← ⛔ 폐기(EC2 시절). 이력 보존용
│   ├─ bootstrap-hostinger.sh · nginx-temple.conf · nginx-temple-limit.conf
│   └─ deploy.sh · backup-db.sh · backup-uploads.sh · verify-backup-remote.sh
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

현행 가이드는 **`deploy/HOSTINGER_SETUP.md`**, 잔여작업과 현황은 **`docs/10_잔여작업_로드맵.md`** 다.
(`deploy/SETUP_EC2.md` 는 EC2 시절 문서라 따라 하면 안 된다 — 문서 상단에 폐기 배너가 있다.)

재배포는 체크아웃 안에서 `deploy/deploy.sh` 를 돌린다. 경로를 적을 필요가 없다 —
스크립트가 자기가 놓인 체크아웃을 기준으로 대상 서비스를 systemd 에서 역산한다.

```bash
cd /var/www/temple && ./deploy/deploy.sh          # 운영
./deploy/deploy.sh  # 개발(빌드 없음)
```

재시작에는 `sudo` 가 필요한데 이 환경의 sudo 는 비밀번호를 요구한다. 무인 실행에서는
거기서 멈추고(종료코드 2) 실행할 명령을 알려 준다.

---

## 현재 상태 & 다음 작업
- [x] 메인 페이지(반응형, 소식/법회/중창기/오시는길/후원) — 콘텐츠는 `src/app/page.js` 상단 상수
- [x] 운영자 인증(로그인/세션) + **소식 관리화면**(작성·수정·노출토글·삭제) — bcryptjs + iron-session
- [ ] 콘텐츠를 DB 연동으로 교체 (공개 `page.js` 소식 섹션을 `src/lib/notices.js` 로)
- [ ] 관리화면 확장(중창기·갤러리·일정 등록) — 1차 필수
- [ ] 서브 페이지(사찰 소개, 중창기 상세, 소식 목록/상세)
- [ ] 실제 콘텐츠(중창기 사진·소식·연혁) 입력
- [ ] 2차: 회원·커뮤니티(members/posts/comments)

> 참고: 콘텐츠(사찰명·일정·계좌·사진)는 모두 예시 자리표시입니다. 실제 자료로 교체하세요.
> 문양·아이콘 등 SVG 자산은 직접 제작본이라 저작권 부담이 없습니다. 사진만 사찰 원본/공공저작물로 별도 확보(기획서 부록 A).
