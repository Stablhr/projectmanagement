import { Model } from 'mongoose';

/**
 * Positions are spaced at 1024. New items are appended after the last sibling.
 * Reorders write each item's position as (index + 1) * 1024 in one pass.
 */

export async function nextPosition(
  Model: Model<any>,
  filter: Record<string, unknown>,
): Promise<number> {
  const last = await Model.findOne(filter).sort({ position: -1 }).exec();
  return (last?.position ?? 0) + 1024;
}

export async function applyOrder(
  Model: Model<any>,
  orderedIds: string[],
): Promise<void> {
  const ops = orderedIds.map((id, i) =>
    Model.updateOne({ _id: id }, { $set: { position: (i + 1) * 1024 } }),
  );
  await Promise.all(ops);
}
