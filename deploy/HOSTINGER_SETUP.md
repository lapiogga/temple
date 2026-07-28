# 응선사 홈페이지 — Hostinger VPS 배포 가이드

> 결정(2026-07-28): kis_quant와 완전 분리된 독립 운영환경을 **Hostinger VPS**에 구축.
> 스택은 현재 devbox와 동일(로컬 PostgreSQL + 로컬 디스크 이미지) → **S3 리팩터 불필요**, 기존 `deploy/` 자산 재사용.

---

## 1. 사용자가 직접 할 일 — VPS 구매 (제가 대신 못 함)

Hostinger 콘솔·결제 접근이 불가하므로 아래는 사용자님이 진행하셔야 합니다.

### 구매 사양 (권장)
| 항목 | 권장값 | 이유 |
|------|--------|------|
| 상품 | **VPS — KVM2** (2 vCPU / 8GB RAM / 100GB NVMe / 8TB 대역폭) | 8GB라 빌드 OOM 없음, 100GB로 5년치 이미지(24GB)+DB 여유 |
| OS 템플릿 | **Ubuntu 24.04 (LTS, 순정)** | 앱스택 자동설치 스크립트가 이 기준 |
| 리전(로케이션) | **한국에 가장 가까운 곳**(싱가포르 있으면 싱가포르, 없으면 인도/일본 등 목록 중 최근접) | 한국 DC 없음 → 레이턴시 최소화 |
| 약정 기간 | 예산에 따라 선택 | 장기약정=월단가↓(선결제), 갱신가는 오름. 24개월이 무난 |
| 백업 | **일간 자동 백업 애드온 켜기 권장** | 단일 VPS 내구성 보완(그래도 외부백업 별도 권장) |

> 구매 후 확보되는 것: **VPS 공인 IP + root 비밀번호(또는 SSH 키)**. 이 둘이 있어야 배포합니다.

### ⚠️ 도메인
- 지금은 도메인 없이 **IP + self-signed HTTPS**로 띄웁니다(관리자/내부 검증용). 일반 방문자에겐 브라우저 경고가 뜨고 카카오맵은 IP에선 안 뜹니다.
- **도메인 확정 후** certbot 무료 인증서로 전환하면 정식 공개 상태가 됩니다(§4).
- Hostinger '첫해 무료 도메인'은 지금 바로 정하지 않으면 혜택이 사라질 수 있으니, 도메인 계획이 있으면 구매 시 함께 고려하세요.

---

## 2. 배포 실행 (구매 후) — 둘 중 하나

### 방법 A) 제가 SSH로 직접 배포 (권장)
VPS IP와 접속 수단을 주시면(이 세션에서 `!` 명령으로 SSH 키 등록 등), 제가 접속해
`deploy/bootstrap-hostinger.sh`를 실행하고 검증까지 마칩니다. **실행 직전 다시 확인받습니다.**

### 방법 B) 사용자가 스크립트 직접 실행
VPS에 root로 접속 후:
```bash
# 소스 받기
git clone https://github.com/lapiogga/temple.git
cd temple
# (선택) 카카오 키가 있으면 환경변수로 전달
export KAKAO_MAP_KEY=발급받은_JS키   # 없으면 생략(지도 OSM 폴백)
# 실행 — Node/PostgreSQL/nginx/빌드/systemd/self-signed HTTPS/방화벽 자동 구성
chmod +x deploy/bootstrap-hostinger.sh
sudo ./deploy/bootstrap-hostinger.sh
```
스크립트가 **DB 비밀번호·SESSION_SECRET을 자동 생성**해 `.env`에 기록합니다(커밋 안 됨).
끝에 접속 URL과 다음 단계가 출력됩니다.

### 배포 직후 운영자 계정 시드
```bash
sudo -u ubuntu bash -lc "cd /home/ubuntu/projects/temple && npm run db:seed -- 아이디 비밀번호 표시이름"
```

### 검증
```bash
curl -k -I https://<VPS_IP>/           # 200
systemctl status temple                 # active (running)
```
브라우저로 `https://<VPS_IP>` → 경고 통과 → 로그인 → 게시판 글쓰기·이미지 업로드·삭제 확인.

---

## 3. hPanel 방화벽
Hostinger hPanel의 VPS 방화벽에서도 **80/443/22 인바운드 허용**을 확인하세요(스크립트는 서버 내부 ufw만 엽니다).

---

## 4. 도메인 나중 연결 (정식 공개)
```bash
# 1) 등록기관/hPanel에서 도메인 A레코드 → VPS IP
# 2) nginx server_name 을 도메인으로 수정 후
sudo certbot --nginx -d 도메인 -d www.도메인      # Let's Encrypt 무료·자동갱신
# 3) NEXT_PUBLIC_SITE_URL 은 빌드타임 baked → 재빌드 필수
#    .env: NEXT_PUBLIC_SITE_URL=https://도메인
sudo -u ubuntu bash -lc "cd /home/ubuntu/projects/temple && npm run build"
sudo systemctl restart temple
# 4) 카카오 개발자콘솔에 도메인 등록(지도 자동 전환)
```

---

## 5. 백업 (내구성 보완 — 중요)
단일 VPS라 디스크 장애 시 이미지+DB 동시 유실 위험.

### 등록된 cron (2026-07-28 구성 완료, `crontab -l` for ubuntu)
```
PATH=/usr/local/bin:/usr/bin:/bin
0 19 * * *  /var/www/temple/deploy/backup-db.sh      >> /home/ubuntu/backups/backup.log 2>&1
5 19 * * *  /var/www/temple/deploy/backup-uploads.sh >> /home/ubuntu/backups/backup.log 2>&1
```
> 서버 TZ 가 UTC 이므로 **19:00 UTC = 04:00 KST**.

| 스크립트 | 대상 | 방식 | 보관 |
|---|---|---|---|
| `backup-db.sh` | DB(`temple`) | 매일 pg_dump + gzip | 14일 |
| `backup-uploads.sh` | `public/uploads` | 매월 1일 전체 + 매일 증분(tar `--listed-incremental`) | 현재 주기 + 직전 주기 |

산출물: `/home/ubuntu/backups/` (DB), `/home/ubuntu/backups/uploads/{current,prev}/` (이미지), 로그 `backup.log`.
두 스크립트 모두 **자기가 놓인 체크아웃의 `.env` 를 읽으므로** prod/dev 양쪽에서 그대로 동작한다.

### 실패에 대한 설계 (2026-07-28 적대적 감사 반영)
`backup-uploads.sh` 는 아래 원칙 위에 있다. 셋 다 실패 재현으로 확인된 것이며 **개별로 떼어내 고치면 안 된다**.

| 상황 | 동작 | 이유 |
|---|---|---|
| tar 경고 종료(rc=1)<br>`File removed / file changed / File shrank` | 아카이브를 **승격**하고 스냅샷도 함께 전진 | 아카이브는 유효하다. 아카이브만 버리고 스냅샷을 전진시키면 그 회차 변경분이 어느 백업에도 남지 않는다 |
| tar 치명적 실패(rc≥2) | 아카이브 폐기 + 스냅샷 **미전진**, 증분 중이었다면 라이브 스냅샷도 폐기 | 다음 실행이 전체 백업으로 자가복구된다. 스냅샷이 손상돼 최대 30일 무증상 정지하는 것을 막는다 |
| 전체 백업 실패 | `staging` 에서 작업하므로 `current`·`prev` **무손상** | 파괴적 로테이션은 새 전체 백업이 검증을 통과한 뒤에만 실행한다 |

MODE 판정 기준은 '스냅샷 존재'가 아니라 **'전체 아카이브 존재'** 다 → 실패한 전체 백업이 다음 날 자동 재시도된다.
여유 공간 가드가 tar/pg_dump 앞에 있어, 디스크가 차더라도 PostgreSQL 이 죽기 전에 백업이 먼저 실패한다.

### 복원
```bash
# DB
gunzip -c /home/ubuntu/backups/temple_<STAMP>.sql.gz | psql "$DATABASE_URL"
# 이미지 — 전체 → 증분 순(파일명 일련번호 덕에 사전순 = 생성순)
cd /home/ubuntu/backups/uploads/current
for f in $(ls -1 uploads_*_full.tar.gz; ls -1 uploads_*_inc.tar.gz | sort); do
  tar --listed-incremental=/dev/null -xzf "$f" -C /var/www/temple/public
done
```
> ⚠️ 원격에서 받아올 때는 **반드시 주기별 prefix(`uploads/<CYCLE>/`) 단위로** 받을 것.
> 전 주기 아카이브를 한 디렉터리에 섞으면 지난 주기 증분이 새 주기 전체 뒤에 적용돼 복원이 깨진다.
> `CYCLE` 값은 각 주기 디렉터리의 `CYCLE` 파일에 있다.

검증 이력
- 2026-07-28 DB 덤프를 별도 스키마로 복원해 원본과 md5 일치 확인
  (한글·이모지·HTML·역슬래시·개행 전부 보존). 이미지는 전체+증분 복원본이 원본과 `diff -r` 일치.
- **2026-07-28 19:00/19:05 UTC 첫 자동 cron 발화 성공** — DB `temple_20260728_190001.sql.gz`,
  이미지 `uploads_20260728_190501_01_inc.tar.gz`(mode=inc, cycle 인식 정상).
  산출물 퍼미션 600 유지 확인(`umask 077` 동작). cron 발화 자체가 이때까지 미검증이었다.

### ⚠️ 아직 남은 것 — off-VPS 반출 (마이그레이션 전 필수)
위 백업은 **원본과 같은 디스크**에 저장된다. 디스크 장애·랜섬웨어·계정 사고에는 무력하다.
지금 보호 대상은 플레이스홀더 11장과 빈 DB뿐이라 손실 상한이 작지만,
**게시글 200 + 이미지 2,000장이 들어오는 순간 이 항목의 심각도가 올라간다.**

**목적지: Cloudflare R2** (2026-07 조사 기준 30GB 에서 월 약 414원, 실사용 4GB 구간은 무료 10GB 안이라 0원).
선정 이유는 ①키 한 쌍으로 끝나는 헤드리스 인증(Google Drive 는 브라우저 OAuth 라 무인 백업에 부적합)
②egress 가 구조적으로 항상 $0 — 복원 비용 함정이 없음 ③AWS 는 kis_quant 와 프로바이더가 겹쳐 '완전 분리' 원칙 위배
④이 VPS(쿠알라룸푸르)에서 ping 7~8ms 로 후보 중 최속. 2순위 예비는 Backblaze B2.

```bash
# 1) rclone — sudo 불필요, 사용자 홈에 설치
curl -O https://downloads.rclone.org/rclone-current-linux-amd64.zip
unzip -j rclone-current-linux-amd64.zip '*/rclone' -d ~/bin && chmod +x ~/bin/rclone

# 2) R2 목적지 등록 (브라우저에서 발급한 키 한 쌍 필요)
~/bin/rclone config create r2 s3 provider=Cloudflare \
  access_key_id=<KEY> secret_access_key=<SECRET> \
  endpoint=https://<ACCOUNT_ID>.r2.cloudflarestorage.com

# 3) crontab 에 환경변수 추가 — 두 스크립트가 같은 규약으로 읽는다
BACKUP_REMOTE=r2:temple-backups
```
> **버킷에 버저닝 또는 객체잠금을 반드시 켤 것.** R2 API 토큰에는 '쓰기 전용' 스코프가 없어,
> VPS 가 털리면 그 키로 원격 백업까지 지울 수 있다. 이게 없으면 오프사이트를 붙여도 랜섬웨어는 못 막는다.
> 스크립트가 원격 보관정리를 하지 않는 것도 같은 이유다 — 수명주기는 R2 대시보드 규칙에 맡긴다.

**Hostinger 일간 백업 애드온($6/월)은 사지 말 것.** off-host 이지 off-provider 가 아니다.
결제 실패 시 서버와 백업이 동시에 정지 대상이 되고, 공식 문서상 스냅샷을 로컬로 내려받는 경로 자체가 없다.
무료로 딸려오는 주간분은 재구축 시간 단축용으로만 켜두고 백업 전략으로 계산하지 말 것.

### ⚠️ 실패 통보 경로가 아직 없다
MTA 미설치 + `MAILTO` 무효 + 로그 무감시 상태다. **`MAILTO` 를 넣어도 메일은 나가지 않는다.**
dead-man's switch 가 이 서버에 맞는 답이다 — healthchecks.io 무료 체크 2개를 만들고
crontab 에 `HC_URL_DB`, `HC_URL_UPLOADS` 를 넣으면 두 스크립트가 **완주했을 때만** 핑을 보낸다.
디스크 풀·인증 실패·cron 중단·서버 다운 어느 쪽이든 핑이 끊겨 알림이 온다.

---

## 6. 기존 콘텐츠 마이그레이션 (게시글 ~200 + 이미지 ~2000장) — 소스 확인 후
- 이미지: `rsync`/`scp`로 `public/uploads/`에 복사(로컬 디스크 영속).
- 게시글: 원본 형식(SQL덤프/CSV/CMS export) 확인 후 1회성 이관 스크립트로 로컬 PG에 INSERT(sanitize 재적용).
- 상세는 `docs/09_독립배포_아키텍처_분석.md` §5.

---

## 재배포(코드 수정 후)
```bash
cd /home/ubuntu/projects/temple && ./deploy/deploy.sh   # git pull → npm ci → build → restart
```
