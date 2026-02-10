import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: String, required: true }, // User ka email ya ID
  receiver: { type: String, required: true }, // Jisko bhej rahe ho
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

export const Message = mongoose.models.Message || mongoose.model("Message", MessageSchema);