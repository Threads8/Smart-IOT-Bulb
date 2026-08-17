const WebSocket = require('ws');

class BroadcastManager {
    constructor() {
        this.wss = null;
        this.clients = new Set();
    }

    init(server) {
        this.wss = new WebSocket.Server({ server });

        this.wss.on('connection', (ws) => {
            console.log('[WS] Client connected');
            this.clients.add(ws);

            ws.on('message', (message) => {
                try {
                    const data = JSON.parse(message);
                    if (data.type === 'BUTTON_EVENT') {
                        console.log(`[WS] Button Pressed: ${data.action}`);
                        // Handle button interrupt if needed
                    } else if (data.type === 'HEARTBEAT') {
                        if (this.onHeartbeatCallback) {
                            this.onHeartbeatCallback(data);
                        }
                    }
                } catch (e) {
                    console.error('[WS] Failed to parse message', e);
                }
            });

            ws.on('close', () => {
                console.log('[WS] Client disconnected');
                this.clients.delete(ws);
            });
        });
    }

    broadcast(payload) {
        const msg = JSON.stringify(payload);
        for (let client of this.clients) {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        }
    }

    sendAiState(screen) {
        this.broadcast({ type: 'AI_STATE', screen });
    }

    sendAiDisplayAction(action1, action2 = "") {
        this.broadcast({ type: 'AI_DISPLAY', screen: 'ACTION', action1, action2 });
    }

    sendAiDisplayResponse(message) {
        this.broadcast({ type: 'AI_DISPLAY', screen: 'RESPONSE', message });
    }

    sendAiDisplayNotification(title, message, duration = 5000) {
        this.broadcast({ type: 'AI_DISPLAY', screen: 'NOTIFICATION', title, message, duration });
    }

    sendAiDisplayReminder(title, message, duration = 5000) {
        this.broadcast({ type: 'AI_DISPLAY', screen: 'REMINDER', title, message, duration });
    }

    sendTimerUpdate(title, remainingStr) {
        this.broadcast({ type: 'TIMER_UPDATE', title, remaining: remainingStr });
    }

    sendProgressiveUpdate(title, statusStr) {
        this.broadcast({ type: 'PROGRESSIVE_UPDATE', title, status: statusStr });
    }

    sendEnvironmentUpdate(lightModeStr) {
        this.broadcast({ type: 'ENVIRONMENT_UPDATE', lightMode: lightModeStr });
    }
}

module.exports = new BroadcastManager();
