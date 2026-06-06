import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();
const port = parseInt(process.env.PORT || '3000', 10);

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`User ${socket.id} joined room ${roomId}`);
      // Notify others in the room
      socket.to(roomId).emit('user-joined', socket.id);
    });

    socket.on('offer', (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
      io.to(payload.target).emit('offer', payload);
    });

    socket.on('answer', (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
      io.to(payload.target).emit('answer', payload);
    });

    socket.on('ice-candidate', (payload: { target: string, candidate: RTCIceCandidateInit | null }) => {
      io.to(payload.target).emit('ice-candidate', Object.assign(payload, { caller: socket.id }));
    });

    socket.on('chat-message', (payload: { roomId: string, message: string }) => {
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
