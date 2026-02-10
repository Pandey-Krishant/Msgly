import mongoose, { Schema, model, models } from "mongoose";

export interface User {
  _id?: any;
  name?: string;
  email: string;
  password: string;
  image?: string;
  nickname?: string;
  uniqueUsername?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema = new Schema({
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  name: { type: String },
  image: { type: String, default: "" },
}, { timestamps: true });

const UserModel = models.User || model("User", UserSchema);
export default UserModel;