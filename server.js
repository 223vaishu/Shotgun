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

// Serve static files from the dist directory in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client', 'dist'))); // Adjust if needed

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  });

}

// Cricket players database
const cricketPlayers = [
  { id: 1, name: "Virat Kohli", country: "India", role: "Batsman", rating: 95 },
  { id: 2, name: "Babar Azam", country: "Pakistan", role: "Batsman", rating: 94 },
  { id: 3, name: "Steve Smith", country: "Australia", role: "Batsman", rating: 93 },
  { id: 4, name: "Kane Williamson", country: "New Zealand", role: "Batsman", rating: 92 },
  { id: 5, name: "Joe Root", country: "England", role: "Batsman", rating: 91 },
  { id: 6, name: "Rohit Sharma", country: "India", role: "Batsman", rating: 90 },
  { id: 7, name: "David Warner", country: "Australia", role: "Batsman", rating: 89 },
  { id: 8, name: "Quinton de Kock", country: "South Africa", role: "Wicket-keeper", rating: 88 },
  { id: 9, name: "Jos Buttler", country: "England", role: "Wicket-keeper", rating: 87 },
  { id: 10, name: "MS Dhoni", country: "India", role: "Wicket-keeper", rating: 86 },
  { id: 11, name: "Jasprit Bumrah", country: "India", role: "Bowler", rating: 95 },
  { id: 12, name: "Pat Cummins", country: "Australia", role: "Bowler", rating: 94 },
  { id: 13, name: "Kagiso Rabada", country: "South Africa", role: "Bowler", rating: 93 },
  { id: 14, name: "Trent Boult", country: "New Zealand", role: "Bowler", rating: 92 },
  { id: 15, name: "Shaheen Afridi", country: "Pakistan", role: "Bowler", rating: 91 },
  { id: 16, name: "Mitchell Starc", country: "Australia", role: "Bowler", rating: 90 },
  { id: 17, name: "Ravindra Jadeja", country: "India", role: "All-rounder", rating: 89 },
  { id: 18, name: "Ben Stokes", country: "England", role: "All-rounder", rating: 88 },
  { id: 19, name: "Shakib Al Hasan", country: "Bangladesh", role: "All-rounder", rating: 87 },
  { id: 20, name: "Jason Holder", country: "West Indies", role: "All-rounder", rating: 86 },
  { id: 21, name: "Rashid Khan", country: "Afghanistan", role: "Bowler", rating: 85 },
  { id: 22, name: "Yuzvendra Chahal", country: "India", role: "Bowler", rating: 84 },
  { id: 23, name: "Adil Rashid", country: "England", role: "Bowler", rating: 83 },
  { id: 24, name: "Adam Zampa", country: "Australia", role: "Bowler", rating: 82 },
  { id: 25, name: "Hardik Pandya", country: "India", role: "All-rounder", rating: 81 },
  { id: 26, name: "Glenn Maxwell", country: "Australia", role: "All-rounder", rating: 80 },
  { id: 27, name: "Liam Livingstone", country: "England", role: "All-rounder", rating: 79 },
  { id: 28, name: "Andre Russell", country: "West Indies", role: "All-rounder", rating: 78 },
  { id: 29, name: "Kieron Pollard", country: "West Indies", role: "All-rounder", rating: 77 },
  { id: 30, name: "Sunil Narine", country: "West Indies", role: "All-rounder", rating: 76 }
];

// Room management
const rooms = new Map();
const playerTimers = new Map();

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
      // Transfer host to another user
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
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
    }
    
    this.turnTimer = setTimeout(() => {
      this.autoSelectPlayer();
    }, 10000);
  }

  selectPlayer(userId, playerId) {
    if (userId !== this.currentTurn) return false;
    
    const playerIndex = this.availablePlayers.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return false;

    const selectedPlayer = this.availablePlayers.splice(playerIndex, 1)[0];
    this.users.get(userId).selectedPlayers.push(selectedPlayer);
    
    this.nextTurn();
    return true;
  }

  autoSelectPlayer() {
    if (this.availablePlayers.length === 0) return;
    
    const randomIndex = Math.floor(Math.random() * this.availablePlayers.length);
    const selectedPlayer = this.availablePlayers.splice(randomIndex, 1)[0];
    this.users.get(this.currentTurn).selectedPlayers.push(selectedPlayer);
    
    this.nextTurn();
  }

  nextTurn() {
    if (this.turnTimer) {
      clearTimeout(this.turnTimer);
    }

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

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Cricket Draft Server is running' });
});

// Serve React app for all other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

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
    
    // Start turn timer broadcast
    const timerInterval = setInterval(() => {
      if (!room.gameStarted) {
        clearInterval(timerInterval);
        return;
      }
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
    
    // Remove user from all rooms
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

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});