// iron-session 설정 + 세션 시크릿 검증.
// next/* 임포트를 두지 않아 Edge 미들웨어와 서버 컴포넌트가 함께 임포트할 수 있다.
// 시크릿은 환경변수로만. 미설정/32자 미만이면 즉시 throw(fail-fast).
const password = process.env.SESSION_SECRET;
if (!password || password.length < 32) {
  throw new Error(
    "SESSION_SECRET 환경변수가 없거나 32자 미만입니다. (예: openssl rand -base64 32)"
  );
}

export const sessionOptions = {
  cookieName: "temple_admin",
  password,
  // ttl 1일(관리 세션은 짧게). maxAge 는 ttl 로부터 자동 계산.
  ttl: 60 * 60 * 24,
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};
