import Link from "next/link";

// 아이디·비밀번호를 잊으셨을 때의 안내.
//
// 예전에는 여기에 '휴대폰 본인인증' 절차가 있었다. 그런데 그것이 실물이 아니었다 —
// 6자리 인증번호를 브라우저에서 난수로 만들어 화면에 그대로 띄우고(데모 인증번호: …),
// 브라우저에서 대조해 '✓ 본인인증 완료' 를 찍었다. 누구나 통과할 수 있었고, 통과해도
// "문자 발송이 연동되지 않았습니다" 라는 안내만 나와 실제로 아무 일도 일어나지 않았다.
//
// 아무 일도 안 하는 절차라면 없느니만 못하다. 본인인증을 흉내 내는 화면은 이용자에게
// 이 사이트의 본인확인이 그렇게 동작한다고 가르치고, 실제로는 아무것도 지키지 않는다.
// 문자 발송(§4-2 사용자 결정 대기)이 붙기 전까지는 지금 실제로 되는 길만 안내한다.
export default function FindAccountForm() {
  return (
    <div className="auth-card">
      <h2 className="find-heading">아이디를 잊으셨나요</h2>
      <p className="find-desc">
        종무소로 문의해 주시면 가입하실 때 적으신 성명과 휴대폰 번호를 확인한 뒤
        아이디를 알려 드립니다.
      </p>

      <h2 className="find-heading">비밀번호를 잊으셨나요</h2>
      <p className="find-desc">
        종무소에 비밀번호 초기화를 요청해 주세요. 종무소가 초기화하면 아래 화면에서
        가입하실 때 적으신 <b>휴대폰 번호와 생년월일</b>을 확인한 뒤 새 비밀번호를
        직접 정하실 수 있습니다. 종무소도 회원님의 비밀번호를 알 수 없습니다.
      </p>
      <div className="auth-actions">
        <Link href="/member-login/reset" className="btn btn-primary">
          새 비밀번호 설정하기 →
        </Link>
      </div>

      <p className="find-note">
        가입하실 때 적으신 휴대폰 번호나 생년월일이 지금과 다르면 위 확인을 통과하지
        못합니다. 그때도 종무소로 알려 주시면 확인 후 바로잡아 드립니다.
      </p>

      <div className="auth-actions">
        <Link href="/member-login" className="btn btn-ghost">로그인으로</Link>
      </div>
    </div>
  );
}
