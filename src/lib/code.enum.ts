export const RequestCode = {
  // 플레이어 흑돌 시작
  START_BLACK: 0,
  // 플레이어 백돌 시작 (AI 진행)
  START_WHITE: 1,

  // 플레이어 진행
  PROCESSING: 10,
  // 게임 포기
  SURRENDER: 11,
};

export const ResponseCode = {
  // 게임 대기 중
  WAITING: 0,

  // 현재 상태
  PROCESSING: 100,            // 진행 중
  VICTORY_BLACK: 101,         // 흑돌 승
  VICTORY_WHITE: 102,         // 백돌 승
  DEFEAT_SURRENDER: 103,      // 패배 항복
  DEFEAT_TIMEOUT: 104,        // 패배 시간초과
  DEFEAT_DISCONNECT: 105,     // 패배 연결 끊김

  // 금지룰
  THREExTHREE: 200,           // 3x3 금지
  THREExTHREE_BALCK_ONLY: 201,// 3x3 흑만 금지
  FOURxTHREE: 202,            // 4x3 금지
  FOURxFOUR: 203,             // 4x4 금지
  FOURxFOUR_BLACK_ONLY: 204,  // 4x4 흑만 금지
  FOURxTHREExTHREE: 205,      // 4x3x3 금지
  FOURxFOURxTHREE: 206,       // 4x4x3 금지
  OVER_STONES: 207,           // 장목(6개 이상 이어지는 것) 금지
  OVER_STONES_CONTINUE: 208,  // 장목(6개 이상 이어지는 것) 게임 속행

  // 에러
  ERROR_UNKNOWN: 500,
  ERROR_ROOM_DOES_NOT_EXIST_FOR_THE_PLAYER_TO_JOIN: 501,
  ERROR_PLAYER_INFORMATION_DOES_NOT_MATCH_FOR_ROOM_ENTRY: 502,
  ERROR_STONE_ALREADY_PLACED_AT_THIS_POSITION: 503,
};
