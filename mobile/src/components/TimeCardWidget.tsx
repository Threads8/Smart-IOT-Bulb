import { Clock, Sun, Moon, Sunrise, Bed, Cloud } from 'lucide-react';

interface TimeState {
  currentTime: string;
  currentDate: string;
  phase: string;
  bedtime: string;
  wakeUp: string;
  isDay: boolean;
  isNight: boolean;
}

interface EnvState {
  temperature: number;
  humidity: number;
  lightLevel: number;
}

interface TimeCardProps {
  timeState?: TimeState;
  envState?: EnvState;
}

export default function TimeCardWidget({ timeState, envState }: TimeCardProps) {
  if (!timeState || !envState) return null;

  const formatPhase = (phase: string) => {
    return phase.replace('_', ' ');
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'EARLY_MORNING': return <Sunrise size={18} color="#FFA028" />;
      case 'DAY': return <Sun size={18} color="#FFB020" />;
      case 'EVENING': return <Cloud size={18} color="#A832B4" />;
      case 'NIGHT': return <Moon size={18} color="#146CFF" />;
      case 'BEDTIME': return <Bed size={18} color="#4488FF" />;
      case 'SLEEP': return <Moon size={18} color="#2244AA" />;
      default: return <Clock size={18} />;
    }
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'EARLY_MORNING': return 'rgba(255, 160, 40, 0.08)';
      case 'DAY': return 'rgba(255, 176, 32, 0.08)';
      case 'EVENING': return 'rgba(168, 50, 180, 0.08)';
      case 'NIGHT': return 'rgba(20, 108, 255, 0.08)';
      case 'BEDTIME': return 'rgba(68, 136, 255, 0.08)';
      case 'SLEEP': return 'rgba(34, 68, 170, 0.08)';
      default: return 'rgba(255,255,255,0.03)';
    }
  };

  return (
    <div className="glass-panel glow-blue" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Subtle gradient overlay based on phase */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(ellipse at 80% 20%, ${getPhaseColor(timeState.phase)}, transparent 60%)`,
        pointerEvents: 'none',
        borderRadius: '16px'
      }}></div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Time & Phase */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ 
              fontFamily: 'var(--font-mono)',
              fontSize: '2.8rem', 
              fontWeight: 700, 
              lineHeight: 1,
              letterSpacing: '-1px',
              color: 'var(--text-primary)'
            }}>
              {timeState.currentTime}
            </div>
            <div style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.7rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '2px',
              marginTop: '6px'
            }}>
              {timeState.phase === 'EARLY_MORNING' || timeState.phase === 'DAY' ? 'Morning' : timeState.phase === 'EVENING' ? 'Evening' : 'Night'} Phase
            </div>
          </div>

          {/* Phase Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '6px 12px',
            borderRadius: '20px',
            background: getPhaseColor(timeState.phase),
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            {getPhaseIcon(timeState.phase)}
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '0.65rem',
              fontWeight: 600,
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              {formatPhase(timeState.phase)}
            </span>
          </div>
        </div>

        {/* Bedtime & Wake-up */}
        <div className="grid-2" style={{ marginBottom: '14px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            padding: '10px 12px', 
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Bed size={12} color="var(--text-muted)" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Bedtime</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {timeState.bedtime}
            </div>
          </div>
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            padding: '10px 12px', 
            borderRadius: '10px',
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <Sunrise size={12} color="var(--text-muted)" />
              <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Wake-up</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {timeState.wakeUp}
            </div>
          </div>
        </div>

        {/* Environment Summary Row */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          borderTop: '1px solid rgba(255,255,255,0.04)', 
          paddingTop: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Env</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
              {envState.temperature.toFixed(1)}°C
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>·</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
              {envState.humidity}%
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Ambient</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', fontWeight: 600 }}>
              {envState.lightLevel < 300 ? 'LOW' : 'OK'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
