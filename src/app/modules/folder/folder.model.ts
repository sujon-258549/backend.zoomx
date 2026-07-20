import { Schema, model } from "mongoose";
import { IFolder } from "./folder.interface";

const folderSchema = new Schema<IFolder>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    // A folder can live inside another folder — to any depth. `null` means it
    // sits at the top level (root).
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    is_deleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Fast lookups of a folder's direct children.
folderSchema.index({ parent: 1, name: 1 });

const Folder = model<IFolder>("Folder", folderSchema);

export default Folder;
