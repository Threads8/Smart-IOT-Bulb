import { useState, useEffect } from 'react';
import { Home, Bot, Lightbulb, Focus, MoreHorizontal, RefreshCw } from 'lucide-react';
import EnvironmentWidget from './components/EnvironmentWidget';
import LightingWidget from './components/LightingWidget';
import DeviceStatusWidget from './components/DeviceStatusWidget';
import ChatWidget from './components/ChatWidget';
import TimeCardWidget from './components/TimeCardWidget';

// Replace with your backend URL
const BACKEND_URL = 'http://localhost:3000/api';

type Page = 'home' | 'ai' | 'light' | 'focus' | 'more';

function App() {
  const [activePage, setActivePage] = useState<Page>('home');
  const [envState, setEnvState] = useState({
    online: false,
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    focusRemaining: 0,
    lastHeartbeat: 0,
    timeState: undefined as any,
    lightMode: 'manual'
  });
  
  const [lightState, setLightState] = useState({
    state: false,
    dimming: 100,
    r: 255, g: 255, b: 255,
    temp: 2700
  });

  const fetchEnvironment = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/environment`);
      if (res.ok) {
        const data = await res.json();
        setEnvState(data);
      }
    } catch (e) {
      console.error("Failed to fetch environment");
    }
  };

  const fetchLight = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/light`);
      if (res.ok) {
        const data = await res.json();
        setLightState(data);
      }
    } catch (e) {
      console.error("Failed to fetch light status");
    }
  };

  useEffect(() => {
    // Initial fetch
    fetchEnvironment();
    fetchLight();

    // Poll every 5 seconds
    const interval = setInterval(() => {
      fetchEnvironment();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    if (hour < 21) return 'Good Evening';
    return 'Good Night';
  };

  const getTimeString = () => {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getPhaseLabel = () => {
    if (!envState.timeState) return '';
    return envState.timeState.phase?.replace('_', ' ') || '';
  };

  const renderPage = () => {
    switch (activePage) {
      case 'home':
        return (
          <div className="page-enter" key="home">
            {/* Time & Context Card */}
            <TimeCardWidget 
              timeState={envState.timeState} 
              envState={envState} 
            />

            {/* Quick Environment Stats */}
            <EnvironmentWidget
              temperature={envState.temperature}
              humidity={envState.humidity}
              lightLevel={envState.lightLevel}
            />

            {/* Device Status */}
            <DeviceStatusWidget 
              online={envState.online} 
              lastHeartbeat={envState.lastHeartbeat} 
            />

            {/* Focus Mode (if active) */}
            {envState.focusRemaining > 0 && (
              <div className="focus-overlay">
                <div className="focus-label">⚡ Focus Mode</div>
                <div className="focus-timer">
                  {Math.floor(envState.focusRemaining)}:{Math.floor((envState.focusRemaining % 1) * 60).toString().padStart(2, '0')}
                </div>
                <div className="focus-subtitle">AI Assistant Protecting Your Focus</div>
              </div>
            )}
          </div>
        );
      
      case 'ai':
        return (
          <div className="page-enter" key="ai">
            <ChatWidget 
              apiUrl={BACKEND_URL} 
              onChatComplete={() => {
                fetchLight();
              }}
            />
          </div>
        );
      
      case 'light':
        return (
          <div className="page-enter" key="light">
            <LightingWidget 
              state={{ ...lightState, mode: envState.lightMode, progressive: envState.timeState?.phase === 'BEDTIME' || envState.timeState?.phase === 'WAKE_UP' ? envState.timeState.phase : undefined }} 
              apiUrl={BACKEND_URL}
              onStateChange={fetchLight}
            />
          </div>
        );
      
      case 'focus':
        return (
          <div className="page-enter" key="focus">
            {envState.focusRemaining > 0 ? (
              <div className="focus-overlay" style={{ minHeight: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div className="focus-label">⚡ Focus Mode Active</div>
                <div className="focus-timer">
                  {Math.floor(envState.focusRemaining)}:{Math.floor((envState.focusRemaining % 1) * 60).toString().padStart(2, '0')}
                </div>
                <div className="focus-subtitle" style={{ marginBottom: '20px' }}>Do Not Disturb</div>
                <div className="grid-2" style={{ maxWidth: '280px', margin: '0 auto', width: '100%' }}>
                  <div className="hud-stat accent-red">
                    <div className="hud-label">Light</div>
                    <div className="hud-value" style={{ fontSize: '1rem' }}>{envState.lightMode?.toUpperCase() || 'MANUAL'}</div>
                  </div>
                  <div className="hud-stat accent-blue">
                    <div className="hud-label">Temp</div>
                    <div className="hud-value" style={{ fontSize: '1rem' }}>{envState.temperature.toFixed(1)}°C</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '40px 24px' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🎯</div>
                <div className="section-header" style={{ justifyContent: 'center', marginBottom: '8px' }}>
                  <span className="header-accent"></span>
                  Focus Mode
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: 1.5 }}>
                  Ask your AI assistant to start a focus timer.
                </p>
                <button 
                  className="btn" 
                  style={{ margin: '0 auto' }}
                  onClick={() => setActivePage('ai')}
                >
                  <Bot size={16} /> Talk to AI
                </button>
              </div>
            )}
          </div>
        );
      
      case 'more':
        return (
          <div className="page-enter" key="more">
            <div className="glass-panel">
              <div className="section-header">
                <span className="header-accent"></span>
                System Info
              </div>

              <div className="device-row">
                <span className="device-name">WEB//AI Version</span>
                <span className="device-status" style={{ color: 'var(--text-muted)' }}>1.0.0</span>
              </div>
              <div className="device-row">
                <span className="device-name">Backend</span>
                <span className="device-status">
                  <span className="status-indicator online"></span>
                  <span style={{ color: 'var(--success)' }}>Connected</span>
                </span>
              </div>
              <div className="device-row">
                <span className="device-name">AI Model</span>
                <span className="device-status" style={{ color: 'var(--text-muted)' }}>GLM-5.2</span>
              </div>
              <div className="device-row">
                <span className="device-name">ESP8266</span>
                <span className="device-status">
                  <span className={`status-indicator ${envState.online ? 'online' : 'offline'}`}></span>
                  <span style={{ color: envState.online ? 'var(--success)' : 'var(--danger)' }}>
                    {envState.online ? 'Online' : 'Offline'}
                  </span>
                </span>
              </div>
            </div>

            <div className="glass-panel" style={{ marginTop: '16px' }}>
              <div className="section-header">
                <span className="header-accent"></span>
                Quick Actions
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button className="btn" onClick={() => { fetchEnvironment(); fetchLight(); }}>
                  <RefreshCw size={16} /> Refresh All Data
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="app-container">
      {/* ── Header ── */}
      <header className="header glass-panel" style={{ padding: '14px 18px' }}>
        <div className="header-brand">
          <div className="brand-logo">W</div>
          <div className="header-info">
            <p className="greeting">{getGreeting()}</p>
            <p className="greeting-name">RAHUL</p>
          </div>
        </div>
        <div className="header-right">
          <div className={`ai-status-badge ${envState.online ? '' : 'offline'}`}>
            <span className="status-dot"></span>
            {envState.online ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      {renderPage()}

      {/* ── Bottom Navigation ── */}
      <nav className="bottom-nav">
        <button className={`nav-item ${activePage === 'home' ? 'active' : ''}`} onClick={() => setActivePage('home')}>
          <Home size={20} className="nav-icon" />
          <span className="nav-label">Home</span>
        </button>
        <button className={`nav-item ${activePage === 'ai' ? 'active' : ''}`} onClick={() => setActivePage('ai')}>
          <Bot size={20} className="nav-icon" />
          <span className="nav-label">AI</span>
        </button>
        <button className={`nav-item ${activePage === 'light' ? 'active' : ''}`} onClick={() => setActivePage('light')}>
          <Lightbulb size={20} className="nav-icon" />
          <span className="nav-label">Light</span>
        </button>
        <button className={`nav-item ${activePage === 'focus' ? 'active' : ''}`} onClick={() => setActivePage('focus')}>
          <Focus size={20} className="nav-icon" />
          <span className="nav-label">Focus</span>
        </button>
        <button className={`nav-item ${activePage === 'more' ? 'active' : ''}`} onClick={() => setActivePage('more')}>
          <MoreHorizontal size={20} className="nav-icon" />
          <span className="nav-label">More</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
