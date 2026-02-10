import { io } from "socket.io-client";

// Localhost par socket server 3001 par chalega
export const socket = io("http://localhost:3001", {
  autoConnect: false, // Jab zaroorat hogi tab connect karenge
});