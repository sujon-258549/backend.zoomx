import { Schema, model } from "mongoose";
import { IProject } from "./project.interface";

const projectSchema = new Schema<IProject>(
  {
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: "ProjectCategory", required: true },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

const ProjectModel = model<IProject>("Project", projectSchema);

export default ProjectModel;
