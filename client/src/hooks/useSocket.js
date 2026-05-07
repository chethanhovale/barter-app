import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

export function useSocket() {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('barter_token');
    if (!token) return;

    socketRef.current = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  const joinTrade  = useCallback((tradeId) => socketRef.current?.emit('join_trade', tradeId), []);
  const leaveTrade = useCallback((tradeId) => socketRef.current?.emit('leave_trade', tradeId), []);

  const sendMessage = useCallback((trade_id, content) => {
    socketRef.current?.emit('send_message', { trade_id, content });
  }, []);

  const onMessage = useCallback((handler) => {
    socketRef.current?.on('new_message', handler);
    return () => socketRef.current?.off('new_message', handler);
  }, []);

  const emitTyping = useCallback((trade_id, isTyping) => {
    socketRef.current?.emit('typing', { trade_id, isTyping });
  }, []);

  const onTyping = useCallback((handler) => {
    socketRef.current?.on('user_typing', handler);
    return () => socketRef.current?.off('user_typing', handler);
  }, []);

  return { joinTrade, leaveTrade, sendMessage, onMessage, emitTyping, onTyping };
}
