import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:3001",
      "https://localhost:5173",
      "https://localhost:5174",
      "http://localhost:5174"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:3001",
    "https://localhost:5173",
    "https://localhost:5174",
    "http://localhost:5174"
  ],
  credentials: true
}));
app.use(express.json());

// Serve static files in production (Vite builds to /dist)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cricket Draft Server is running' });
});

// --- Game Logic ---

const cricketPlayers = [ /* your player list here unchanged */ ];

const rooms = new Map();

class Room {
  constructor(id, hostId, hostName) {
    this.id = id;
    this.hostId = hostId;
    this.users = new Map();
    this.users.set(hostId, { id: hostId, name: hostName, isHost: true, selectedPlayers: [] });
    this.gameStarted = false;
    this.currentTurn = null;
    this.turnOrder = [];
    this.availablePlayers = [...cricketPlayers];
    this.turnTimer = null;
    this.currentTurnIndex = 0;
  }

  addUser(userId, userName) {
    this.users.set(userId, { id: userId, name: userName, isHost: false, selectedPlayers: [] });
  }

  removeUser(userId) {
    this.users.delete(userId);
    if (userId === this.hostId && this.users.size > 0) {
      const newHost = this.users.values().next().value;
      newHost.isHost = true;
      this.hostId = newHost.id;
    }
  }

  startGame() {
    this.gameStarted = true;
    this.turnOrder = Array.from(this.users.keys()).sort(() => Math.random() - 0.5);
    this.currentTurnIndex = 0;
    this.currentTurn = this.turnOrder[0];
    this.startTurnTimer();
  }

  startTurnTimer() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.turnTimer = setTimeout(() => this.autoSelectPlayer(), 10000);
  }

  selectPlayer(userId, playerId) {
    if (userId !== this.currentTurn) return false;
    const index = this.availablePlayers.findIndex(p => p.id === playerId);
    if (index === -1) return false;

    const player = this.availablePlayers.splice(index, 1)[0];
    this.users.get(userId).selectedPlayers.push(player);
    this.nextTurn();
    return true;
  }

  autoSelectPlayer() {
    if (this.availablePlayers.length === 0) return;
    const randomIndex = Math.floor(Math.random() * this.availablePlayers.length);
    const player = this.availablePlayers.splice(randomIndex, 1)[0];
    this.users.get(this.currentTurn).selectedPlayers.push(player);
    this.nextTurn();
  }

  nextTurn() {
    if (this.turnTimer) clearTimeout(this.turnTimer);
    this.currentTurnIndex = (this.currentTurnIndex + 1) % this.turnOrder.length;
    this.currentTurn = this.turnOrder[this.currentTurnIndex];
    this.startTurnTimer();
  }

  getGameState() {
    return {
      roomId: this.id,
      users: Array.from(this.users.values()),
      gameStarted: this.gameStarted,
      currentTurn: this.currentTurn,
      turnOrder: this.turnOrder,
      availablePlayers: this.availablePlayers,
      currentTurnIndex: this.currentTurnIndex
    };
  }
}

// --- Socket Events ---

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('create-room', (data) => {
    const roomId = uuidv4().substring(0, 8).toUpperCase();
    const room = new Room(roomId, socket.id, data.userName);
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.emit('room-created', { roomId, gameState: room.getGameState() });
    console.log(`Room created: ${roomId} by ${data.userName}`);
  });

  socket.on('join-room', (data) => {
    const room = rooms.get(data.roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    room.addUser(socket.id, data.userName);
    socket.join(data.roomId);
    io.to(data.roomId).emit('user-joined', room.getGameState());
    socket.emit('room-joined', { roomId: data.roomId, gameState: room.getGameState() });
    console.log(`${data.userName} joined room: ${data.roomId}`);
  });

  socket.on('start-game', (data) => {
    const room = rooms.get(data.roomId);
    if (!room || room.hostId !== socket.id) {
      socket.emit('error', { message: 'Unauthorized or room not found' });
      return;
    }

    room.startGame();
    io.to(data.roomId).emit('game-started', room.getGameState());

    const interval = setInterval(() => {
      if (!room.gameStarted) return clearInterval(interval);
      io.to(data.roomId).emit('game-state-update', room.getGameState());
    }, 1000);

    console.log(`Game started in room: ${data.roomId}`);
  });

  socket.on('select-player', (data) => {
    const room = rooms.get(data.roomId);
    if (!room) {
      socket.emit('error', { message: 'Room not found' });
      return;
    }

    const success = room.selectPlayer(socket.id, data.playerId);
    if (success) {
      io.to(data.roomId).emit('player-selected', room.getGameState());
      console.log(`Player selected in room: ${data.roomId}`);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    rooms.forEach((room, roomId) => {
      if (room.users.has(socket.id)) {
        room.removeUser(socket.id);
        if (room.users.size === 0) {
          rooms.delete(roomId);
        } else {
          io.to(roomId).emit('user-left', room.getGameState());
        }
      }
    });
  });
});

// --- Server start ---
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
