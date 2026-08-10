import { Schema, model, HydratedDocument, InferSchemaType } from 'mongoose';

const cardSchema = new Schema(
  {
    listId: { type: Schema.Types.ObjectId, ref: 'List', required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '' },
    position: { type: Number, required: true },
    cover: {
      type: { type: String, enum: ['color', 'image'] },
      value: { type: String, default: '' },
    },
    labels: { type: [String], default: [] },
    memberIds: { type: [String], default: [] },
    dueDate: { type: Date, default: null },
    location: { type: String, default: '' },
    files: [
      {
        _id: false,
        id: { type: String, required: true },
        name: { type: String, required: true },
        url: { type: String, required: true },
        kind: { type: String, enum: ['image', 'file'], default: 'file' },
        size: { type: Number },
        addedAt: { type: Date, default: Date.now },
      },
    ],
    reactions: { type: Map, of: [String], default: () => new Map() },
    comments: [
      {
        _id: false,
        id: { type: String, required: true },
        authorId: { type: String, required: true },
        authorName: { type: String, default: '' },
        text: { type: String, required: true, maxlength: 5000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    activity: [
      {
        _id: false,
        id: { type: String, required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    watched: { type: Boolean, default: false },
    complete: { type: Boolean, default: false },
  },
  { timestamps: true },
);

cardSchema.index({ listId: 1, position: 1 });

export type CardDoc = HydratedDocument<InferSchemaType<typeof cardSchema>>;
export const Card = model('Card', cardSchema);
