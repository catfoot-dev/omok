import { ResponseCode } from "./code.enum";

export type StoneColorType = 0 | 1;

export type StonePoint = {
  color: StoneColorType;
  index: number;
  x: number;
  y: number;
};

export type KeyStonePoint = {
  [key: string]: StonePoint;
};

export type StoneType = {
  placed: KeyStonePoint;
  upcoming?: StonePoint | null;
};

type ScoreType = {
  score: number;
  count: {
    tl: number; t: number; tr: number;
    l: number; /*-center-*/ r: number;
    bl: number; b: number; br: number;
  };
};

const GRID_COUNT = 15;

export function checkStones(stones: KeyStonePoint, color: StoneColorType): {
  code: number;
  highlightStones: StonePoint[];
  illegalPositions: string[];
  scores?: { [key: string]: number };
} {
  const blackScores: { [key: string]: number } = {};
  const whiteScores: { [key: string]: number } = {};
  const black3x3: { [key: string]: number } = {};
  const white3x3: { [key: string]: number } = {};
  for (const key in stones) {
    const stone = stones[key];
    let leftCnt = 0;
    let rightCnt = 0;
    let upCnt = 0;
    let downCnt = 0;
    let leftUpCnt = 0;
    let leftDownCnt = 0;
    let rightUpCnt = 0;
    let rightDownCnt = 0;
    let leftEndKey = '';
    let rightEndKey = '';
    let upEndKey = '';
    let downEndKey = '';
    let leftUpEndKey = '';
    let leftDownEndKey = '';
    let rightUpEndKey = '';
    let rightDownEndKey = '';
    for (let k = 1; k < 5; k++) {
      const stoneLeft = stones[`${stone.y},${stone.x - k}`];
      const stoneRight = stones[`${stone.y},${stone.x + k}`];
      const stoneUp = stones[`${stone.y - k},${stone.x}`];
      const stoneDown = stones[`${stone.y + k},${stone.x}`];
      const stoneLeftUp = stones[`${stone.y - k},${stone.x - k}`];
      const stoneLeftDown = stones[`${stone.y + k},${stone.x - k}`];
      const stoneRightUp = stones[`${stone.y - k},${stone.x + k}`];
      const stoneRightDown = stones[`${stone.y + k},${stone.x + k}`];
      if (leftCnt + 1 === k) {
        if (stoneLeft?.color === stone.color) leftCnt++;
        else if (stoneLeft) leftCnt -= .5;
        else if (!leftEndKey) leftEndKey = `${stone.y},${stone.x - k}`;
      }
      if (rightCnt + 1 === k) {
        if (stoneRight?.color === stone.color) rightCnt++;
        else if (stoneRight) rightCnt -= .5;
        else if (!rightEndKey) rightEndKey = `${stone.y},${stone.x + k}`;
      }
      if (upCnt + 1 === k) {
        if (stoneUp?.color === stone.color) upCnt++;
        else if (stoneUp) upCnt -= .5;
        else if (!upEndKey) upEndKey = `${stone.y - k},${stone.x}`;
      }
      if (downCnt + 1 === k) {
        if (stoneDown?.color === stone.color) downCnt++;
        else if (stoneDown) downCnt -= .5;
        else if (!downEndKey) downEndKey = `${stone.y + k},${stone.x}`;
      }
      if (leftUpCnt + 1 === k) {
        if (stoneLeftUp?.color === stone.color) leftUpCnt++;
        else if (stoneLeftUp) leftUpCnt -= .5;
        else if (!leftUpEndKey) leftUpEndKey = `${stone.y - k},${stone.x - k}`;
      }
      if (leftDownCnt + 1 === k) {
        if (stoneLeftDown?.color === stone.color) leftDownCnt++;
        else if (stoneLeftDown) leftDownCnt -= .5;
        else if (!leftDownEndKey) leftDownEndKey = `${stone.y + k},${stone.x - k}`;
      }
      if (rightUpCnt + 1 === k) {
        if (stoneRightUp?.color === stone.color) rightUpCnt++;
        else if (stoneRightUp) rightUpCnt -= .5;
        else if (!rightUpEndKey) rightUpEndKey = `${stone.y - k},${stone.x + k}`;
      }
      if (rightDownCnt + 1 === k) {
        if (stoneRightDown?.color === stone.color) rightDownCnt++;
        else if (stoneRightDown) rightDownCnt -= .5;
        else if (!rightDownEndKey) rightDownEndKey = `${stone.y + k},${stone.x + k}`;
      }
    }
    if (
      Math.ceil(leftCnt + rightCnt) === 4 ||
      Math.ceil(upCnt + downCnt) === 4 ||
      Math.ceil(leftUpCnt + rightDownCnt) === 4 ||
      Math.ceil(rightUpCnt + leftDownCnt) === 4
    ) {
      // 승리
      return {
        code: stone.color === 0
          ? ResponseCode.VICTORY_BLACK
          : ResponseCode.VICTORY_WHITE,
        highlightStones: [],
        illegalPositions: [],
      };
    }
    if (leftEndKey) {
      const cnt = leftCnt + rightCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[leftEndKey]) black3x3[leftEndKey] = 0;
          black3x3[leftEndKey]++;
        }
        if (!blackScores[leftEndKey]) blackScores[leftEndKey] = 0;
        blackScores[leftEndKey] = Math.max(blackScores[leftEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[leftEndKey]) white3x3[leftEndKey] = 0;
          white3x3[leftEndKey]++;
        }
        if (!whiteScores[leftEndKey]) whiteScores[leftEndKey] = 0;
        whiteScores[leftEndKey] = Math.max(whiteScores[leftEndKey], cnt);
      }
    }
    if (rightEndKey) {
      const cnt = leftCnt + rightCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[rightEndKey]) black3x3[rightEndKey] = 0;
          black3x3[rightEndKey]++;
        }
        if (!blackScores[rightEndKey]) blackScores[rightEndKey] = 0;
        blackScores[rightEndKey] = Math.max(blackScores[rightEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[rightEndKey]) white3x3[rightEndKey] = 0;
          white3x3[rightEndKey]++;
        }
        if (!whiteScores[rightEndKey]) whiteScores[rightEndKey] = 0;
        whiteScores[rightEndKey] = Math.max(whiteScores[rightEndKey], cnt);
      }
    }
    if (upEndKey) {
      const cnt = upCnt + downCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[upEndKey]) black3x3[upEndKey] = 0;
          black3x3[upEndKey]++;
        }
        if (!blackScores[upEndKey]) blackScores[upEndKey] = 0;
        blackScores[upEndKey] = Math.max(blackScores[upEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[upEndKey]) white3x3[upEndKey] = 0;
          white3x3[upEndKey]++;
        }
        if (!whiteScores[upEndKey]) whiteScores[upEndKey] = 0;
        whiteScores[upEndKey] = Math.max(whiteScores[upEndKey], cnt);
      }
    }
    if (downEndKey) {
      const cnt = upCnt + downCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[downEndKey]) black3x3[downEndKey] = 0;
          black3x3[downEndKey]++;
        }
        if (!blackScores[downEndKey]) blackScores[downEndKey] = 0;
        blackScores[downEndKey] = Math.max(blackScores[downEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[downEndKey]) white3x3[downEndKey] = 0;
          white3x3[downEndKey]++;
        }
        if (!whiteScores[downEndKey]) whiteScores[downEndKey] = 0;
        whiteScores[downEndKey] = Math.max(whiteScores[downEndKey], cnt);
      }
    }
    if (leftUpEndKey) {
      const cnt = leftUpCnt + rightDownCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[leftUpEndKey]) black3x3[leftUpEndKey] = 0;
          black3x3[leftUpEndKey]++;
        }
        if (!blackScores[leftUpEndKey]) blackScores[leftUpEndKey] = 0;
        blackScores[leftUpEndKey] = Math.max(blackScores[leftUpEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[leftUpEndKey]) white3x3[leftUpEndKey] = 0;
          white3x3[leftUpEndKey]++;
        }
        if (!whiteScores[leftUpEndKey]) whiteScores[leftUpEndKey] = 0;
        whiteScores[leftUpEndKey] = Math.max(whiteScores[leftUpEndKey], cnt);
      }
    }
    if (leftDownEndKey) {
      const cnt = rightUpCnt + leftDownCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[leftDownEndKey]) black3x3[leftDownEndKey] = 0;
          black3x3[leftDownEndKey]++;
        }
        if (!blackScores[leftDownEndKey]) blackScores[leftDownEndKey] = 0;
        blackScores[leftDownEndKey] = Math.max(blackScores[leftDownEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[leftDownEndKey]) white3x3[leftDownEndKey] = 0;
          white3x3[leftDownEndKey]++;
        }
        if (!whiteScores[leftDownEndKey]) whiteScores[leftDownEndKey] = 0;
        whiteScores[leftDownEndKey] = Math.max(whiteScores[leftDownEndKey], cnt);
      }
    }
    if (rightUpEndKey) {
      const cnt = rightUpCnt + leftDownCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[rightUpEndKey]) black3x3[rightUpEndKey] = 0;
          black3x3[rightUpEndKey]++;
        }
        if (!blackScores[rightUpEndKey]) blackScores[rightUpEndKey] = 0;
        blackScores[rightUpEndKey] = Math.max(blackScores[rightUpEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[rightUpEndKey]) white3x3[rightUpEndKey] = 0;
          white3x3[rightUpEndKey]++;
        }
        if (!whiteScores[rightUpEndKey]) whiteScores[rightUpEndKey] = 0;
        whiteScores[rightUpEndKey] = Math.max(whiteScores[rightUpEndKey], cnt);
      }
    }
    if (rightDownEndKey) {
      const cnt = leftUpCnt + rightDownCnt + (stone.color === color ? .9 : 1);
      if (stone.color === 0) {
        if (Math.ceil(cnt) === 2) {
          if (!black3x3[rightDownEndKey]) black3x3[rightDownEndKey] = 0;
          black3x3[rightDownEndKey]++;
        }
        if (!blackScores[rightDownEndKey]) blackScores[rightDownEndKey] = 0;
        blackScores[rightDownEndKey] = Math.max(blackScores[rightDownEndKey], cnt);
      } else {
        if (Math.ceil(cnt) === 2) {
          if (!white3x3[rightDownEndKey]) white3x3[rightDownEndKey] = 0;
          white3x3[rightDownEndKey]++;
        }
        if (!whiteScores[rightDownEndKey]) whiteScores[rightDownEndKey] = 0;
        whiteScores[rightDownEndKey] = Math.max(whiteScores[rightDownEndKey], cnt);
      }
    }
  }

  const scores: { [key: string]: number } = {};
  for (const key in blackScores) {
    if (color === 0 && blackScores[key] <= 2) {
      blackScores[key] = .9;
    }
    scores[key] = blackScores[key];
  }
  for (const key in whiteScores) {
    if (color === 1 && whiteScores[key] <= 2) {
      whiteScores[key] = .9;
    }
    scores[key] = Math.max(whiteScores[key], (scores[key] || 0));
  }

  const illegalPositions: string[] = [];
  for (const key in black3x3) {
    if (black3x3[key] === 4) {
      illegalPositions.push(key);
      scores[key] = -Infinity;
    }
  }
  for (const key in white3x3) {
    if (white3x3[key] === 4) {
      illegalPositions.push(key);
      scores[key] = -Infinity;
    }
  }

  return {
    code: ResponseCode.PROCESSING,
    highlightStones: [],
    illegalPositions,
    scores,
  };
}
