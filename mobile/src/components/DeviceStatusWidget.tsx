import { useState, useEffect } from 'react';
import { Clock, Cpu, Radio, MonitorSmartphone } from 'lucide-react';

interface DeviceStatusWidgetProps {
  online: boolean;
  lastHeartbeat: number;
}

export default function DeviceStatusWidget({ online, lastHeartbeat }: DeviceStatusWidgetProps) {
  const [timeSince, setTimeSince] = useState('');

  useEffect(() => {
    const updateTime = () => {
      if (!lastHeartbeat) return;
      const seconds = Math.floor((Date.now() - lastHeartbeat) / 1000);
      if (seconds < 60) setTimeSince(`${seconds}s ago`);
      else setTimeSince(`${Math.floor(seconds / 60)}m ago`);
    };
    
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastHeartbeat]);

  return (
    <div className="glass-panel">
      <div className="section-header">
        <span className="header-accent"></span>
        Device HUD
      </div>

      <div className="device-row">
        <span className="device-name">
          <Cpu size={14} />
          ESP8266
        </span>
        <span className="device-status">
          <span className={`status-indicator ${online ? 'online' : 'offline'}`}></span>
          <span style={{ color: online ? 'var(--success)' : 'var(--danger)' }}>
            {online ? 'Online' : 'Offline'}
          </span>
        </span>
      </div>

      <div className="device-row">
        <span className="device-name">
          <Radio size={14} />
          WiFi Signal
        </span>
        <span className="device-status" style={{ color: online ? 'var(--text-secondary)' : 'var(--text-muted)' }}>
          {online ? 'Connected' : 'N/A'}
        </span>
      </div>

      <div className="device-row">
        <span className="device-name">
          <MonitorSmartphone size={14} />
          OLED Display
        </span>
        <span className="device-status">
          <span className={`status-indicator ${online ? 'online' : 'offline'}`}></span>
          <span style={{ color: online ? 'var(--success)' : 'var(--text-muted)' }}>
            {online ? 'Active' : 'Inactive'}
          </span>
        </span>
      </div>

      <div className="device-row">
        <span className="device-name">
          <Clock size={14} />
          Last Heartbeat
        </span>
        <span className="device-status" style={{ 
          color: 'var(--text-muted)', 
          fontFamily: 'var(--font-mono)', 
          fontSize: '0.7rem' 
        }}>
          {timeSince || 'Never'}
        </span>
      </div>
    </div>
  );
}
