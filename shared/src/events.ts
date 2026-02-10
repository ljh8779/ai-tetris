export const LOBBY_EVENTS = {
  JOIN: 'lobby:join',
  STATE: 'lobby:state',
} as const;

export const ROOM_EVENTS = {
  CREATE: 'room:create',
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  READY: 'room:ready',
  STATE: 'room:state',
  ERROR: 'room:error',
} as const;

export const GAME_EVENTS = {
  START: 'game:start',
  COUNTDOWN: 'game:countdown',
  BOARD: 'game:board',
  GARBAGE_SEND: 'game:garbage_send',
  GARBAGE_RECEIVE: 'game:garbage_receive',
  OVER: 'game:over',
  RESULT: 'game:result',
} as const;

export const CHAT_EVENTS = {
  MESSAGE: 'chat:message',
} as const;

export const MATCHMAKING_EVENTS = {
  QUEUE_JOIN: 'matchmaking:queue_join',
  QUEUE_LEAVE: 'matchmaking:queue_leave',
  MATCH_FOUND: 'matchmaking:match_found',
} as const;
