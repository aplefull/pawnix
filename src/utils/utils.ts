// LIBRARIES
import path from 'ngraph.path';
import createGraph from 'ngraph.graph';
// REDUX
import type { Player, Position } from '@redux';
// CONSTANTS
import { ELEMENTS, PLAYFIELD_INITIAL_STATE, PLAYFIELD_SIZE, gifs, PLAYERS, type TElements } from '@constants';

const isBetween = (num: number, val1: number, val2: number) => {
  const min = Math.min(val1, val2);
  const max = Math.max(val1, val2);

  return num > min && num < max;
};

const notNull = <T>(value: T | null): value is T => {
  return value !== null;
};

const sample = <T>(array: T[]) => {
  return array[Math.floor(Math.random() * array.length)];
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => {
  return UUID_REGEX.test(value);
};

export const isSamePosition = (a: Position, b: Position) => {
  return a.row === b.row && a.col === b.col;
};

export const containsPosition = (positions: Position[], position: Position) => {
  return positions.some((el) => isSamePosition(el, position));
};

const getMoveDirection = (currentPos: Position, desirablePos: Position) => {
  const rowOffset = currentPos.row - desirablePos.row;
  const colOffset = currentPos.col - desirablePos.col;

  switch (true) {
    case rowOffset < 0:
      return 'DOWN';

    case rowOffset > 0:
      return 'UP';

    case colOffset < 0:
      return 'RIGHT';

    case colOffset > 0:
      return 'LEFT';

    default:
      return null;
  }
};

export const isLegalMove = (
  playerOnePos: Position,
  playerTwoPos: Position,
  desirablePos: Position,
  currentPlayer: Player,
  walls: Position[]
) => {
  const currentPlayerPosition = currentPlayer === PLAYERS.PLAYER_1 ? playerOnePos : playerTwoPos;
  const enemyPosition = currentPlayer === PLAYERS.PLAYER_1 ? playerTwoPos : playerOnePos;

  const rowDiff = Math.abs(desirablePos.row - currentPlayerPosition.row);
  const colDiff = Math.abs(desirablePos.col - currentPlayerPosition.col);

  const tooFar = rowDiff + colDiff > 2;
  const samePos = rowDiff + colDiff === 0;
  const enemyObstructing = isSamePosition(desirablePos, enemyPosition);

  if (tooFar || samePos || enemyObstructing) return false;

  const direction = getMoveDirection(currentPlayerPosition, desirablePos);
  if (direction === 'LEFT' || direction === 'RIGHT') {
    return !walls
      .filter((el) => el.row === currentPlayerPosition.row)
      .some((el) => isBetween(el.col, currentPlayerPosition.col, desirablePos.col));
  } else {
    return !walls
      .filter((el) => el.col === currentPlayerPosition.col)
      .some((el) => isBetween(el.row, currentPlayerPosition.row, desirablePos.row));
  }
};

export const availableMoves = (currentPosition: Position, walls: Position[]) => {
  const possiblePositions: Position[] = [
    { row: currentPosition.row - 2, col: currentPosition.col },
    { row: currentPosition.row + 2, col: currentPosition.col },
    { row: currentPosition.row, col: currentPosition.col - 2 },
    { row: currentPosition.row, col: currentPosition.col + 2 },
  ];

  return possiblePositions.filter((position) => {
    return isLegalMove(currentPosition, currentPosition, position, PLAYERS.PLAYER_1, walls) && !isOutOfBounds(position);
  });
};

export const availableMovesWithPlayer = (
  playerOnePos: Position,
  playerTwoPos: Position,
  currentPlayer: Player,
  walls: Position[]
) => {
  const currentPosition = currentPlayer === PLAYERS.PLAYER_1 ? playerOnePos : playerTwoPos;
  const enemyPosition = currentPlayer === PLAYERS.PLAYER_1 ? playerTwoPos : playerOnePos;

  const possiblePositions: Position[] = [
    { row: currentPosition.row - 2, col: currentPosition.col },
    { row: currentPosition.row + 2, col: currentPosition.col },
    { row: currentPosition.row, col: currentPosition.col - 2 },
    { row: currentPosition.row, col: currentPosition.col + 2 },
  ].filter(
    (position) => isLegalMove(playerOnePos, playerTwoPos, position, currentPlayer, walls) && !isOutOfBounds(position)
  );

  if (isEnemyNearby(playerOnePos, playerTwoPos)) {
    const moveDir = getMoveDirection(currentPosition, enemyPosition);
    let newMove: Position;
    switch (moveDir) {
      case 'UP':
        newMove = { row: currentPosition.row - 4, col: currentPosition.col };
        break;
      case 'DOWN':
        newMove = { row: currentPosition.row + 4, col: currentPosition.col };
        break;
      case 'LEFT':
        newMove = { row: currentPosition.row, col: currentPosition.col - 4 };
        break;
      case 'RIGHT':
        newMove = { row: currentPosition.row, col: currentPosition.col + 4 };
        break;
      default:
        newMove = { row: currentPosition.row - 4, col: currentPosition.col };
    }

    if (!isOutOfBounds(newMove) && isLegalMove(enemyPosition, enemyPosition, newMove, currentPlayer, walls)) {
      possiblePositions.push(newMove);
    } else {
      getFourAdjacentPositions(enemyPosition)
        .filter((pos) => {
          return isLegalMove(enemyPosition, currentPosition, pos, PLAYERS.PLAYER_1, walls);
        })
        .forEach((pos) => {
          possiblePositions.push(pos);
        });
    }
  }

  return possiblePositions;
};

export const getFourAdjacentPositions = (position: Position): Position[] => {
  return [
    { row: position.row - 2, col: position.col },
    { row: position.row + 2, col: position.col },
    { row: position.row, col: position.col - 2 },
    { row: position.row, col: position.col + 2 },
  ];
};

export const isOutOfBounds = (position: Position) => {
  return !(position.col >= 0 && position.col <= PLAYFIELD_SIZE && position.row >= 0 && position.row <= PLAYFIELD_SIZE);
};

export const isEnemyNearby = (playerOnePos: Position, playerTwoPos: Position) => {
  const rowDiff = Math.abs(playerOnePos.row - playerTwoPos.row);
  const colDiff = Math.abs(playerOnePos.col - playerTwoPos.col);

  return rowDiff + colDiff <= 2;
};

export const isLegalWallPlacement = (newCoords: Position[], walls: Position[]) => {
  return !newCoords.some((coord) => containsPosition(walls, coord));
};

export const isCurrentPlayerTurn = (turn: Player, currentPlayer: Player) => {
  return turn === currentPlayer;
};

export const doesPlayerHaveWalls = (player: Player, playerOneWalls: number, playerTwoWalls: number) => {
  if (player === PLAYERS.PLAYER_1) return playerOneWalls > 0;
  return playerTwoWalls > 0;
};

export const getWallCoords = (desirablePos: Position, wallType: string): Position[] => {
  if (wallType === ELEMENTS.VERTICAL_WALL) {
    return desirablePos.row === PLAYFIELD_SIZE
      ? [
          { row: desirablePos.row, col: desirablePos.col },
          { row: desirablePos.row - 1, col: desirablePos.col },
          { row: desirablePos.row - 2, col: desirablePos.col },
        ]
      : [
          { row: desirablePos.row, col: desirablePos.col },
          { row: desirablePos.row + 1, col: desirablePos.col },
          { row: desirablePos.row + 2, col: desirablePos.col },
        ];
  } else if (wallType === ELEMENTS.HORIZONTAL_WALL) {
    return desirablePos.col === PLAYFIELD_SIZE
      ? [
          { row: desirablePos.row, col: desirablePos.col },
          { row: desirablePos.row, col: desirablePos.col - 1 },
          { row: desirablePos.row, col: desirablePos.col - 2 },
        ]
      : [
          { row: desirablePos.row, col: desirablePos.col },
          { row: desirablePos.row, col: desirablePos.col + 1 },
          { row: desirablePos.row, col: desirablePos.col + 2 },
        ];
  }
  return [];
};

export const isBlockingPath = (
  playerOnePos: Position,
  playerTwoPos: Position,
  newCoords: Position[],
  placed: Position[]
) => {
  const allWalls = [...newCoords, ...placed];
  const graph = createGraph();

  const playerOneGoal = PLAYFIELD_INITIAL_STATE[0]
    .map((el, i) => (el === ELEMENTS.TILE ? `0-${i}` : null))
    .filter(notNull);
  const playerTwoGoal = PLAYFIELD_INITIAL_STATE[PLAYFIELD_SIZE]
    .map((el, i) => (el === ELEMENTS.TILE ? `16-${i}` : null))
    .filter(notNull);

  const allPositions = PLAYFIELD_INITIAL_STATE.flatMap((row, i) =>
    row.map((el, j) => (el === ELEMENTS.TILE ? { row: i, col: j } : null))
  ).filter(notNull);

  const nodes = allPositions.map((pos) => `${pos.row}-${pos.col}`);

  nodes.forEach((node) => {
    graph.addNode(node);
  });

  allPositions.forEach((position) => {
    availableMoves(position, allWalls)
      .map((pos) => `${pos.row}-${pos.col}`)
      .forEach((node) => {
        graph.addLink(`${position.row}-${position.col}`, node);
      });
  });

  const pathFinder = path.aStar(graph);

  const canPlayerOneReachGoal = playerOneGoal.some(
    (node) => pathFinder.find(`${playerOnePos.row}-${playerOnePos.col}`, node).length > 0
  );
  const canPlayerTwoReachGoal = playerTwoGoal.some(
    (node) => pathFinder.find(`${playerTwoPos.row}-${playerTwoPos.col}`, node).length > 0
  );

  return !(canPlayerOneReachGoal && canPlayerTwoReachGoal);
};

export const getElementType = (position: Position): TElements => {
  return PLAYFIELD_INITIAL_STATE[position.row][position.col];
};

export const toDisplayPosition = (position: Position, isFlipped: boolean): Position => {
  if (!isFlipped) return position;

  return { row: PLAYFIELD_SIZE - position.row, col: PLAYFIELD_SIZE - position.col };
};

export const getGridPlacement = (position: Position, isFlipped: boolean) => {
  const { row, col } = toDisplayPosition(position, isFlipped);

  return { gridRow: row + 1, gridColumn: col + 1 };
};

export const getRandomGif = (isWinner: boolean) => {
  return isWinner ? sample(gifs.win) : sample(gifs.lose);
};
