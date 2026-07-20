import { model, Schema } from "mongoose";

// A tiny atomic counter — one document per key (e.g. "order-202607"). Used to
// generate sequential, per-month order numbers without race conditions.
interface ICounter {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<ICounter>(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

export const Counter = model<ICounter>("Counter", CounterSchema);
