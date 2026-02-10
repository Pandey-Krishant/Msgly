import { Server } from "socket.io";

const port = process.env.PORT || 3001;
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
  .split(",")
  .map((v) => v.trim())
  .filter(Boolean);

const io = new Server(port, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

console.log(`Socket Server (ES Module) running on port ${port}... 🚀`);

io.on("connection", (socket) => {
  console.log("Bhai koi connect hua! ID:", socket.id);

  socket.on("send-message", (data) => {
    console.log("Message received:", data);
    // Sabko bhej do except sender
    socket.broadcast.emit("receive-message", {
      ...data,
      type: "received"
    });
  });

  socket.on("send-request", (data) => {
    socket.broadcast.emit("receive-request", data);
  });

  socket.on("request-action", (data) => {
    socket.broadcast.emit("request-updated", data);
  });

  socket.on("typing", (data) => {
    socket.broadcast.emit("typing", data);
  });

  socket.on("username-updated", (data) => {
    socket.broadcast.emit("username-updated", data);
  });

  socket.on("profile-updated", (data) => {
    socket.broadcast.emit("profile-updated", data);
  });

  // WebRTC signaling
  socket.on("call:offer", (data) => {
    socket.broadcast.emit("call:offer", data);
  });
  socket.on("call:answer", (data) => {
    socket.broadcast.emit("call:answer", data);
  });
  socket.on("call:ice", (data) => {
    socket.broadcast.emit("call:ice", data);
  });
  socket.on("call:end", (data) => {
    socket.broadcast.emit("call:end", data);
  });
  socket.on("call:reject", (data) => {
    socket.broadcast.emit("call:reject", data);
  });

  socket.on("disconnect", () => {
    console.log("Bhai gaya! ID:", socket.id);
  });
});
