import React, { useEffect, useState, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Chat.css';

export default function Chat({ tradeId }) {
  const { user }                    = useAuth();
  const { joinTrade, leaveTrade, sendMessage, onMessage, emitTyping, onTyping } = useSocket();
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState('');
  const [typingUser, setTypingUser] = useState('');
  const bottomRef                   = useRef(null);
  const typingTimer                 = useRef(null);

  // Load history + join socket room
  useEffect(() => {
    if (!tradeId) return;
    api.get(`/messages/${tradeId}`).then(r => setMessages(r.data)).catch(() => {});
    joinTrade(tradeId);

    const offMsg    = onMessage((msg) => setMessages(prev => [...prev, msg]));
    const offTyping = onTyping(({ username, isTyping }) => {
      if (username === user?.username) return;
      setTypingUser(isTyping ? username : '');
    });

    return () => {
      leaveTrade(tradeId);
      offMsg?.();
      offTyping?.();
    };
  }, [tradeId]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUser]);

  const handleInput = (e) => {
    setInput(e.target.value);
    emitTyping(tradeId, true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(tradeId, false), 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage(tradeId, input.trim());
    setInput('');
    emitTyping(tradeId, false);
  };

  const formatTime = (ts) =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="chat-container">
      <div className="chat-header">💬 Trade Chat</div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <p className="chat-empty">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <div key={msg.id} className={`chat-bubble ${isMe ? 'me' : 'them'}`}>
              {!isMe && <span className="bubble-name">{msg.username}</span>}
              <p className="bubble-text">{msg.content}</p>
              <span className="bubble-time">{formatTime(msg.created_at)}</span>
            </div>
          );
        })}
        {typingUser && (
          <div className="typing-indicator">
            <span>{typingUser} is typing</span>
            <span className="dots"><span/><span/><span/></span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-row" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message…"
          value={input}
          onChange={handleInput}
        />
        <button type="submit" disabled={!input.trim()}>Send</button>
      </form>
    </div>
  );
}
