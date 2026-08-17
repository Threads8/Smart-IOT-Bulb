import { Power, Moon, Coffee, Palette, Brain, Tv, Leaf, Sunrise, Bed, Zap } from 'lucide-react';

interface LightState {
  state: boolean;
  dimming: number;
  mode?: string;
  progressive?: string;
}

interface LightingProps {
  state: LightState;
  apiUrl: string;
  onStateChange: () => void;
}

const modeColors: Record<string, { bg: string; glow: string }> = {
  night_light: { bg: 'rgba(20, 108, 255, 0.1)', glow: 'rgba(20, 108, 255, 0.15)' },
  cozy: { bg: 'rgba(255, 160, 40, 0.1)', glow: 'rgba(255, 160, 40, 0.15)' },
  true_colors: { bg: 'rgba(245, 245, 245, 0.06)', glow: 'rgba(245, 245, 245, 0.1)' },
  relax: { bg: 'rgba(160, 50, 180, 0.1)', glow: 'rgba(160, 50, 180, 0.15)' },
  focus: { bg: 'rgba(227, 27, 35, 0.08)', glow: 'rgba(20, 108, 255, 0.12)' },
  tv_time: { bg: 'rgba(20, 108, 255, 0.08)', glow: 'rgba(20, 108, 255, 0.12)' },
  plant_growth: { bg: 'rgba(53, 208, 127, 0.08)', glow: 'rgba(53, 208, 127, 0.12)' },
};

const modeIconColors: Record<string, string> = {
  night_light: '#4488FF',
  cozy: '#FFA028',
  true_colors: '#F5F5F5',
  relax: '#A832B4',
  focus: '#E31B23',
  tv_time: '#146CFF',
  plant_growth: '#35D07F',
};

export default function LightingWidget({ state, apiUrl, onStateChange }: LightingProps) {
  
  const togglePower = async () => {
    await fetch(`${apiUrl}/light/${state.state ? 'off' : 'on'}`, { method: 'POST' });
    onStateChange();
  };

  const changeBrightness = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await fetch(`${apiUrl}/light/brightness`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ level: parseInt(e.target.value) })
    });
    onStateChange();
  };

  const directPreset = async (preset: string) => {
    await fetch(`${apiUrl}/light/preset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset })
    });
    onStateChange();
  }

  const functionalModes = [
    { id: 'night_light', name: 'Night', icon: <Moon size={18} /> },
    { id: 'cozy', name: 'Cozy', icon: <Coffee size={18} /> },
    { id: 'true_colors', name: 'True', icon: <Palette size={18} /> },
    { id: 'relax', name: 'Relax', icon: <Zap size={18} /> },
    { id: 'focus', name: 'Focus', icon: <Brain size={18} /> },
    { id: 'tv_time', name: 'TV', icon: <Tv size={18} /> },
    { id: 'plant_growth', name: 'Plant', icon: <Leaf size={18} /> },
  ];

  return (
    <>
      {/* Power & Brightness Card */}
      <div className="glass-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div className="section-header" style={{ marginBottom: '4px' }}>
              <span className="header-accent"></span>
              Smart Light
            </div>
            <span className="stat-label">{state.state ? 'Light is ON' : 'Light is OFF'}</span>
          </div>
          <button 
            className={`power-btn ${state.state ? 'on' : ''}`}
            onClick={togglePower}
            aria-label={state.state ? 'Turn light off' : 'Turn light on'}
          >
            <Power size={22} />
          </button>
        </div>

        {/* Brightness */}
        <div style={{ marginBottom: '8px' }}>
          <div className="brightness-display">
            <span className="brightness-value">{state.dimming}</span>
            <span className="brightness-unit">%</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="100" 
            value={state.dimming} 
            onChange={changeBrightness}
            disabled={!state.state}
            style={{ opacity: state.state ? 1 : 0.3 }}
            aria-label="Brightness control"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="stat-label">10%</span>
            <span className="stat-label">BRIGHTNESS</span>
            <span className="stat-label">100%</span>
          </div>
        </div>
      </div>

      {/* Functional Modes */}
      <div className="glass-panel" style={{ marginTop: '16px' }}>
        <div className="section-header">
          <span className="header-accent"></span>
          Lighting Modes
        </div>
        <div className="preset-grid">
          {functionalModes.map(m => {
            const isActive = state.mode === m.id;
            const colors = modeColors[m.id] || { bg: 'rgba(255,255,255,0.03)', glow: 'transparent' };
            const iconColor = isActive ? (modeIconColors[m.id] || '#F5F5F5') : 'var(--text-muted)';
            
            return (
              <div 
                key={m.id} 
                className={`mode-card ${isActive ? 'active' : ''}`}
                onClick={() => directPreset(m.id)}
                role="button"
                aria-label={`Set light mode to ${m.name}`}
              >
                <div 
                  className="mode-icon" 
                  style={{ 
                    background: isActive ? colors.bg : 'rgba(255,255,255,0.03)',
                    color: iconColor,
                    boxShadow: isActive ? `0 0 15px ${colors.glow}` : 'none'
                  }}
                >
                  {m.icon}
                </div>
                <span className="mode-name">{m.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progressive Modes */}
      <div className="glass-panel" style={{ marginTop: '16px' }}>
        <div className="section-header">
          <span className="header-accent"></span>
          Progressive
        </div>
        <div className="grid-2">
          <div 
            className={`mode-card ${state.progressive === 'WAKEUP' ? 'active' : ''}`}
            onClick={() => directPreset('start_wakeup')}
            style={{ flexDirection: 'row', justifyContent: 'center', padding: '16px' }}
            role="button"
            aria-label="Start wake-up routine"
          >
            <div className="mode-icon" style={{ 
              background: state.progressive === 'WAKEUP' ? 'rgba(255, 160, 40, 0.1)' : 'rgba(255,255,255,0.03)',
              color: state.progressive === 'WAKEUP' ? '#FFA028' : 'var(--text-muted)'
            }}>
              <Sunrise size={18} />
            </div>
            <span className="mode-name" style={{ marginLeft: '8px' }}>Wake-up</span>
          </div>
          <div 
            className={`mode-card ${state.progressive === 'BEDTIME' ? 'active' : ''}`}
            onClick={() => directPreset('start_bedtime')}
            style={{ flexDirection: 'row', justifyContent: 'center', padding: '16px' }}
            role="button"
            aria-label="Start bedtime routine"
          >
            <div className="mode-icon" style={{ 
              background: state.progressive === 'BEDTIME' ? 'rgba(20, 108, 255, 0.1)' : 'rgba(255,255,255,0.03)',
              color: state.progressive === 'BEDTIME' ? '#4488FF' : 'var(--text-muted)'
            }}>
              <Bed size={18} />
            </div>
            <span className="mode-name" style={{ marginLeft: '8px' }}>Bedtime</span>
          </div>
        </div>
      </div>
    </>
  );
}
