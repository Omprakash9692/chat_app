import express from "express";
import cors from "cors";
import "dotenv/config";

import http from "http";

import { connectDB } from "./config/db.js";

//Routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import conversationRoutes from "./routes/conversation.routes.js";
import messageRoutes from "./routes/message.routes.js";
import groupRoutes from "./routes/group.routes.js";
import { initSocket, userSockets, userActiveChats } from "./sockets/socket.js";

const app = express();
const PORT = 5000;

//Middleware
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
}));

app.use(express.json());

//connect to database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chats", conversationRoutes);
app.use("/api/chats", messageRoutes);
app.use("/api/chats", groupRoutes);

app.get('/', (req, res) => {
    res.json("API WORKING")
});

app.listen(PORT, () => {
    console.log(`Server Started on http://localhost:${PORT}`);
});

const server = http.createServer(app);

const io = initSocket(server);
app.set("io", io);
app.set("userSockets", userSockets);
app.set("userActiveChats", userActiveChats);