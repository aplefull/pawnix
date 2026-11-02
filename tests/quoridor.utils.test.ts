import { describe, expect, it } from 'vitest';
import { PLAYERS } from '../src/games/quoridor/constants';
import type { Position, Wall } from '../src/games/quoridor/types';
import {
  availableMovesWithPlayer,
  getWallCells,
  isBlockingPath,
  isLegalWallPlacement,
} from '../src/games/quoridor/utils';

const cellsOf = (...walls: Wall[]) => walls.flatMap(getWallCells);

const sortPositions = (positions: Position[]) => [...positions].sort((a, b) => a.row - b.row || a.col - b.col);

const movesOf = (one: Position, two: Position, player: (typeof PLAYERS)[keyof typeof PLAYERS], walls: Wall[] = []) =>
  sortPositions(availableMovesWithPlayer(one, two, player, cellsOf(...walls)));

describe('availableMovesWithPlayer', () => {
  it('steps to the four neighbours on an open board', () => {
    expect(movesOf({ row: 8, col: 8 }, { row: 0, col: 8 }, PLAYERS.PLAYER_1)).toEqual([
      { row: 6, col: 8 },
      { row: 8, col: 6 },
      { row: 8, col: 10 },
      { row: 10, col: 8 },
    ]);
  });

  it('does not step through a wall', () => {
    const wall: Wall = { row: 7, col: 9, orientation: 'horizontal' };
    expect(movesOf({ row: 8, col: 8 }, { row: 0, col: 8 }, PLAYERS.PLAYER_1, [wall])).not.toContainEqual({
      row: 6,
      col: 8,
    });
  });

  it('jumps straight over an adjacent opponent', () => {
    expect(movesOf({ row: 8, col: 8 }, { row: 6, col: 8 }, PLAYERS.PLAYER_1)).toEqual([
      { row: 4, col: 8 },
      { row: 8, col: 6 },
      { row: 8, col: 10 },
      { row: 10, col: 8 },
    ]);
  });

  it('moves diagonally when a wall is behind the opponent', () => {
    const wall: Wall = { row: 5, col: 9, orientation: 'horizontal' };
    expect(movesOf({ row: 8, col: 8 }, { row: 6, col: 8 }, PLAYERS.PLAYER_1, [wall])).toEqual([
      { row: 6, col: 6 },
      { row: 6, col: 10 },
      { row: 8, col: 6 },
      { row: 8, col: 10 },
      { row: 10, col: 8 },
    ]);
  });

  it('moves diagonally when the opponent is at the board edge, never off the board', () => {
    expect(movesOf({ row: 2, col: 8 }, { row: 0, col: 8 }, PLAYERS.PLAYER_1)).toEqual([
      { row: 0, col: 6 },
      { row: 0, col: 10 },
      { row: 2, col: 6 },
      { row: 2, col: 10 },
      { row: 4, col: 8 },
    ]);
  });

  it('does not jump over an opponent behind a wall', () => {
    const wall: Wall = { row: 7, col: 9, orientation: 'horizontal' };
    expect(movesOf({ row: 8, col: 8 }, { row: 6, col: 8 }, PLAYERS.PLAYER_1, [wall])).toEqual([
      { row: 8, col: 6 },
      { row: 8, col: 10 },
      { row: 10, col: 8 },
    ]);
  });

  it('does not move diagonally around an opponent behind a wall', () => {
    const walls: Wall[] = [
      { row: 7, col: 9, orientation: 'horizontal' },
      { row: 9, col: 9, orientation: 'horizontal' },
      { row: 11, col: 9, orientation: 'horizontal' },
      { row: 9, col: 7, orientation: 'vertical' },
    ];
    expect(movesOf({ row: 10, col: 8 }, { row: 8, col: 8 }, PLAYERS.PLAYER_2, walls)).toEqual([{ row: 8, col: 10 }]);
  });
});

describe('isLegalWallPlacement', () => {
  const placed = cellsOf({ row: 9, col: 9, orientation: 'horizontal' });

  it('allows a wall that touches nothing', () => {
    expect(isLegalWallPlacement(getWallCells({ row: 9, col: 13, orientation: 'horizontal' }), placed)).toBe(true);
  });

  it('rejects an overlapping wall', () => {
    expect(isLegalWallPlacement(getWallCells({ row: 9, col: 11, orientation: 'horizontal' }), placed)).toBe(false);
  });

  it('rejects a crossing wall', () => {
    expect(isLegalWallPlacement(getWallCells({ row: 9, col: 9, orientation: 'vertical' }), placed)).toBe(false);
  });
});

describe('isBlockingPath', () => {
  const one: Position = { row: 16, col: 8 };
  const two: Position = { row: 0, col: 8 };
  const fence = cellsOf(...[1, 5, 9, 13].map((col): Wall => ({ row: 9, col, orientation: 'horizontal' })));

  const side: Wall = { row: 9, col: 15, orientation: 'vertical' };

  it('allows a wall that leaves a gap', () => {
    expect(isBlockingPath(one, two, getWallCells(side), fence)).toBe(false);
  });

  it('rejects a wall that closes the last gap', () => {
    const closing = getWallCells({ row: 7, col: 15, orientation: 'horizontal' });
    expect(isBlockingPath(one, two, closing, [...fence, ...cellsOf(side)])).toBe(true);
  });
});
