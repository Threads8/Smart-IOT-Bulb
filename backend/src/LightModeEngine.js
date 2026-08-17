class LightModeEngine {
    constructor() {
        this.LIGHT_MODES = {
            night_light: { brightness: 10, temperature: 2200 },
            cozy: { brightness: 40, temperature: 2700 },
            true_colors: { brightness: 100, temperature: 5000 },
            relax: { brightness: 30, temperature: 2700 },
            focus: { brightness: 80, temperature: 4000 },
            tv_time: { brightness: 20, temperature: 2700 },
            plant_growth: { brightness: 100, r: 255, g: 0, b: 255 } // Purple/Pink
        };

        this.currentMode = null;
        this.progressiveState = null; // { type: 'BEDTIME' | 'WAKEUP', startTime, endTime, startDim, endDim }
    }

    async transitionToMode(bulb, modeName) {
        if (!bulb) return;
        const config = this.LIGHT_MODES[modeName];
        if (!config) return;

        console.log(`[LIGHT ENGINE] Transitioning to mode: ${modeName}`);
        
        await bulb.turnOn();
        if (config.temperature) {
            await bulb.setWhite(config.temperature);
        } else if (config.r !== undefined) {
            await bulb.setRGB(config.r, config.g, config.b);
        }
        await bulb.setBrightness(config.brightness);
        
        this.currentMode = modeName;
        this.progressiveState = null;
    }

    // Call this once to kick off a progressive dimming/brightening phase
    startProgressive(type, durationMins, bulb) {
        const now = Date.now();
        const durationMs = durationMins * 60 * 1000;
        
        this.progressiveState = {
            type,
            startTime: now,
            endTime: now + durationMs,
            startDim: type === 'BEDTIME' ? 100 : 10,
            endDim: type === 'BEDTIME' ? 0 : 100
        };
        console.log(`[LIGHT ENGINE] Started Progressive ${type} for ${durationMins}m`);
    }

    // Call this every heartbeat / loop
    async evaluateProgressive(bulb, handleOled) {
        if (!this.progressiveState || !bulb) return;
        
        const now = Date.now();
        const { type, startTime, endTime, startDim, endDim } = this.progressiveState;

        if (now >= endTime) {
            // Done
            if (type === 'BEDTIME') {
                await bulb.turnOff();
            } else {
                await bulb.setBrightness(100);
            }
            this.progressiveState = null;
            return;
        }

        // Calculate interpolation
        const progress = (now - startTime) / (endTime - startTime);
        const currentDim = Math.round(startDim + (endDim - startDim) * progress);
        
        // Only update bulb if it changed significantly (e.g. every 5%) to save API calls
        if (!this.lastDim || Math.abs(this.lastDim - currentDim) >= 2) {
            this.lastDim = currentDim;
            if (currentDim > 0) {
                await bulb.turnOn();
                // Ensure warm for both progressive phases
                await bulb.setWhite(2700);
                await bulb.setBrightness(currentDim);
            }
        }
    }
}

module.exports = new LightModeEngine();
