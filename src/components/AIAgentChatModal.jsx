// Roomly - Interactive AI Spatial Agent Chat Modal
// Full conversational chat interface for natural language interior layout commands
// ("move desk to corner", "i want more space", "reading nook", "plant sanctuary", etc.)

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, Bot, User, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { QUICK_SUGGESTIONS, solveSpatialCommand } from './AIAssistant';

export default function AIAgentChatModal({
  isOpen,
  onClose,
  room,
  selectedItem,
  onApplySuggestions,
  onNotify
}) {
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "👋 Hi! I'm your Roomly Spatial AI Agent. Tell me how you'd like your room arranged, or tap an action below. I can reposition furniture, optimize walkways, or assemble designer zones!",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = (overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || isProcessing) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    setTimeout(() => {
      const result = solveSpatialCommand(text, room, selectedItem);
      setIsProcessing(false);

      if (result.success) {
        onApplySuggestions(result.items);
        if (onNotify) onNotify(result.message);

        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: result.message,
          applied: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const aiMsg = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: result.error || "I didn't quite catch that. Try asking to move a piece (e.g. 'move desk to corner') or tap an action below!",
          error: true,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    }, 250);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div className="ai-agent-modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="ai-agent-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ai-agent-header">
          <div className="ai-agent-avatar-wrap">
            <div className="ai-agent-avatar-icon">
              <Sparkles size={20} color="#FAF9F6" />
            </div>
            <div>
              <div className="ai-agent-title-row">
                <h3 className="ai-agent-title">Roomly Spatial AI Agent</h3>
                <span className="ai-agent-online-pill">
                  <span className="ai-agent-online-dot" /> Online
                </span>
              </div>
              <p className="ai-agent-subtitle">Autonomous interior architect & spatial solver</p>
            </div>
          </div>
          <button
            type="button"
            className="ai-agent-close-btn"
            onClick={onClose}
            title="Close AI Agent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="ai-agent-messages-container">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`ai-agent-message-row ${m.sender === 'user' ? 'user-row' : 'ai-row'}`}
            >
              {m.sender === 'ai' && (
                <div className="ai-msg-avatar">
                  <Bot size={15} color="#466352" />
                </div>
              )}
              <div className={`ai-agent-bubble ${m.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                <div className="ai-msg-text">{m.text}</div>
                {m.applied && (
                  <div className="ai-applied-tag">
                    <CheckCircle2 size={12} color="#466352" />
                    <span>Applied to 2D Blueprint & 3D Studio</span>
                  </div>
                )}
                {m.error && (
                  <div className="ai-error-tag">
                    <AlertCircle size={12} color="#C8785E" />
                    <span>Spatial rule recommendation</span>
                  </div>
                )}
              </div>
              {m.sender === 'user' && (
                <div className="user-msg-avatar">
                  <User size={15} color="#FFFFFF" />
                </div>
              )}
            </div>
          ))}

          {isProcessing && (
            <div className="ai-agent-message-row ai-row">
              <div className="ai-msg-avatar">
                <Bot size={15} color="#466352" />
              </div>
              <div className="ai-agent-bubble ai-bubble typing-bubble">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Suggestion Chips inside modal */}
        <div className="ai-agent-chips-tray">
          <span className="ai-agent-chips-label">Quick Actions:</span>
          <div className="ai-agent-chips-scroll">
            {QUICK_SUGGESTIONS.map((item, i) => (
              <button
                key={i}
                type="button"
                className="ai-agent-chip-btn"
                onClick={() => handleSend(item.query)}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="ai-agent-input-bar">
          <input
            ref={inputRef}
            type="text"
            className="ai-agent-text-input"
            placeholder="Tell AI to move or arrange anything (e.g. 'move desk to corner')..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
          />
          <button
            type="button"
            className="ai-agent-send-btn"
            onClick={() => handleSend()}
            disabled={!input.trim() || isProcessing}
            title="Send layout instruction"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}

