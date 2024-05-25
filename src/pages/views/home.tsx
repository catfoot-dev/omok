import * as React from 'react';

import { RequestCode, ResponseCode } from 'src/lib/code.enum';
import { StoneColorType, StonePoint, StoneType, checkStones } from 'src/lib/omok';
import styled, { css } from 'styled-components';

import { NextPageContext } from 'next';
import { v4 } from 'uuid';

const GRID_COUNT = 15;
const POINT_SIZE = 30;
const POINT_HALF_SIZE = Math.floor(POINT_SIZE / 2);
const POINTS = [3, 7, 11];
const STONE_COLOR = { 0: '#000', 1: '#fff' };
const STONE_BORDER_COLOR = { 0: '#555', 1: '#aaa' };
const TURN = { 0: '흑돌', 1: '백돌' };
const GAME_MODE = {
  ONLINE: 0,
  OFFLINE: 1,
  AI: 2,
};
const STATE = {
  WAITING: 0,
  PLAYER_TURN: 1,
  ENEMY_TURN: 2,
  VICTORY: 3,
  DEFEAT: 4,
  ERROR: 5,
};

const Stone = styled.div<{
  $color: string;
  $border: string;
  $isHide?: boolean;
  $isShowIndex?: boolean;
  $isPointCursor?: boolean;
  $isHighlight?: boolean;
}>`
  ${props => css`
    cursor: ${props.$isPointCursor ? 'pointer' : 'default'};
    color: ${props.$isShowIndex ? '#fff' : 'transparent'};
    position: relative;
    display: ${props.$isHide ? 'none' : 'flex'};
    justify-content: center;
    align-items: center;
    margin: 2px;
    width: ${POINT_SIZE - 6}px;
    height: ${POINT_SIZE - 6}px;
    border-radius: 50%;
    border: ${props.$isHighlight ? `solid 2px #fffc70` : `solid 1px ${props.$border}`};
    font-size: 11px;
    ${props.$isShowIndex ? 'text-shadow: 0 0 3px #000;' : ''}
    background-color: ${props.$color};
    box-shadow: inset -2px -2px 5px ${props.$border},
                1px 1px 3px #4e4e4e;
    user-select: none;

    &::after {
      content: '';
      position: absolute;
      top: 5px;
      left: 5px;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background-color: rgba(255,255,255,.5);
    }
  `}
`;

const NotAllow = styled.div`
  cursor: not-allowed;
  width: ${POINT_SIZE}px;
  height: ${POINT_SIZE}px;

  &::after {
    content: '\\00d7';
    color: red;
    display: flex;
    justify-content: center;
    align-items: center;
    margin: 2px 0 0 1px;
    font-size: 24px;
  }
`;

const Grid = styled.div<{
  $isPointCursor: boolean;
  $isRowBegin: boolean;
  $isRowEnd: boolean;
  $isColumnBegin: boolean;
  $isColumnEnd: boolean;
  $isDot?: boolean;
}>`
  ${props => css`
    cursor: ${props.$isPointCursor ? 'pointer' : 'default'};
    width: ${POINT_SIZE}px;
    height: ${POINT_SIZE}px;
    background-repeat: no-repeat;
    background-image:
      ${props.$isRowBegin ? '' : 'linear-gradient(to right, #000 1px, transparent 1px),'}
      ${props.$isRowEnd ? '' : 'linear-gradient(to right, #000 1px, transparent 1px),'}
      ${props.$isColumnBegin ? '' : 'linear-gradient(to bottom, #000 1px, transparent 1px),'}
      ${props.$isColumnEnd ? '' : 'linear-gradient(to bottom, #000 1px, transparent 1px),'}
      ${props.$isDot
        ? 'radial-gradient(#000 2px, transparent 3px);'
        : 'linear-gradient(transparent 0, transparent 0);'}
    background-position:
      ${props.$isRowBegin ? '' : `${POINT_HALF_SIZE}px 0px,`}
      ${props.$isRowEnd ? '' : `${POINT_HALF_SIZE}px ${POINT_HALF_SIZE}px,`}
      ${props.$isColumnBegin ? '' : `0 ${POINT_HALF_SIZE}px,`}
      ${props.$isColumnEnd ? '' : `${POINT_HALF_SIZE}px ${POINT_HALF_SIZE}px,`}
      ${(POINT_HALF_SIZE + 1) / 2 - .5}px ${(POINT_HALF_SIZE + 1) / 2 - .5}px;
    background-size: ${POINT_HALF_SIZE + 1}px ${POINT_HALF_SIZE + 1}px;
  `}
`;

const OptionRow = styled.div`
  display: flex;
  flex-direction: row;
  min-height: 17px;
  font-size: 12px;
`;

const ResultDialog = styled.div<{}>`
  ${props => css`
    position: absolute;
    top: calc(50% - 80px);
    left: 0;
    right: 0;
    bottom: calc(50% - 80px);
    text-align: center;
    background: #efefef;
    box-shadow: 0 3px 10px rgba(0,0,0,.5);

    h1 {
      position: relative;
      margin: -64px 0 0;
      width: 100%;
      height: 180px;
      text-align: center;
      font-size: 127px;
      font-family: JSArirang-Regular;
      user-select: none;

      .shadow {
        position: absolute;
        width: 100%;

        &.black {
          text-shadow: 0 0 5px rgba(255,255,255,.5);
        }
        &.white {
          text-shadow: 0 0 5px rgba(0,0,0,.5);
        }
      }

      .display-text {
        position: absolute;
        width: 100%;
        
        .black {
          background: -webkit-linear-gradient(#0c0c0c 45%, #f3f3f3);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .white {
          background: -webkit-linear-gradient(#f3f3f3 45%, #0c0c0c);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .result {
          background: -webkit-linear-gradient(#45a9f5 35%, #333);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      }
    }

    button {
      cursor: pointer;
      color: #fff;
      padding: 5px 0;
      width: 100px;
      border: 0;
      border-radius: 0;
      font-size: 14px;
      font-weight: 600;
      font-family: JSArirang-Regular;
      background: #45a9f5;
      outline: none;
    }
  `}
`;

const BrushStyleButton = styled.button<{
  $isPointCursor: boolean;
  $color: string;
  $bgColor: string;
}>`
  ${props => css`
    position: relative;
    display: inline-block;
    cursor: ${props.$isPointCursor ? 'pointer' : 'default'};
    color: ${props.$color};
    padding: 5px 0;
    width: 100%;
    height: 29px;
    border: 0;
    border-radius: 0;
    font-size: 14px;
    font-family: 'JSArirang-Regular';
    background: ${props.$bgColor};
    outline: none;
    transition: all .3s ease;

    :hover {
      opacity: .9;
    }
  `}
`;

const Board = ({
  isPlaying,
  isShowIndex,
  turn,
  stones,
  highlightKeys,
  illegalKeys,
  scores,
  replayIdx,
  onPutStone
}: {
  isPlaying: boolean;
  isShowIndex: boolean;
  turn: StoneColorType;
  stones: StoneType;
  highlightKeys: string[];
  illegalKeys: string[];
  scores: { [key: string]: number };
  replayIdx: number;
  onPutStone: (x: number, y: number) => void;
}) => {
  const [hover, setHover] = React.useState<StonePoint>({
    color: turn, index: -1, x: -1, y: -1,
  });
  return (
    <div style={{ position: 'relative' }}>
      <div
        style={{
          display: 'flex',
          color: '#fff',
          position: 'absolute',
          top: 0,
          left: '8px',
          marginTop: '-15px',
          textAlign: 'center',
          textShadow: '0 0 3px #000',
          fontSize: '11px',
          userSelect: 'none',
        }}
      >
        {Array(GRID_COUNT).fill(0).map((_, i) => (
          <div key={`coord-column-${i}`} style={{ width: `${POINT_SIZE}px` }}>{i}</div>
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          color: '#fff',
          position: 'absolute',
          top: '18px',
          left: 0,
          marginLeft: '-14px',
          textAlign: 'center',
          textShadow: '0 0 3px #000',
          fontSize: '11px',
          userSelect: 'none',
        }}
      >
        {Array(GRID_COUNT).fill(0).map((_, i) => (
          <div key={`coord-row-${i}`} style={{ height: `${POINT_SIZE}px` }}>{i}</div>
        ))}
      </div>
      <div
        style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          padding: '5px',
          width: POINT_SIZE * GRID_COUNT + 'px',
          height: POINT_SIZE * GRID_COUNT + 'px',
          border: 'solid 2px #000',
          boxShadow: '1px 1px 2px #333',
          backgroundColor: '#bf884a',
        }}
        onMouseLeave={() => setHover({ color: turn, index: -1, x: -1, y: -1 })}
      >
        {Array(GRID_COUNT).fill(0).map((_, i) => 
          Array(GRID_COUNT).fill(0).map((_, j) => {
            const pointKey = `${i},${j}`;
            const isHover = hover.x === j && hover.y === i;
            const placedStone = stones.placed[pointKey];
            const isPosiblePutStone =
              !placedStone &&
              !stones.upcoming &&
              !illegalKeys.includes(pointKey) &&
              isPlaying &&
              isHover;
            let stone;
            if (placedStone) {
              // 돌 놓여진 자리
              const color = placedStone.color;
              stone =
                <Stone
                  $color={STONE_COLOR[color]}
                  $border={STONE_BORDER_COLOR[color]}
                  $isHide={isShowIndex && placedStone.index > replayIdx}
                  $isShowIndex={isShowIndex}
                  $isHighlight={highlightKeys.includes(pointKey)}
                >
                  {placedStone.index}
                </Stone>;
            } else if (illegalKeys.includes(pointKey)) {
              stone = <NotAllow />;
            } else if (stones.upcoming) {
              if (stones.upcoming.x === j && stones.upcoming.y === i) {
                const color = stones.upcoming.color;
                stone =
                  <Stone
                    $color={color ? 'rgba(255,255,255,.95)' : 'rgba(0,0,0,.95)'}
                    $border="#ff4713"
                  />;
              }
            } else if (isPosiblePutStone) {
              // 플레이어 턴에 두려고 하는 자리
              stone =
                <Stone
                  $isPointCursor={true}
                  $color={turn ? 'rgba(255,255,255,.95)' : 'rgba(0,0,0,.95)'}
                  $border="#ff4713"
                />;
            } else if (scores[pointKey]) {
              stone = 
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    width: POINT_SIZE + 'px',
                    height: POINT_SIZE + 'px',
                    textShadow: '0 0 3px #fff',
                    fontSize: '10px',
                  }}
                >
                  {scores[pointKey]}
                </div>;
            }
            // 모서리를 계산해서 격자를 그림
            return (
              <Grid
                key={pointKey}
                $isPointCursor={isPosiblePutStone}
                $isRowBegin={i === 0}
                $isRowEnd={i === 14}
                $isColumnBegin={j === 0}
                $isColumnEnd={j === 14}
                $isDot={POINTS.includes(i) && POINTS.includes(j)}
                onMouseOver={() => setHover({ color: turn, index: -1, x: j, y: i })}
                onClick={() => isPosiblePutStone && onPutStone(j, i)}
              >
                {stone}
              </Grid>
            );
          })
        )}
      </div>
    </div>
  );
}

const RadioButton = ({
  name,
  context,
  disabled,
  checked,
  onClick,
}: {
  name: string;
  context: any;
  disabled?: boolean;
  checked: boolean;
  onClick: () => void;
}) => (
  <label
    style={{
      cursor: disabled ? 'default' : 'pointer',
      marginLeft: '5px',
    }}
  >
    <input
      type="radio"
      name={name}
      disabled={disabled}
      defaultChecked={checked}
      onClick={onClick}
      style={{ margin: '0 0 4px', verticalAlign: 'middle' }}
    /> {context}
  </label>
)

const Home = (props: { uid: string }) => {
  const logRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [uid, setUid] = React.useState(props.uid);
  const [key, setKey] = React.useState('');
  const [state, setState] = React.useState(STATE.WAITING);
  const [gameMode, setGameMode] = React.useState(GAME_MODE.AI);
  const [playerTurn, setPlayerTurn] = React.useState<StoneColorType>(0);
  const [turn, setTurn] = React.useState<StoneColorType | -1>(-1);
  const [stones, setStones] = React.useState<StoneType>({ placed: {} });
  const [highlightKeys, setHighlighKeys] = React.useState<string[]>([]);
  const [illegalKeys, setIllegalKeys] = React.useState<string[]>([]);
  const [scores, setScores] = React.useState<{ [key: string]: number }>({});
  const [index, setIndex] = React.useState(0);
  const [replayIdx, setReplayIdx] = React.useState(0);
  const [startedAt, setStartedAt] = React.useState(0);
  const [logs, setLogs] = React.useState('');
  const [winner, setWinner] = React.useState<StoneColorType>(0);
  const [isShowResultDialog, setShowResultDialog] = React.useState(false);

  React.useEffect(() => {
    const data = localStorage.getItem('omok');
    if (data) {
      const { uid, key } = JSON.parse(data);
      setUid(uid);
      setKey(key);
    } else {
      const key = v4().replace(/-/g, '');
      setKey(key);
      localStorage.setItem('omok', JSON.stringify({ uid, key }));
    }
  }, []);

  React.useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  function addLog(log: string) {
    const time = log.startsWith(' -')
      ? '' : ` - ${((Date.now() - (startedAt || Date.now())) / 1000).toFixed(1)}s`;
    setLogs((prev) =>
      `${prev}\n${log}${time}`,
    );
  }

  function onPutStone(x: number, y: number) {
    const color = turn as StoneColorType;
    const nextIndex = index + 1;
    if (gameMode === GAME_MODE.OFFLINE) {
      const newStone = { ...stones };
      newStone.placed[`${y},${x}`] = {
        color,
        index: nextIndex,
        x, y,
      };
      const { code, highlightStones, illegalPositions } = checkStones(newStone.placed, color);
      addLog(`${nextIndex}. ${turn ? '백' : '흑'} 착수(${y},${x})`);
      processResponseCode(code);
      setStones(newStone);
      setHighlighKeys(() => highlightStones.map((stone) => `${stone.y},${stone.x}`));
      setIllegalKeys(illegalPositions ?? []);
    } else {
      setStones((prev) => {
        prev.upcoming = {
          color,
          index: nextIndex,
          x, y,
        };
        return { ...prev };
      });
      sendPutPoint(
        nextIndex === 1 ? RequestCode.START_BLACK : RequestCode.PROCESSING,
        nextIndex, x, y,
      );
    }
  }

  function start() {
    if (state !== STATE.WAITING) {
      return;
    }
    setStartedAt(() => Date.now());
    setLogs(` - 게임을 시작합니다 -`);
    if (gameMode === GAME_MODE.OFFLINE) {
      setTurn(0);
      setState(STATE.PLAYER_TURN);
    } else {
      setTurn(playerTurn);
      if (playerTurn === 0) {
        setState(STATE.PLAYER_TURN);
      } else {
        sendPutPoint(RequestCode.START_WHITE, index, -1, -1);
      }
    }
  }

  function surrender() {
    if (state !== STATE.PLAYER_TURN) {
      return;
    }
    if (gameMode === GAME_MODE.OFFLINE) {
      setState(STATE.VICTORY);
    } else {
      sendPutPoint(RequestCode.SURRENDER, index, -1, -1);
    }
  }

  function restart() {
    setStartedAt(0);
    setState(STATE.WAITING);
    setTurn(-1);
    setStones({ placed: {} });
    setHighlighKeys([]);
    setLogs('');
    setIndex(0);
  }

  function processResponseCode(code: number): number {
    let state = code;
    switch (code) {
      case ResponseCode.VICTORY_BLACK:
        state = STATE.VICTORY;
        setWinner(0);
        addLog(` - 흑 승리! -`);
        break;
      case ResponseCode.VICTORY_WHITE:
        state = STATE.VICTORY;
        setWinner(1);
        addLog(` - 백 승리! -`);
        break;
      case ResponseCode.DEFEAT_SURRENDER:
        state = STATE.DEFEAT;
        break;
      case ResponseCode.DEFEAT_TIMEOUT:
        state = STATE.DEFEAT;
        break;
      case ResponseCode.DEFEAT_DISCONNECT:
        state = STATE.DEFEAT;
        break;
      case ResponseCode.ERROR_UNKNOWN:
        state = STATE.ERROR;
        break;
      case ResponseCode.ERROR_ROOM_DOES_NOT_EXIST_FOR_THE_PLAYER_TO_JOIN:
        state = STATE.ERROR;
        break;
      case ResponseCode.ERROR_PLAYER_INFORMATION_DOES_NOT_MATCH_FOR_ROOM_ENTRY:
        state = STATE.ERROR;
        break;
      case ResponseCode.ERROR_STONE_ALREADY_PLACED_AT_THIS_POSITION:
        state = STATE.ERROR;
        break;
      default:
        state = STATE.PLAYER_TURN;
        break;
    }
    if (state === STATE.VICTORY || state === STATE.DEFEAT) {
      setTimeout(() => {
        setState(state);
        setReplayIdx(index + 1);
        setShowResultDialog(true);
      }, 250);
    } else {
      if (state === STATE.PLAYER_TURN) {
        setTurn((prev) => prev === 0 ? 1 : 0);
        setIndex((prev) => prev + 1);
      }
      setState(state);
    }
    return state;
  }

  async function sendPutPoint(
    reqCode: number, index: number, x: number, y: number, tryCnt = 0,
  ) {
    if (tryCnt > 5) {
      return;
    }
    if (reqCode === RequestCode.START_BLACK || reqCode === RequestCode.PROCESSING) {
      addLog(`${index}. ${turn ? '백' : '흑'} 착수(${y},${x})`);
    }
    setTurn((prev) => prev === 0 ? 1 : 0);
    setState(STATE.ENEMY_TURN);
    setIndex(index);

    try {
      const accessCode = btoa(`${uid}:${key}`);
      const response = await fetch('/put', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode, code: reqCode, index, x, y }),
      });
      if (response.status >= 200 && response.status < 400) {
        const {
          code, placedStones, highlightStones, illegalPositions, scores
        } = await response.json();

        const newStones = { ...stones };
        newStones.upcoming = null;
        for (const stone of placedStones as StonePoint[]) {
          newStones.placed[`${stone.y},${stone.x}`] = stone;
          if (index < stone.index) {
            addLog(`${stone.index}. ${stone.index % 2 ? '흑' : '백'} 착수(${stone.y},${stone.x})`);
          }
        }
        setStones(() => newStones);
        setHighlighKeys(() => highlightStones.map((stone: StonePoint) => `${stone.y},${stone.x}`));
        setIllegalKeys(illegalPositions ?? []);
        // setScores(scores || {});

        processResponseCode(code);
      } else {
        throw new Error(response.status + ': ' + response.statusText);
      }
    } catch (e) {
      setTimeout(() => {
        sendPutPoint(index, x, y, tryCnt + 1);
      }, 500);
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        gap: 20,
      }}
    >
      <Board
        isPlaying={state === STATE.PLAYER_TURN}
        isShowIndex={
          !isShowResultDialog &&
          (state === STATE.VICTORY || state === STATE.DEFEAT)
        }
        turn={turn as StoneColorType}
        stones={stones}
        highlightKeys={highlightKeys}
        illegalKeys={illegalKeys}
        scores={scores}
        replayIdx={replayIdx}
        onPutStone={onPutStone}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 15,
          padding: '15px',
          minWidth: '190px',
          height: '432px',
          border: 'solid 1px #333',
          background: '#fff',
        }}
      >
        <h1
          style={{
            color: '#666',
            margin: '10px 0 20px',
            fontFamily: 'JSArirang-Regular',
            textShadow: '1px 1px 3px #eee',
          }}
        >
          오목
        </h1>
        <OptionRow>
          <div>게임 방법:</div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <RadioButton
              name="mode"
              context="vs 온라인"
              disabled
              checked={gameMode === GAME_MODE.ONLINE}
              onClick={() => setGameMode(GAME_MODE.ONLINE)}
            />
            <RadioButton
              name="mode"
              context="vs 오프라인"
              disabled={state !== STATE.WAITING}
              checked={gameMode === GAME_MODE.OFFLINE}
              onClick={() => setGameMode(GAME_MODE.OFFLINE)}
            />
            <RadioButton
              name="mode"
              context="vs AI"
              disabled={state !== STATE.WAITING}
              checked={gameMode === GAME_MODE.AI}
              onClick={() => setGameMode(GAME_MODE.AI)}
            />
          </div>
        </OptionRow>
        {gameMode === GAME_MODE.ONLINE ? (
          <OptionRow>
            <div>플레이어 이름:</div>
            <div>
              <input type="text" />
            </div>
          </OptionRow>
        ) : gameMode === GAME_MODE.OFFLINE ? (
          <OptionRow>
            <div>플레이어1 vs 플레이어2</div>
          </OptionRow>
        ) : gameMode === GAME_MODE.AI ? (
          <OptionRow>
            <div>플레이어:</div>
            <div>
              <RadioButton
                name="turn"
                context="흑돌"
                disabled={state !== STATE.WAITING}
                checked={playerTurn === 0}
                onClick={() => setPlayerTurn(0)}
              />
              <RadioButton
                name="turn"
                context="백돌"
                disabled={state !== STATE.WAITING}
                checked={playerTurn === 1}
                onClick={() => setPlayerTurn(1)}
              />
            </div>
          </OptionRow>
        ) : undefined}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 5,
          }}
        >
          {state === STATE.VICTORY || state === STATE.DEFEAT ? (
            <>
              <BrushStyleButton
                disabled={replayIdx === 1}
                $isPointCursor={replayIdx > 1}
                $color="#fff"
                $bgColor={replayIdx === 1 ? '#ccc' : '#ffa900'}
                onClick={() => setReplayIdx((prev) => prev - 1)}
              >
                ⇦ 뒷 수
              </BrushStyleButton>
              <BrushStyleButton
                disabled={replayIdx >= index}
                $isPointCursor={replayIdx < index}
                $color="#fff"
                $bgColor={replayIdx >= index ? '#ccc' : '#ffa900'}
                onClick={() => setReplayIdx((prev) => prev + 1)}
              >
                ⇨ 앞 수
              </BrushStyleButton>
            </>
          ) : undefined}
          <BrushStyleButton
            disabled={state === STATE.ENEMY_TURN}
            $isPointCursor={state !== STATE.ENEMY_TURN}
            $color={state === STATE.PLAYER_TURN ? '#ff0' : '#fff'}
            $bgColor={state === STATE.WAITING
              ? '#45a9f5'
              : state === STATE.PLAYER_TURN
                ? '#e22020'
                : state === STATE.ENEMY_TURN
                  ? '#ccc'
                  : '#148b00'}
            onClick={() => {
              if (state === STATE.WAITING) {
                start()
              } else if (state === STATE.PLAYER_TURN) {
                surrender();
              } else {
                restart();
              }
            }}
          >
            {state === STATE.WAITING
              ? '시작하기'
              : state === STATE.PLAYER_TURN
                ? '포기하기'
                : state === STATE.ENEMY_TURN
                  ? '상대방이 두는 중...'
                  : '처음으로'}
          </BrushStyleButton>
        </div>
        <div
          style={{
            margin: '15px 0 0',
            padding: '10px',
            border: 'solid 1px #666',
            borderRadius: '4px',
            fontSize: '12px',
            background: '#efefef',
          }}
        >
          <div>
            {turn === -1
              ? '대기 중'
              : state === STATE.VICTORY
                ? `${winner ? '백' : '흑'}돌 승리!`
                : `${TURN[turn as StoneColorType]}(${
                    state === STATE.PLAYER_TURN
                      ? '플레이어'
                      : 'AI'
                  }) 차례`}
          </div>
          <div style={{ textAlign: 'right' }}>
            {index} 수
          </div>
          <textarea
            ref={logRef}
            disabled
            style={{
              minWidth: '172px',
              maxWidth: '172px',
              minHeight: '130px',
              maxHeight: '130px',
              margin: '5px -5px -10px',
              padding: '3px',
              border: 0,
              borderTop: 'solid 1px #999',
              fontSize: '11px',
              background: '#eee',
              outline: 'none',
            }}
            value={logs}
          />
        </div>
      </div>
      {isShowResultDialog ? (
        <ResultDialog>
          <h1>
            <div className={`shadow ${winner ? 'white' : 'black'}`}>
              {winner ? '백' : '흑'}돌 승리
            </div>
            <div className="display-text">
              <span className={winner ? 'white' : 'black'}>
                {winner ? '백' : '흑'}돌
              </span>
              <span className="result"> 승리</span>
            </div>
          </h1>
          <button onClick={() => setShowResultDialog(false)}>
            확 인
          </button>
        </ResultDialog>
      ) : undefined}
    </div>
  );
};

Home.getInitialProps = (ctx: NextPageContext) => ctx.query;

export default Home;