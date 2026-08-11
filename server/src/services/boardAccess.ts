import { Board, type BoardDoc } from '../models/Board';
import type { Hydrated } from '../db/fileStore';
import { forbiddenError, notFoundError } from '../utils/http';

function isMember(board: BoardDoc, userId: string): boolean {
  return (
    String(board.ownerId) === userId ||
    board.members.some((m) => String(m) === userId)
  );
}

export async function assertMember(
  boardId: string,
  userId: string,
): Promise<Hydrated<BoardDoc>> {
  if (!boardId) throw notFoundError('Board not found');
  const board = await Board.findById(boardId).exec();
  if (!board) throw notFoundError('Board not found');

  if (!isMember(board, userId)) throw forbiddenError('Not a member of this board');
  return board;
}

export async function assertOwner(
  boardId: string,
  userId: string,
): Promise<Hydrated<BoardDoc>> {
  const board = await assertMember(boardId, userId);
  if (String(board.ownerId) !== userId) {
    throw forbiddenError('Only the board owner can perform this action');
  }
  return board;
}
