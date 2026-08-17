const dgram = require('dgram');

class WizController {
    constructor(ip, port = 38899) {
        this.ip = ip;
        this.port = port;
        this.client = dgram.createSocket('udp4');
    }

    /**
     * Send a raw command to the WiZ bulb
     * @param {Object} payload The JSON payload
     * @returns {Promise<Object>} The response from the bulb
     */
    sendCommand(payload) {
        return new Promise((resolve, reject) => {
            if (!this.ip) {
                return reject(new Error('WiZ bulb IP address is not configured.'));
            }

            const message = Buffer.from(JSON.stringify(payload));
            let resolved = false;

            // Setup timeout
            const timeout = setTimeout(() => {
                if (!resolved) {
                    this.client.removeAllListeners('message');
                    reject(new Error(`Timeout waiting for response from WiZ bulb at ${this.ip}`));
                }
            }, 3000); // 3 second timeout

            // One-time listener for the response
            this.client.once('message', (msg) => {
                resolved = true;
                clearTimeout(timeout);
                try {
                    const response = JSON.parse(msg.toString());
                    resolve(response);
                } catch (e) {
                    reject(new Error('Failed to parse WiZ bulb response: ' + e.message));
                }
            });

            this.client.send(message, 0, message.length, this.port, this.ip, (err) => {
                if (err) {
                    resolved = true;
                    clearTimeout(timeout);
                    this.client.removeAllListeners('message');
                    reject(err);
                }
            });
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
