# 🏏 Real-Time Cricket Team Selection Room
A multiplayer turn-based web app where users draft cricket players in real-time, powered by Node.js, Express.js, and Socket.IO.

### 🚀 Features
✅ Real-time synchronization using WebSockets

✅ Turn-based drafting with a 10-second timer

✅ Auto-pick if a user doesn’t select in time

✅ Persistent rooms with unique IDs

✅ Host controls (start game, manage turns)

✅ Player pool with 30+ cricket stars (Kohli, Smith, Bumrah, etc.)

### 🔧 Tech Stack
Frontend	Backend	Real-Time
React.js	Node.js	Socket.IO
Vite	Express.js	WebSockets
TailwindCSS	CORS	Event-Driven Logic

### 🎮 How It Works

1.Create/Join a Room

2.Host generates a unique room ID.

3.Others join via the code.

4.Draft Phase Begins

5.Random turn order is assigned.

6.Each user gets 10 seconds to pick a player.

7.Auto-Pick (If Time Runs Out)

8.System randomly selects a player if no choice is made.

### Winning Team

Game continues until each user drafts 5 players.
