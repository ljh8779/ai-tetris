import { Server, Socket } from 'socket.io';
import { LOBBY_EVENTS, ROOM_EVENTS, GAME_EVENTS, CHAT_EVENTS, MATCHMAKING_EVENTS } from 'shared';
import { RoomState, PlayerInfo, ChatMessage, LobbyRoom } from 'shared';
import { MatchmakingQueue } from './matchmaking.js';
import { GameSessionManager } from './gameSession.js';

export function setupSocketHandler(io: Server) {
  const rooms = new Map<string, RoomState>();
  const playerRooms = new Map<string, string>(); // socketId -> roomId
  const playerNames = new Map<string, string>(); // socketId -> name
  const matchmaking = new MatchmakingQueue();
  const sessions = new GameSessionManager(io);

  function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 10);
  }

  function broadcastLobbyState(socket: Socket) {
    const lobbyRooms: LobbyRoom[] = [];
    rooms.forEach((room, id) => {
      if (room.status === 'waiting') {
        lobbyRooms.push({
          id,
          playerCount: room.players.length,
          maxPlayers: 2,
          status: room.status,
        });
      }
    });
    socket.emit(LOBBY_EVENTS.STATE, lobbyRooms);
  }

  function broadcastRoomState(roomId: string) {
    const room = rooms.get(roomId);
    if (!room) return;
    io.to(roomId).emit(ROOM_EVENTS.STATE, room);
  }

  function checkGameStart(roomId: string) {
    const room = rooms.get(roomId);
    if (!room || room.players.length !== 2) return;
    if (!room.players.every(p => p.ready)) return;

    room.status = 'countdown';
    const seed = Math.floor(Math.random() * 2147483647);
    room.seed = seed;
    broadcastRoomState(roomId);

    // Countdown: 3, 2, 1, GO
    let count = 3;
    const countdownInterval = setInterval(() => {
      io.to(roomId).emit(GAME_EVENTS.COUNTDOWN, count);
      count--;
      if (count < 0) {
        clearInterval(countdownInterval);
        room.status = 'playing';
        io.to(roomId).emit(GAME_EVENTS.START, {
          roomId,
          seed,
          players: room.players,
        });
        sessions.createSession(roomId, room.players);
      }
    }, 1000);
  }

  io.on('connection', (socket: Socket) => {
    console.log(`Player connected: ${socket.id}`);

    // Lobby join
    socket.on(LOBBY_EVENTS.JOIN, (data: { name: string }) => {
      playerNames.set(socket.id, data.name);
      broadcastLobbyState(socket);
    });

    // Room create
    socket.on(ROOM_EVENTS.CREATE, (data: { name: string }) => {
      const roomId = generateRoomId();
      const player: PlayerInfo = { id: socket.id, name: data.name, ready: false };
      const room: RoomState = {
        id: roomId,
        players: [player],
        status: 'waiting',
      };
      rooms.set(roomId, room);
      playerRooms.set(socket.id, roomId);
      socket.join(roomId);
      broadcastRoomState(roomId);
    });

    // Room join
    socket.on(ROOM_EVENTS.JOIN, (data: { roomId: string; name: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) {
        socket.emit(ROOM_EVENTS.ERROR, 'Room not found');
        return;
      }
      if (room.players.length >= 2) {
        socket.emit(ROOM_EVENTS.ERROR, 'Room is full');
        return;
      }
      if (room.status !== 'waiting') {
        socket.emit(ROOM_EVENTS.ERROR, 'Game already in progress');
        return;
      }

      const player: PlayerInfo = { id: socket.id, name: data.name, ready: false };
      room.players.push(player);
      playerRooms.set(socket.id, data.roomId);
      socket.join(data.roomId);
      broadcastRoomState(data.roomId);
    });

    // Ready toggle
    socket.on(ROOM_EVENTS.READY, (data: { roomId: string; ready: boolean }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.ready = data.ready;
        broadcastRoomState(data.roomId);
        if (data.ready) {
          checkGameStart(data.roomId);
        }
      }
    });

    // Room leave
    socket.on(ROOM_EVENTS.LEAVE, (data: { roomId: string }) => {
      leaveRoom(socket, data.roomId);
    });

    // Matchmaking
    socket.on(MATCHMAKING_EVENTS.QUEUE_JOIN, (data: { name: string }) => {
      playerNames.set(socket.id, data.name);
      matchmaking.addPlayer(socket.id, data.name);

      const match = matchmaking.tryMatch();
      if (match) {
        const roomId = generateRoomId();
        const room: RoomState = {
          id: roomId,
          players: match.map(p => ({ id: p.id, name: p.name, ready: true })),
          status: 'waiting',
        };
        rooms.set(roomId, room);

        for (const p of match) {
          const pSocket = io.sockets.sockets.get(p.id);
          if (pSocket) {
            pSocket.join(roomId);
            playerRooms.set(p.id, roomId);
            pSocket.emit(MATCHMAKING_EVENTS.MATCH_FOUND, room);
          }
        }

        // Auto-start after match found
        setTimeout(() => checkGameStart(roomId), 500);
      }
    });

    socket.on(MATCHMAKING_EVENTS.QUEUE_LEAVE, () => {
      matchmaking.removePlayer(socket.id);
    });

    // Game board relay
    socket.on(GAME_EVENTS.BOARD, (data: { roomId: string; snapshot: any }) => {
      socket.to(data.roomId).emit(GAME_EVENTS.BOARD, {
        playerId: socket.id,
        snapshot: data.snapshot,
      });
    });

    // Garbage send
    socket.on(GAME_EVENTS.GARBAGE_SEND, (data: { roomId: string; lines: number }) => {
      socket.to(data.roomId).emit(GAME_EVENTS.GARBAGE_RECEIVE, {
        lines: data.lines,
        senderId: socket.id,
      });
    });

    // Game over
    socket.on(GAME_EVENTS.OVER, (data: { roomId: string }) => {
      const room = rooms.get(data.roomId);
      if (!room) return;

      room.status = 'finished';
      const winner = room.players.find(p => p.id !== socket.id);
      if (winner) {
        io.to(data.roomId).emit(GAME_EVENTS.RESULT, {
          winnerId: winner.id,
          winnerName: winner.name,
          loserId: socket.id,
          loserName: playerNames.get(socket.id) || 'Unknown',
          scores: {},
        });
      }
      sessions.endSession(data.roomId);
    });

    // Chat
    socket.on(CHAT_EVENTS.MESSAGE, (data: { roomId: string; text: string; senderName: string }) => {
      const msg: ChatMessage = {
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        sender: socket.id,
        senderName: data.senderName,
        text: data.text,
        timestamp: Date.now(),
      };
      io.to(data.roomId).emit(CHAT_EVENTS.MESSAGE, msg);
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Player disconnected: ${socket.id}`);
      matchmaking.removePlayer(socket.id);
      const roomId = playerRooms.get(socket.id);
      if (roomId) {
        leaveRoom(socket, roomId);
      }
      playerNames.delete(socket.id);
    });

    function leaveRoom(socket: Socket, roomId: string) {
      const room = rooms.get(roomId);
      if (!room) return;

      room.players = room.players.filter(p => p.id !== socket.id);
      playerRooms.delete(socket.id);
      socket.leave(roomId);

      if (room.players.length === 0) {
        rooms.delete(roomId);
      } else {
        // If game was in progress, the remaining player wins
        if (room.status === 'playing') {
          room.status = 'finished';
          const winner = room.players[0];
          io.to(roomId).emit(GAME_EVENTS.RESULT, {
            winnerId: winner.id,
            winnerName: winner.name,
            loserId: socket.id,
            loserName: playerNames.get(socket.id) || 'Unknown',
            scores: {},
          });
          sessions.endSession(roomId);
        }
        broadcastRoomState(roomId);
      }
    }
  });
}
