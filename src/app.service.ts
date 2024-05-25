import { KeyStonePoint, StoneColorType, StonePoint, checkStones } from './lib/omok';
import { RequestCode, ResponseCode } from './lib/code.enum';

import { Injectable } from '@nestjs/common';
import { v4 } from 'uuid';

type PlayerType = {
  key: string;
  name: string;
  color: StoneColorType;
}

type RoomType = {
  player1: PlayerType;
  player2: PlayerType;
  placedStones: KeyStonePoint;
};

@Injectable()
export class AppService {
  private roomCnt = 0;
  private rooms: { [code: number]: RoomType } = {};
  private playerRoomDict: { [uid: string]: number } = {};

  async getAIPlacedStone(
    uid: string,
    key: string,
    reqCode: number,
    index: number,
    x: number,
    y: number,
  ): Promise<{
    code: number;
    placedStones: StonePoint[];
    highlightStones: StonePoint[];
    illegalPositions?: string[];
    scores?: { [key: string]: number };
  }> {
    const placedStones: StonePoint[] = [];
    const highlightStones: StonePoint[] = [];
    let illegalPositions: string[] = [];

    let room;
    let roomCnt = this.playerRoomDict[uid];
    if (roomCnt === undefined) {
      roomCnt = ++this.roomCnt;
      this.playerRoomDict[uid] = roomCnt;
    }
    if (reqCode <= RequestCode.START_WHITE) {
      // 시작할 때 방을 초기화
      const playerColor: StoneColorType = reqCode === RequestCode.START_BLACK ? 0 : 1;
      const aiColor: StoneColorType = reqCode === RequestCode.START_BLACK ? 1 : 0;
      room = {
        player1: { key, name: '', color: playerColor },
        player2: { key: v4().replace(/-/g, ''), name: 'AI', color: aiColor },
        placedStones: {},
      };
      this.rooms[roomCnt] = room;
    } else {
      room = this.rooms[roomCnt];
    }

    if (!room) {
      // ERROR:: 진행 중인데 방이 없는 경우
      return {
        code: ResponseCode.ERROR_ROOM_DOES_NOT_EXIST_FOR_THE_PLAYER_TO_JOIN,
        placedStones,
        highlightStones,
      };
    } else if (room.player1.key !== key && room.player2.key !== key) {
      // ERROR:: 플레이어의 고유키가 일치하지 않을 경우
      return {
        code: ResponseCode.ERROR_PLAYER_INFORMATION_DOES_NOT_MATCH_FOR_ROOM_ENTRY,
        placedStones,
        highlightStones,
      };
    }

    if (reqCode === RequestCode.SURRENDER) {
      // DEFEAT:: 게임을 포기했을 경우
      return { code: ResponseCode.DEFEAT_SURRENDER, placedStones, highlightStones };
    }

    let code = ResponseCode.PROCESSING;
    let scores: { [key: string]: number } | undefined;
    if (index !== 0) {
      // 플레이어가 둔 수
      const placedStone = { color: room.player1.color, index: index++, x, y };
      const placed = `${placedStone.y},${placedStone.x}`;
      if (this.rooms[roomCnt].placedStones[`${y},${x}`]) {
        // ERROR:: 플레이어가 두려는 곳에 다른 돌이 놓여져 있음
        return {
          code: ResponseCode.ERROR_STONE_ALREADY_PLACED_AT_THIS_POSITION,
          placedStones,
          highlightStones,
        };
      }
      placedStones.push(placedStone);
      this.rooms[roomCnt].placedStones[placed] = placedStone;

      // 플레이어가 둔 수를 체크하고 게임이 끝났으면 종료
      const {
        code: checkCode,
        highlightStones: _highlightStones,
        illegalPositions: _illegalPositions,
        scores: _scores,
      } = checkStones(this.rooms[roomCnt].placedStones, room.player1.color);
      if (checkCode !== ResponseCode.PROCESSING) {
        return {
          code: checkCode,
          placedStones,
          highlightStones: _highlightStones,
          illegalPositions: _illegalPositions,
        };
      }
      illegalPositions = _illegalPositions;
      scores = _scores;
    }

    // AI 차례
    if (index === 0) {
      // AI의 첫 수는 7,7 위치에 둠
      const placedStone = { color: room.player2.color, index: 1, x: 7, y: 7 };
      const placed = `${placedStone.y},${placedStone.x}`;
      placedStones.push(placedStone);
      this.rooms[roomCnt].placedStones[placed] = placedStone;
    } else {
      // AI 수 계산
      const startedAt = Date.now();

      const placedStone = { color: room.player2.color, index: index++, x: -1, y: -1 };
      if (scores) {
        let higher = 0;
        let higherKeys = [];
        for (const key in scores) {
          if (scores[key] === Infinity) {
            continue;
          }
          if (scores[key] > higher) {
            higher = scores[key];
            higherKeys = [];
          }
          if (scores[key] === higher) {
            higherKeys.push(key);
          }
        }
        const key = higherKeys[Math.floor(Math.random() * higherKeys.length)];
        const [y, x] = key.split(',').map((value) => Number(value));
        placedStone.x = x;
        placedStone.y = y;
      }
      const placed = `${placedStone.y},${placedStone.x}`;
      placedStones.push(placedStone);
      this.rooms[roomCnt].placedStones[placed] = placedStone;

      // AI의 수를 체크하고 게임이 끝났으면 종료
      const {
        code: checkCode,
        highlightStones: _highlightStones,
        illegalPositions: _illegalPositions,
        scores: _scores,
      } = checkStones(this.rooms[roomCnt].placedStones, room.player2.color);
      code = checkCode;
      illegalPositions = _illegalPositions;
      scores = _scores;
      highlightStones.push(..._highlightStones);

      // 계산하는데 시간이 조금 걸리는 것처럼 보이는 트릭
      const delay = Math.floor(250 + 150 * Math.random()) - (Date.now() - startedAt);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(() => resolve(true), delay));
      }
    }

    return { code, placedStones, highlightStones, illegalPositions, scores };
  }
}
