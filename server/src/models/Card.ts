import { Schema, model, HydratedDocument, InferSchemaType } from 'mongoose';

const cardSchema = new Schema(
  {
    listId: { type: Schema.Types.ObjectId, ref: 'List', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '' },
    position: { type: Number, required: true },
  },
  { timestamps: true },
);

cardSchema.index({ listId: 1, position: 1 });

export type CardDoc = HydratedDocument<InferSchemaType<typeof cardSchema>>;
export const Card = model('Card', cardSchema);
