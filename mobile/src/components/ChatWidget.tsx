import { useState, useRef } from 'react';
import { Mic, MicOff, Send, Zap, Bot } from 'lucide-react';

interface ChatWidgetProps {
  apiUrl: string;
  onChatComplete?: () => void;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  actions?: any[];
}

export default function ChatWidget({ apiUrl, onChatComplete }: ChatWidgetProps) {
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const recognitionRef = useRef<any>(null);

  const getOrbState = () => {
    if (isListening) return 'listening';
    if (isThinking) return 'thinking';
    return '';
  };

  const getOrbLabel = () => {
    if (isListening) return 'LISTENING...';
    if (isThinking) return 'THINKING...';
    return 'READY';
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      return;
    }

    try {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        alert("Your browser does not support Speech Recognition.");
        return;
      }
      
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      let finalText = "";
      recognition.onresult = (event: any) => {
        finalText = event.results[0][0].transcript;
        setTranscript(finalText);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (finalText) {
          sendToAI(finalText);
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendText = () => {
    if (textInput.trim()) {
      sendToAI(textInput.trim());
      setTextInput("");
    }
  };

  const sendToAI = async (text: string) => {
    setIsThinking(true);
    setHistory(prev => [...prev, { role: 'user', text }]);
    
    try {
      const res = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      if (data.reply) {
        setHistory(prev => [...prev, { role: 'assistant', text: data.reply, actions: data.actions }]);
        speak(data.reply);
        if (onChatComplete) onChatComplete();
      } else if (data.error) {
        setHistory(prev => [...prev, { role: 'assistant', text: "Error: " + data.error }]);
      }
    } catch (e) {
      setHistory(prev => [...prev, { role: 'assistant', text: "Failed to connect to AI brain." }]);
    } finally {
      setIsThinking(false);
      setTranscript("");
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };
  
  const quickActions = [
    "How's my room?",
    "Start a 25m focus timer",
    "Turn the light warm",
    "What are my tasks?"
  ];

  return (
    <div className="glass-panel glow-red" style={{ display: 'flex', flexDirection: 'column' }}>
      
      {/* AI Orb Hero */}
      <div className="ai-orb-container">
        <div className={`ai-orb ${getOrbState()}`} onClick={toggleListening} role="button" aria-label="Toggle voice assistant">
          <div className="orb-glow"></div>
          <div className="orb-ring"></div>
          <div className="orb-core"></div>
          <div className="orb-inner-glow"></div>
          <div className="orb-web"></div>
        </div>
        <span className="ai-orb-label">{getOrbLabel()}</span>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions" style={{ marginBottom: '12px' }}>
        {quickActions.map(action => (
          <button 
            key={action} 
            className="quick-chip" 
            onClick={() => sendToAI(action)}
            disabled={isThinking}
          >
            {action}
          </button>
        ))}
      </div>

      {/* Chat History */}
      <div className="chat-container" style={{ minHeight: '80px', marginBottom: '8px' }}>
        {history.length === 0 && !isThinking && !isListening && (
          <div className="empty-state">
            <Bot size={24} style={{ marginBottom: '8px', opacity: 0.3 }} />
            <div>Tap the orb to speak, or type below.</div>
          </div>
        )}
        
        {history.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <div>{msg.text}</div>
            
            {/* Tool Badges */}
            {msg.actions && msg.actions.length > 0 && (
              <div className="tool-badges">
                {msg.actions.map((act: any, j: number) => (
                  <span key={j} className={`tool-badge ${act.status === 'success' ? 'success' : 'failure'}`}>
                    <Zap size={8} /> {act.tool}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
        
        {(isListening || transcript) && (
          <div className="chat-bubble user" style={{ opacity: 0.7 }}>
            {transcript || "Listening..."}
          </div>
        )}
        
        {isThinking && (
          <div className="chat-bubble assistant">
            <div className="thinking-indicator">
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
              <span className="thinking-dot"></span>
            </div>
          </div>
        )}
      </div>

      {/* AI Terminal Input */}
      <div className="ai-terminal">
        <input 
          type="text" 
          value={textInput} 
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
          placeholder="> ask ai..."
          className="terminal-input"
          disabled={isThinking}
          aria-label="AI command input"
        />
        
        {textInput.trim() ? (
          <button 
            className="send-btn"
            onClick={handleSendText}
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        ) : (
          <button 
            className={`mic-btn ${isListening ? 'listening' : ''}`}
            onClick={toggleListening}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}
      </div>
    </div>
  );
}
