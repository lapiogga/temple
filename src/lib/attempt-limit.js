// 무차별 대입 방지 — 키별 실패 횟수 제한.
//
// 프로세스 메모리에 둔다. 서버가 한 대라 지금은 이걸로 충분하지만 한계는 분명하다.
//  · 재시작하면 초기화된다.
//  · 서버를 늘리면 인스턴스마다 따로 센다.
// 여러 대로 늘리는 시점에 DB/Redis 로 옮겨야 한다.
//
// nginx 의 limit_req 와는 층이 다르다. 저쪽은 IP 기준이라 한 IP 가 여러 계정을
// 훑는 것과 여러 IP 가 한 계정을 훑는 것을 구분하지 못한다. 이쪽은 계정 기준이다.
// 둘 다 있어야 양쪽을 막는다.

// 키를 공격자가 정할 수 있는 곳(로그인 아이디 등)에서 쓰면 Map 이 무한히 커진다.
// 창이 지난 항목을 먼저 버리고, 그래도 넘치면 오래된 것부터 버린다.
const MAX_KEYS = 5000;

export function createAttemptLimiter({ windowMs, max }) {
  const hits = new Map();

  function prune(now) {
    for (const [k, e] of hits) {
      if (now - e.first > windowMs) hits.delete(k);
    }
    if (hits.size <= MAX_KEYS) return;
    // Map 은 삽입 순서를 지키므로 앞쪽이 가장 오래된 것이다.
    const excess = hits.size - MAX_KEYS;
    let i = 0;
    for (const k of hits.keys()) {
      if (i++ >= excess) break;
      hits.delete(k);
    }
  }

  return {
    // 지금 막혀 있는가.
    blocked(key) {
      const e = hits.get(key);
      if (!e) return false;
      if (Date.now() - e.first > windowMs) {
        hits.delete(key);
        return false;
      }
      return e.count >= max;
    },

    // 실패 1회 기록.
    recordFail(key) {
      const now = Date.now();
      const e = hits.get(key);
      if (!e || now - e.first > windowMs) {
        prune(now);
        hits.set(key, { count: 1, first: now });
      } else {
        e.count += 1;
      }
    },

    // 성공했으면 지운다 — 정상 사용자가 다음에 막히지 않게.
    clear(key) {
      hits.delete(key);
    },
  };
}
