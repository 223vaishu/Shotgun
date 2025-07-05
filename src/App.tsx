import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { Users, Trophy, Clock, Play, UserPlus } from 'lucide-react';
import WelcomeScreen from './components/WelcomeScreen';
import GameRoom from './components/GameRoom';

interface User {
  id: string;
  name: string;
  isHost: boolean;
  selectedPlayers: Player[];
}

interface Player {
  id: number;
  name: string;
  country: string;
  role: string;
  rating: number;
}

interface GameState {
  roomId: string;
  users: User[];
  gameStarted: boolean;
  currentTurn: string | null;
  turnOrder: string[];
  availablePlayers: Player[];
  currentTurnIndex: number;
}

function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [userName, setUserName] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    // Determine the correct socket URL based on the current protocol and hostname
    const getSocketUrl = () => {
      const hostname = window.location.hostname;
      
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        // For local development, always use HTTP to match the backend server
        return 'http://localhost:3001';
      } else {
        // For production, use the same origin
        return window.location.origin;
      }
    };

    const socketUrl = getSocketUrl();
    console.log('Connecting to socket server at:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      timeout: 20000,
      forceNew: true
    });
    
    setSocket(newSocket);
    setCurrentUserId(newSocket.id || '');

    newSocket.on('connect', () => {
      setCurrentUserId(newSocket.id || '');
      console.log('Connected to server:', newSocket.id);
      setError(''); // Clear any previous connection errors
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setError('Failed to connect to server. Please check if the server is running.');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from server:', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected the client, try to reconnect
        newSocket.connect();
      }
    });

    newSocket.on('room-created', (data) => {
      setGameState(data.gameState);
      setError('');
    });

    newSocket.on('room-joined', (data) => {
      setGameState(data.gameState);
      setError('');
    });

    newSocket.on('user-joined', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('user-left', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('game-started', (gameState) => {
      setGameState(gameState);
      setTimeLeft(10);
    });

    newSocket.on('game-state-update', (gameState) => {
      setGameState(gameState);
    });

    newSocket.on('player-selected', (gameState) => {
      setGameState(gameState);
      setTimeLeft(10);
    });

    newSocket.on('error', (error) => {
      setError(error.message);
    });

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (gameState?.gameStarted && gameState.currentTurn) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 10;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [gameState?.gameStarted, gameState?.currentTurn]);

  const createRoom = () => {
    if (!socket || !userName.trim()) return;
    socket.emit('create-room', { userName: userName.trim() });
  };

  const joinRoom = (roomId: string) => {
    if (!socket || !userName.trim()) return;
    socket.emit('join-room', { roomId: roomId.toUpperCase(), userName: userName.trim() });
  };

  const startGame = () => {
    if (!socket || !gameState) return;
    socket.emit('start-game', { roomId: gameState.roomId });
  };

  const selectPlayer = (playerId: number) => {
    if (!socket || !gameState) return;
    socket.emit('select-player', { roomId: gameState.roomId, playerId });
  };

  const leaveRoom = () => {
    setGameState(null);
    setUserName('');
    setError('');
    setTimeLeft(10);
  };

  if (!gameState) {
    return (
      <WelcomeScreen
        userName={userName}
        setUserName={setUserName}
        error={error}
        setError={setError}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
      />
    );
  }

  return (
    <GameRoom
      gameState={gameState}
      currentUserId={currentUserId}
      timeLeft={timeLeft}
      onStartGame={startGame}
      onSelectPlayer={selectPlayer}
      onLeaveRoom={leaveRoom}
    />
  );
}

export default App;