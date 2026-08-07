import { Types } from 'mongoose';
import { Board } from '../models/Board';
import { forbiddenError, notFoundError } from '../utils/http';

export async function assertMember(boardId: string, userId: Types.ObjectId) {
  if (!Types.ObjectId.isValid(boardId)) throw notFoundError('Board not found');
  const board = await Board.findById(boardId).exec();
  if (!board) throw notFoundError('Board not found');

  const isMember =
    board.ownerId.equals(userId) ||
    board.members.some((m) => m.equals(userId));

  if (!isMember) throw forbiddenError('Not a member of this board');
  return board;
}

export async function assertOwner(boardId: string, userId: Types.ObjectId) {
  const board = await assertMember(boardId, userId);
  if (!board.ownerId.equals(userId)) {
    throw forbiddenError('Only the board owner can perform this action');
  }
  return board;
}
