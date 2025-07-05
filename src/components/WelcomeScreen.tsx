import React, { useState } from 'react';
import { Users, Trophy, UserPlus, LogIn } from 'lucide-react';

interface WelcomeScreenProps {
  userName: string;
  setUserName: (name: string) => void;
  error: string;
  setError: (error: string) => void;
  onCreateRoom: () => void;
  onJoinRoom: (roomId: string) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  userName,
  setUserName,
  error,
  setError,
  onCreateRoom,
  onJoinRoom
}) => {
  const [roomId, setRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    onCreateRoom();
  };

  const handleJoinRoom = () => {
    if (!userName.trim()) {
      setError('Please enter your name');
      return;
    }
    if (!roomId.trim()) {
      setError('Please enter room ID');
      return;
    }
    onJoinRoom(roomId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <Trophy className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Cricket Draft</h1>
          <p className="text-gray-600">Build your dream cricket team</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={handleCreateRoom}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Users className="w-5 h-5" />
              <span>Create Room</span>
            </button>

            <button
              onClick={() => setShowJoinForm(!showJoinForm)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Join Room</span>
            </button>
          </div>

          {showJoinForm && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter room ID"
                  maxLength={8}
                />
              </div>
              <button
                onClick={handleJoinRoom}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <LogIn className="w-5 h-5" />
                <span>Join Room</span>
              </button>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            Create a room to start drafting or join an existing room with friends
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;