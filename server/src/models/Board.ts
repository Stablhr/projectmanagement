import { Schema, model, HydratedDocument, InferSchemaType } from 'mongoose';

const boardSchema = new Schema(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true },
);

boardSchema.index({ ownerId: 1 });
boardSchema.index({ members: 1 });

export type BoardDoc = HydratedDocument<InferSchemaType<typeof boardSchema>>;
export const Board = model('Board', boardSchema);
