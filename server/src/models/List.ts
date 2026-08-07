import { Schema, model, HydratedDocument, InferSchemaType } from 'mongoose';

const listSchema = new Schema(
  {
    boardId: { type: Schema.Types.ObjectId, ref: 'Board', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    position: { type: Number, required: true },
  },
  { timestamps: true },
);

listSchema.index({ boardId: 1, position: 1 });

export type ListDoc = HydratedDocument<InferSchemaType<typeof listSchema>>;
export const List = model('List', listSchema);
