import { Thermometer, Droplets, Sun } from 'lucide-react';

interface EnvProps {
  temperature: number;
  humidity: number;
  lightLevel: number;
}

export default function EnvironmentWidget({ temperature, humidity, lightLevel }: EnvProps) {
  const getLightLabel = () => {
    if (lightLevel > 800) return 'BRIGHT';
    if (lightLevel > 500) return 'NORMAL';
    if (lightLevel > 200) return 'DIM';
    return 'DARK';
  };

  return (
    <div className="glass-panel">
      <div className="section-header">
        <span className="header-accent"></span>
        Environment
      </div>
      <div className="grid-3">
        {/* Temperature */}
        <div className="hud-stat accent-red">
          <div className="hud-label">
            <Thermometer size={12} />
            Temp
          </div>
          <div className="hud-value">{temperature.toFixed(1)}</div>
          <div className="stat-label" style={{ marginTop: '2px' }}>°C</div>
        </div>
        
        {/* Humidity */}
        <div className="hud-stat accent-blue">
          <div className="hud-label">
            <Droplets size={12} />
            Humid
          </div>
          <div className="hud-value">{humidity.toFixed(0)}</div>
          <div className="stat-label" style={{ marginTop: '2px' }}>%</div>
        </div>

        {/* Ambient Light */}
        <div className="hud-stat accent-orange">
          <div className="hud-label">
            <Sun size={12} />
            Light
          </div>
          <div className="hud-value" style={{ fontSize: '1rem' }}>{getLightLabel()}</div>
          <div className="stat-label" style={{ marginTop: '2px' }}>{lightLevel}</div>
        </div>
      </div>
    </div>
  );
}
