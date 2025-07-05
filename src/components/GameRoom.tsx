import React from 'react';
import { Users, Trophy, Clock, Play, LogOut, Star } from 'lucide-react';

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

interface GameRoomProps {
  gameState: GameState;
  currentUserId: string;
  timeLeft: number;
  onStartGame: () => void;
  onSelectPlayer: (playerId: number) => void;
  onLeaveRoom: () => void;
}

const GameRoom: React.FC<GameRoomProps> = ({
  gameState,
  currentUserId,
  timeLeft,
  onStartGame,
  onSelectPlayer,
  onLeaveRoom
}) => {
  const currentUser = gameState.users.find(u => u.id === currentUserId);
  const isMyTurn = gameState.currentTurn === currentUserId;
  const currentTurnUser = gameState.users.find(u => u.id === gameState.currentTurn);

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'Batsman': return 'bg-blue-100 text-blue-800';
      case 'Bowler': return 'bg-red-100 text-red-800';
      case 'All-rounder': return 'bg-purple-100 text-purple-800';
      case 'Wicket-keeper': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCountryFlag = (country: string) => {
    const flags: { [key: string]: string } = {
      'India': '🇮🇳',
      'Australia': '🇦🇺',
      'England': '🇬🇧',
      'Pakistan': '🇵🇰',
      'New Zealand': '🇳🇿',
      'South Africa': '🇿🇦',
      'West Indies': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'Bangladesh': '🇧🇩',
      'Afghanistan': '🇦🇫',
      'Sri Lanka': '🇱🇰'
    };
    return flags[country] || '🏏';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Trophy className="w-8 h-8 text-green-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Cricket Draft</h1>
                  <p className="text-gray-600">Room: {gameState.roomId}</p>
                </div>
              </div>
              
              {gameState.gameStarted && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="text-lg font-semibold text-orange-600">
                      {timeLeft}s
                    </span>
                  </div>
                  <div className="h-2 w-32 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-orange-600 transition-all duration-1000"
                      style={{ width: `${(timeLeft / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {!gameState.gameStarted && currentUser?.isHost && (
                <button
                  onClick={onStartGame}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
                >
                  <Play className="w-5 h-5" />
                  <span>Start Game</span>
                </button>
              )}
              
              <button
                onClick={onLeaveRoom}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2"
              >
                <LogOut className="w-5 h-5" />
                <span>Leave</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Available Players</h2>
                {gameState.gameStarted && currentTurnUser && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Current turn:</span>
                    <span className="font-semibold text-green-600">{currentTurnUser.name}</span>
                    {isMyTurn && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        Your turn!
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {gameState.availablePlayers.map((player) => (
                  <div
                    key={player.id}
                    className={`bg-gray-50 rounded-xl p-4 transition-all cursor-pointer ${
                      gameState.gameStarted && isMyTurn
                        ? 'hover:bg-green-50 hover:border-green-300 border-2 border-transparent'
                        : 'opacity-75'
                    }`}
                    onClick={() => {
                      if (gameState.gameStarted && isMyTurn) {
                        onSelectPlayer(player.id);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-gray-900">{player.name}</h3>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">{player.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{getCountryFlag(player.country)}</span>
                        <span className="text-sm text-gray-600">{player.country}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(player.role)}`}>
                        {player.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Users Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Users className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-900">Players ({gameState.users.length})</h2>
              </div>
              
              <div className="space-y-3">
                {gameState.users.map((user, index) => (
                  <div
                    key={user.id}
                    className={`p-4 rounded-xl transition-all ${
                      user.id === currentUserId
                        ? 'bg-blue-50 border-2 border-blue-200'
                        : 'bg-gray-50'
                    } ${
                      gameState.gameStarted && gameState.currentTurn === user.id
                        ? 'ring-2 ring-green-500'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-600">
                            {user.isHost ? 'Host' : 'Player'} • {user.selectedPlayers.length} picked
                          </p>
                        </div>
                      </div>
                      {gameState.gameStarted && gameState.turnOrder.length > 0 && (
                        <div className="text-sm text-gray-500">
                          Turn #{gameState.turnOrder.indexOf(user.id) + 1}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* My Team */}
            {currentUser && currentUser.selectedPlayers.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">My Team</h2>
                <div className="space-y-3">
                  {currentUser.selectedPlayers.map((player) => (
                    <div key={player.id} className="bg-green-50 rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{player.name}</p>
                          <p className="text-sm text-gray-600">
                            {getCountryFlag(player.country)} {player.country}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(player.role)}`}>
                            {player.role}
                          </span>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="text-sm font-medium">{player.rating}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoom;