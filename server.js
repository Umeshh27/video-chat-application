"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const dev = process.env.NODE_ENV !== 'production';
const app = (0, next_1.default)({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '3000', 10);
app.prepare().then(() => {
    const httpServer = (0, http_1.createServer)((req, res) => {
        const parsedUrl = (0, url_1.parse)(req.url, true);
        handle(req, res, parsedUrl);
    });
    const io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        }
    });
    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        socket.on('join-room', (roomId) => {
            socket.join(roomId);
            console.log(`User ${socket.id} joined room ${roomId}`);
            // Notify others in the room
            socket.to(roomId).emit('user-joined', socket.id);
        });
        socket.on('offer', (payload) => {
            io.to(payload.target).emit('offer', payload);
        });
        socket.on('answer', (payload) => {
            io.to(payload.target).emit('answer', payload);
        });
        socket.on('ice-candidate', (payload) => {
            io.to(payload.target).emit('ice-candidate', Object.assign(payload, { caller: socket.id }));
        });
        socket.on('chat-message', (payload) => {
            socket.to(payload.roomId).emit('chat-message', {
                senderId: socket.id,
                message: payload.message
            });
        });
        socket.on('disconnecting', () => {
            for (const roomId of socket.rooms) {
                if (roomId !== socket.id) {
                    socket.to(roomId).emit('user-disconnected', socket.id);
                }
            }
        });
        socket.on('disconnect', () => {
            console.log('User disconnected:', socket.id);
        });
    });
    httpServer.listen(port, () => {
        console.log(`> Ready on http://localhost:${port}`);
    });
});
