const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.resolve(__dirname, '../../.env');
const envExamplePath = path.resolve(__dirname, '../../.env.example');
if (require('fs').existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config({ path: envExamplePath });
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Init WiZ Controller
const WizController = require('./wiz/wizController');
const bulb = process.env.WIZ_LIGHT_IP ? new WizController(process.env.WIZ_LIGHT_IP) : null;
let bulbState = { state: false, dimming: 100, r: 255, g: 255, b: 255, temp: 2700 };

// Init Firebase
const firebaseManager = require('./firebaseManager');
firebaseManager.init();

// Init AI Manager
const aiManager = require('./aiManager');
const automationEngine = require('./automationEngine');
const timeManager = require('./TimeManager');
const lightModeEngine = require('./LightModeEngine');
const broadcastManager = require('./BroadcastManager');

// Init TimeManager
timeManager.init();

// In-memory store for device state
let deviceState = {
    online: false,
    lastHeartbeat: 0,
    ip: null, // Store ESP8266 IP
    temperature: 0,
    humidity: 0,
    lightLevel: 0,
    relayState: false
};

broadcastManager.onHeartbeatCallback = (data) => {
    deviceState.online = true;
    deviceState.lastHeartbeat = Date.now();
    deviceState.temperature = data.temperature;
    deviceState.humidity = data.humidity;
    deviceState.lightLevel = data.lightLevel;
};

// --- API ROUTES ---

// 1. ESP8266 Heartbeat Endpoint
app.post('/api/device/heartbeat', (req, res) => {
    const data = req.body;
    const clientIp = req.ip.replace(/^.*:/, ''); // Extract IPv4 from IPv6 mapped
    
    deviceState = {
        ...deviceState,
        online: true,
        ip: clientIp,
        lastHeartbeat: Date.now(),
        temperature: data.temperature,
        humidity: data.humidity,
        lightLevel: data.lightLevel
    };

    // Sync to Firestore
    firebaseManager.syncDeviceState(deviceState, bulbState);

    console.log(`[HEARTBEAT from ${clientIp}] Temp: ${data.temperature}°C, Hum: ${data.humidity}%, Light: ${data.lightLevel}`);
    
    // Evaluate Automations
    const handleOled = async (title, message) => {
        if (deviceState.online && deviceState.ip) {
            fetch(`http://${deviceState.ip}/api/command/oled`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, message })
            }).catch(()=>{});
        }
    };
    
    // Only evaluate LDR/device-based automations here since they rely on sensor data
    automationEngine.evaluate(deviceState, bulbState, bulb, null, 0, timeManager.getState(), lightModeEngine);

    res.json({ status: 'ok', received: true });
});

// 2. Dashboard - Get Device & Environment State
app.get('/api/environment', (req, res) => {
    if (Date.now() - deviceState.lastHeartbeat > 60000) deviceState.online = false;
    
    // Calculate remaining focus time
    let focusRemaining = 0;
    if (global.focusTarget && global.focusStartTime) {
        const elapsed = (Date.now() - global.focusStartTime) / 1000 / 60; // in minutes
        focusRemaining = Math.max(0, global.focusTarget - elapsed);
        if (focusRemaining === 0) {
            global.focusTarget = 0; // Completed
        }
    }
    
    const timeState = timeManager.getState();
    const lightMode = lightModeEngine.currentMode;
    
    res.json({ ...deviceState, focusRemaining, timeState, lightMode });
});

// 3. ESP8266 Commands (Forwarded to the board)
app.post('/api/device/relay', async (req, res) => {
    if (!deviceState.online || !deviceState.ip) return res.status(503).json({ error: "Device offline" });
    try {
        const response = await fetch(`http://${deviceState.ip}/api/command/relay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ state: req.body.state })
        });
        if (response.ok) {
            deviceState.relayState = req.body.state;
            firebaseManager.syncDeviceState(deviceState, bulbState);
            res.json({ status: 'ok' });
        } else {
            res.status(500).json({ error: "Device returned error" });
        }
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/device/oled', async (req, res) => {
    if (!deviceState.online || !deviceState.ip) return res.status(503).json({ error: "Device offline" });
    try {
        const title = req.body.title || "NOTIFICATION";
        const message = req.body.message || "";
        await fetch(`http://${deviceState.ip}/api/command/oled`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, message })
        });
        res.json({ status: 'ok' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// 4. WiZ Light APIs
app.get('/api/light', async (req, res) => {
    if (!bulb) return res.status(500).json({ error: "WiZ bulb not configured" });
    try {
        const response = await bulb.getState();
        if (response && response.result) bulbState = response.result;
        res.json(bulbState);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/light/on', async (req, res) => {
    if (bulb) await bulb.turnOn();
    bulbState.state = true;
    firebaseManager.syncDeviceState(deviceState, bulbState);
    res.json({ status: 'ok' });
});

app.post('/api/light/off', async (req, res) => {
    if (bulb) await bulb.turnOff();
    bulbState.state = false;
    firebaseManager.syncDeviceState(deviceState, bulbState);
    res.json({ status: 'ok' });
});

app.post('/api/light/brightness', async (req, res) => {
    if (bulb) await bulb.setBrightness(req.body.level);
    bulbState.dimming = req.body.level;
    firebaseManager.syncDeviceState(deviceState, bulbState);
    res.json({ status: 'ok' });
});

app.post('/api/light/color', async (req, res) => {
    const { r, g, b } = req.body;
    if (bulb) await bulb.setRGB(r, g, b);
    firebaseManager.syncDeviceState(deviceState, bulbState);
    res.json({ status: 'ok' });
});

app.post('/api/light/white', async (req, res) => {
    if (bulb) await bulb.setWhite(req.body.temp);
    firebaseManager.syncDeviceState(deviceState, bulbState);
    res.json({ status: 'ok' });
});

app.post('/api/light/preset', async (req, res) => {
    const { preset } = req.body;
    if (!bulb) return res.status(500).json({ error: "Bulb not configured" });
    
    if (preset === 'start_bedtime') {
        lightModeEngine.startProgressive('BEDTIME', 30, bulb);
    } else if (preset === 'start_wakeup') {
        lightModeEngine.startProgressive('WAKEUP', 30, bulb);
    } else {
        await lightModeEngine.transitionToMode(bulb, preset);
    }
    
    // Update local state and sync
    const state = await bulb.getState();
    if (state && state.result) bulbState = state.result;
    firebaseManager.syncDeviceState(deviceState, bulbState);
    
    res.json({ status: 'ok' });
});

// 5. Tasks and Memory APIs
app.get('/api/tasks', async (req, res) => {
    const tasks = await firebaseManager.getTasks();
    res.json(tasks);
});

app.post('/api/tasks', async (req, res) => {
    const taskId = await firebaseManager.addTask(req.body);
    if (taskId) res.json({ status: 'ok', id: taskId });
    else res.status(500).json({ error: "Failed to add task" });
});

app.post('/api/memory', async (req, res) => {
    const memId = await firebaseManager.addMemory(req.body.content);
    if (memId) res.json({ status: 'ok', id: memId });
    else res.status(500).json({ error: "Failed to add memory" });
});

// 6. AI Chat API
app.post('/api/chat', async (req, res) => {
    try {
        const userMessage = req.body.message;
        if (!userMessage) return res.status(400).json({ error: "Missing message" });

        // Helper functions for AI to call device commands directly
        const handleOled = async (title, message) => {
            broadcastManager.sendAiDisplayNotification(title, message, 5000);
        };

        // Pass to AI Manager
        const parsedResponse = await aiManager.processChat(
            userMessage, 
            deviceState, 
            bulbState,
            bulb, 
            handleOled,
            timeManager.getState(),
            lightModeEngine
        );

        res.json(parsedResponse);
    } catch (e) {
        console.error("AI Chat Error:", e);
        res.status(500).json({ error: e.message });
    }
});

// Background Tasks

// 1. Fast Real-Time Loop (1 second) for timers and progressive transitions
setInterval(() => {
    // Calculate remaining focus time
    let focusRemaining = 0;
    if (global.focusTarget && global.focusStartTime) {
        const elapsed = (Date.now() - global.focusStartTime) / 1000 / 60;
        focusRemaining = Math.max(0, global.focusTarget - elapsed);
        if (focusRemaining === 0) {
            global.focusTarget = 0;
            broadcastManager.sendAiDisplayNotification("FOCUS COMPLETE", "WELL DONE!", 5000);
        } else {
            // Broadcast focus update
            let minutes = Math.floor(focusRemaining);
            let seconds = Math.floor((focusRemaining % 1) * 60).toString().padStart(2, '0');
            broadcastManager.sendTimerUpdate("FOCUS", `${minutes}:${seconds}`);
        }
    }
    
    // Evaluate Time Phase
    const timeState = timeManager.getState();
    if (timeState.phaseChanged) {
        console.log(`[TIME] Phase changed from ${timeState.previousPhase} to ${timeState.phase}`);
        // Handle Auto-Progressive triggers based on phase
        if (timeState.phase === 'WAKE_UP' && timeManager.preferences.wakeUpLighting) {
            lightModeEngine.startProgressive('WAKEUP', timeManager.preferences.wakeUpDuration, bulb);
            broadcastManager.sendProgressiveUpdate("WAKE-UP", "STARTS...");
        } else if (timeState.phase === 'BEDTIME' && timeManager.preferences.bedtimeLighting) {
            lightModeEngine.startProgressive('BEDTIME', timeManager.preferences.bedtimeDuration, bulb);
            broadcastManager.sendProgressiveUpdate("BEDTIME", "DIMMING...");
        } else {
            broadcastManager.sendAiDisplayNotification(timeState.phase.replace('_', ' '), "MODE ACTIVE", 3000);
        }
    }

    // Evaluate Progressive Dimmer
    lightModeEngine.evaluateProgressive(bulb, (title, status) => {
        broadcastManager.sendProgressiveUpdate(title, status);
    });

    // Broadcast Light Mode for Environment Display
    broadcastManager.sendEnvironmentUpdate(lightModeEngine.currentMode || "MANUAL");

}, 1000);

// 2. Slow Loop (30 seconds) for Reminders
setInterval(async () => {
    // 1. Check reminders
    const reminders = await firebaseManager.getReminders();
    const now = Date.now();
    for (const r of reminders) {
        if (now >= r.triggerTime && !r.triggered) {
            console.log(`[REMINDER] Triggering reminder: ${r.message}`);
            await firebaseManager.markReminderTriggered(r.id);
            
            // Show on OLED via WebSocket instead of HTTP fallback
            broadcastManager.sendAiDisplayReminder("REMINDER", r.message, 10000);
            // Flash bulb Red for Attention
            if (bulb) {
                bulb.turnOn();
                bulb.setRGB(255, 0, 0);
            }
        }
    }
}, 30000);

// Start the server
const server = app.listen(PORT, () => {
    console.log(`\n=========================================`);
    console.log(`🚀 Personal AI Backend running on port ${PORT}`);
    console.log(`=========================================\n`);
});

// Init WebSocket Server
broadcastManager.init(server);
