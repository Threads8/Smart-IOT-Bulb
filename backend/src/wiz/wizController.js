const broadcastManager = require('../BroadcastManager');

class WizController {
    constructor(ip, port = 38899) {
        this.ip = ip;
        this.port = port;
    }

    sendCommand(payload) {
        return new Promise((resolve, reject) => {
            if (!this.ip) {
                return reject(new Error('WiZ bulb IP address is not configured.'));
            }

            // Proxy the UDP command through the ESP8266 via WebSocket
            broadcastManager.broadcast({
                type: 'WIZ_PROXY',
                ip: this.ip,
                port: this.port,
                payload: payload
            });

            // Resolve immediately since we can't synchronously await the UDP response over WS
            resolve({});
        });
    }

    // --- High Level API ---

    async getState() {
        return this.sendCommand({ method: 'getPilot', params: {} });
    }

    async turnOn() {
        return this.sendCommand({ method: 'setPilot', params: { state: true } });
    }

    async turnOff() {
        return this.sendCommand({ method: 'setPilot', params: { state: false } });
    }

    async setBrightness(dimming) {
        // dimming is 10-100
        dimming = Math.max(10, Math.min(100, dimming));
        return this.sendCommand({ method: 'setPilot', params: { dimming: dimming } });
    }

    async setRGB(r, g, b) {
        return this.sendCommand({ method: 'setPilot', params: { r, g, b } });
    }

    async setWhite(temp) {
        // temp usually between 2200 and 6500 K depending on the bulb
        return this.sendCommand({ method: 'setPilot', params: { temp } });
    }

    async activateScene(sceneId) {
        // scenes are usually integers 1-32
        return this.sendCommand({ method: 'setPilot', params: { sceneId } });
    }
}

module.exports = WizController;
