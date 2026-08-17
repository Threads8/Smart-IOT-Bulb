class AutomationEngine {
    constructor() {
        this.ldrState = "NORMAL";
        this.ldrDarkStartTime = 0;
        this.lastBreakPrompt = 0;
        
        this.rules = [
            {
                id: 'auto_light_evening',
                enabled: true,
                condition: (env, timeState, bulbState, focus) => {
                    // Using TimeManager state
                    return timeState.phase === 'EVENING' && 
                           env.ldrStabilized === 'DARK' && 
                           !bulbState.state && 
                           !focus.active;
                },
                action: async (bulb, oled, lightEngine) => {
                    if (lightEngine) {
                        await lightEngine.transitionToMode(bulb, 'cozy');
                    }
                    if (oled) {
                        await oled("AUTO LIGHT", "EVENING COZY");
                    }
                }
            },
            {
                id: 'auto_light_night',
                enabled: true,
                condition: (env, timeState, bulbState, focus) => {
                    return timeState.phase === 'NIGHT' && 
                           env.ldrStabilized === 'DARK' && 
                           (!bulbState.state || lightEngine.currentMode !== 'night_light') && 
                           !focus.active;
                },
                action: async (bulb, oled, lightEngine) => {
                    if (lightEngine) {
                        await lightEngine.transitionToMode(bulb, 'night_light');
                    }
                }
            }
        ];
    }

    processLdrHysteresis(currentLightLevel) {
        const isCurrentlyDark = currentLightLevel < 300;
        
        if (isCurrentlyDark) {
            if (this.ldrDarkStartTime === 0) {
                this.ldrDarkStartTime = Date.now();
            } else if (Date.now() - this.ldrDarkStartTime > 30000) { // 30 seconds debounce
                this.ldrState = "DARK";
            }
        } else {
            this.ldrDarkStartTime = 0;
            this.ldrState = "BRIGHT";
        }
        
        return this.ldrState;
    }

    async evaluate(deviceState, bulbState, bulb, handleOled, focusRemaining, timeState, lightEngine) {
        const ldrStabilized = this.processLdrHysteresis(deviceState.lightLevel);
        
        const env = {
            temperature: deviceState.temperature,
            humidity: deviceState.humidity,
            lightLevel: deviceState.lightLevel,
            ldrStabilized
        };
        const focus = {
            active: focusRemaining > 0,
            elapsed: global.focusStartTime ? (Date.now() - global.focusStartTime) / 60000 : 0
        };

        for (const rule of this.rules) {
            if (rule.enabled) {
                try {
                    if (rule.condition(env, timeState, bulbState, focus)) {
                        console.log(`[AUTOMATION] Triggering rule: ${rule.id}`);
                        await rule.action(bulb, handleOled, lightEngine);
                        // Simple 5-min lockout could be added here
                    }
                } catch (e) {
                    console.error(`Automation error on ${rule.id}:`, e);
                }
            }
        }
    }
}

module.exports = new AutomationEngine();
