const OpenAI = require('openai');
const firebaseManager = require('./firebaseManager');

class AIManager {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.AI_API_KEY,
            baseURL: process.env.AI_BASE_URL || 'https://integrate.api.nvidia.com/v1',
            timeout: 30000,
            maxRetries: 1,
        });
        this.model = process.env.AI_MODEL || 'z-ai/glm-5.2';
        
        this.tools = [
            { type: "function", function: { name: "get_environment", description: "Get the current room environment (temperature, humidity, ambient light, time, phase)." } },
            { type: "function", function: { name: "get_device_status", description: "Check if ESP8266 is online." } },
            { type: "function", function: { name: "get_light_status", description: "Get current state of the WiZ smart light." } },
            { type: "function", function: { name: "turn_light_on", description: "Turn the WiZ smart light on." } },
            { type: "function", function: { name: "turn_light_off", description: "Turn the WiZ smart light off." } },
            { type: "function", function: { name: "set_light_brightness", description: "Set light brightness", parameters: { type: "object", properties: { level: { type: "number", description: "10 to 100" } }, required: ["level"] } } },
            { type: "function", function: { name: "set_light_color", description: "Set light color", parameters: { type: "object", properties: { r: { type: "number" }, g: { type: "number" }, b: { type: "number" } }, required: ["r", "g", "b"] } } },
            { type: "function", function: { name: "set_light_temperature", description: "Set light warm/cool white temp", parameters: { type: "object", properties: { kelvin: { type: "number", description: "2200 to 6500" } }, required: ["kelvin"] } } },
            { type: "function", function: { name: "set_light_scene", description: "Set a specific light mode/scene", parameters: { type: "object", properties: { preset: { type: "string", enum: ["night_light", "cozy", "true_colors", "relax", "focus", "tv_time", "plant_growth", "ATTENTION"] } }, required: ["preset"] } } },
            { type: "function", function: { name: "start_bedtime", description: "Start the progressive bedtime lighting routine." } },
            { type: "function", function: { name: "start_wakeup", description: "Start the progressive wake-up lighting routine." } },
            { type: "function", function: { name: "set_bedtime", description: "Set the bedtime configuration.", parameters: { type: "object", properties: { timeStr: { type: "string", description: "HH:MM format" } }, required: ["timeStr"] } } },
            { type: "function", function: { name: "set_wakeup_time", description: "Set the wakeup configuration.", parameters: { type: "object", properties: { timeStr: { type: "string", description: "HH:MM format" } }, required: ["timeStr"] } } },
            { type: "function", function: { name: "show_on_oled", description: "Display a specific message on the physical OLED screen.", parameters: { type: "object", properties: { screen: { type: "string", enum: ["notification", "reminder", "error"] }, title: { type: "string" }, message: { type: "string" }, duration: { type: "number", description: "Duration in ms" } }, required: ["screen", "title", "message"] } } },
            { type: "function", function: { name: "create_task", description: "Add a task to the todo list.", parameters: { type: "object", properties: { title: { type: "string" } }, required: ["title"] } } },
            { type: "function", function: { name: "complete_task", description: "Mark a task as completed.", parameters: { type: "object", properties: { search_title: { type: "string" } }, required: ["search_title"] } } },
            { type: "function", function: { name: "create_reminder", description: "Create a reminder.", parameters: { type: "object", properties: { message: { type: "string" }, timestamp: { type: "number", description: "Unix timestamp in ms" } }, required: ["message", "timestamp"] } } },
            { type: "function", function: { name: "save_note", description: "Save a generic note to memory.", parameters: { type: "object", properties: { content: { type: "string" } }, required: ["content"] } } },
            { type: "function", function: { name: "save_idea", description: "Save a project idea to memory.", parameters: { type: "object", properties: { content: { type: "string" } }, required: ["content"] } } },
            { type: "function", function: { name: "search_memory", description: "Search saved notes and ideas.", parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] } } },
            { type: "function", function: { name: "start_focus", description: "Start a focus timer.", parameters: { type: "object", properties: { minutes: { type: "number" } }, required: ["minutes"] } } },
            { type: "function", function: { name: "stop_focus", description: "Stop the current focus timer." } },
            { type: "function", function: { name: "get_daily_summary", description: "Get a briefing of tasks, reminders, and environment." } }
        ];
    }

    buildContextObject(deviceState, bulbState, timeState, lightEngine) {
        return {
            time: timeState.currentTime,
            phase: timeState.phase,
            bedtime: timeState.bedtime,
            wakeUp: timeState.wakeUp,
            isDay: timeState.isDay,
            isNight: timeState.isNight,
            device: {
                online: deviceState.online,
                ip: deviceState.ip
            },
            environment: {
                temperature: deviceState.temperature,
                humidity: deviceState.humidity,
                light: deviceState.lightLevel < 300 ? "DARK" : (deviceState.lightLevel > 800 ? "BRIGHT" : "NORMAL")
            },
            light: {
                state: bulbState.state ? "ON" : "OFF",
                brightness: bulbState.dimming || 100,
                mode: lightEngine.currentMode || 'manual',
                progressive: lightEngine.progressiveState ? lightEngine.progressiveState.type : null
            }
        };
    }

    async processChat(userMessage, deviceState, bulbState, bulb, handleOled, timeState, lightEngine) {
        const broadcastManager = require('./BroadcastManager');
        
        // Immediately notify the OLED that we are starting processing
        broadcastManager.sendAiState('LISTENING');
        if (handleOled) await handleOled("LISTENING...", "MIC ON");

        const contextObj = this.buildContextObject(deviceState, bulbState, timeState, lightEngine);
        
        // Tell OLED we are thinking
        broadcastManager.sendAiState('THINKING');
        if (handleOled) await handleOled("AI ASSISTANT", "THINKING...");

        let messages = [
            {
                role: "system",
                content: `You are the brain of a Personal AI Desk Assistant. 
                Current context: ${JSON.stringify(contextObj)}
                Be concise and highly capable. 
                If asked to do something, you MUST use your provided tools to execute the action FIRST. Do NOT pretend to perform actions.
                
                CRITICAL INSTRUCTION: Your final response message to the user MUST be valid JSON matching this exact schema:
                {
                  "reply": "Your verbal response to the user. Keep it concise."
                }
                Do NOT output markdown code blocks. Output ONLY valid raw JSON.`
            },
            { role: "user", content: userMessage }
        ];

        let response = await this.openai.chat.completions.create({
            model: this.model,
            messages: messages,
            tools: this.tools,
            tool_choice: "auto",
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 1024,
        });
        let responseMessage = response.choices[0].message;
        let performedActions = [];

        // Handle tool calls
        let iter = 0;
        while (responseMessage.tool_calls && responseMessage.tool_calls.length > 0 && iter < 5) {
            iter++;
            messages.push(responseMessage);
            
            // Tool execution phase
            broadcastManager.sendAiState('EXECUTING');
            if (handleOled) await handleOled("AI ASSISTANT", "EXECUTING...");

            for (const toolCall of responseMessage.tool_calls) {
                console.log("TOOL CALL DETECTED:", toolCall.function.name, toolCall.function.arguments);
                let args = {};
                if (toolCall.function.arguments) {
                    try {
                        args = JSON.parse(toolCall.function.arguments);
                    } catch(e) {}
                }
                
                broadcastManager.sendAiDisplayAction(toolCall.function.name.toUpperCase().replace(/_/g, ' '));
                
                let toolResult = "";
                let status = "success";

                try {
                    const fn = toolCall.function.name;
                    
                    if (fn === 'get_environment') {
                        toolResult = JSON.stringify(contextObj.environment);
                    } 
                    else if (fn === 'get_device_status') {
                        toolResult = JSON.stringify(contextObj.device);
                    }
                    else if (fn === 'get_light_status') {
                        toolResult = JSON.stringify(contextObj.light);
                    }
                    else if (fn === 'turn_light_on') {
                        if (bulb) await bulb.turnOn();
                        toolResult = "Light on";
                    }
                    else if (fn === 'turn_light_off') {
                        if (bulb) await bulb.turnOff();
                        toolResult = "Light off";
                    }
                    else if (fn === 'set_light_brightness') {
                        if (bulb) await bulb.setBrightness(args.level);
                        toolResult = "Brightness set";
                    }
                    else if (fn === 'set_light_color') {
                        if (bulb) await bulb.setRGB(args.r, args.g, args.b);
                        toolResult = "Color set";
                    }
                    else if (fn === 'set_light_temperature') {
                        if (bulb) await bulb.setWhite(args.kelvin);
                        toolResult = "Temp set";
                    }
                    else if (fn === 'set_light_scene') {
                        if (!bulb) throw new Error("Bulb missing");
                        if (args.preset === 'ATTENTION') { await bulb.turnOn(); await bulb.setRGB(255, 0, 0); }
                        else if (lightEngine) {
                            await lightEngine.transitionToMode(bulb, args.preset);
                        }
                        toolResult = "Scene applied";
                    }
                    else if (fn === 'start_bedtime') {
                        if (lightEngine) {
                            lightEngine.startProgressive('BEDTIME', 30, bulb);
                            broadcastManager.sendProgressiveUpdate("BEDTIME", "DIMMING");
                            if (handleOled) await handleOled("BEDTIME", "DIMMING...");
                        }
                        toolResult = "Bedtime routine started";
                    }
                    else if (fn === 'start_wakeup') {
                        if (lightEngine) {
                            lightEngine.startProgressive('WAKEUP', 30, bulb);
                            broadcastManager.sendProgressiveUpdate("WAKEUP", "STARTING");
                            if (handleOled) await handleOled("WAKEUP", "BRIGHTENING...");
                        }
                        toolResult = "Wakeup routine started";
                    }
                    else if (fn === 'set_bedtime') {
                        const TimeManager = require('./TimeManager');
                        await TimeManager.updatePreferences({ bedtime: args.timeStr });
                        toolResult = "Bedtime updated";
                    }
                    else if (fn === 'set_wakeup_time') {
                        const TimeManager = require('./TimeManager');
                        await TimeManager.updatePreferences({ wakeUpTime: args.timeStr });
                        toolResult = "Wakeup updated";
                    }
                    else if (fn === 'create_task') {
                        await firebaseManager.addTask({ title: args.title });
                        toolResult = "Task created";
                    }
                    else if (fn === 'complete_task') {
                        await firebaseManager.completeTaskByTitle(args.search_title);
                        toolResult = "Task completed";
                    }
                    else if (fn === 'create_reminder') {
                        await firebaseManager.addReminder(args.message, args.timestamp);
                        toolResult = "Reminder created";
                    }
                    else if (fn === 'save_note' || fn === 'save_idea') {
                        await firebaseManager.addMemory(`[${fn.toUpperCase()}] ${args.content}`);
                        toolResult = "Saved";
                    }
                    else if (fn === 'search_memory') {
                        const results = await firebaseManager.searchMemory(args.query);
                        toolResult = JSON.stringify(results);
                    }
                    else if (fn === 'start_focus') {
                        global.focusTarget = args.minutes;
                        global.focusStartTime = Date.now();
                        toolResult = "Focus started";
                    }
                    else if (fn === 'stop_focus') {
                        global.focusTarget = 0;
                        toolResult = "Focus stopped";
                    }
                    else if (fn === 'get_daily_summary') {
                        const tasks = await firebaseManager.getTasks();
                        const rems = await firebaseManager.getReminders();
                        toolResult = JSON.stringify({ tasks, reminders: rems, environment: contextObj.environment });
                    }
                    else if (fn === 'show_on_oled') {
                        if (args.screen === 'reminder') {
                            broadcastManager.sendAiDisplayReminder(args.title, args.message, args.duration || 5000);
                        } else {
                            broadcastManager.sendAiDisplayNotification(args.title, args.message, args.duration || 5000);
                        }
                        toolResult = "Displayed on OLED";
                    }
                    else {
                        throw new Error("Unknown tool");
                    }
                } catch (e) {
                    toolResult = `Error: ${e.message}`;
                    status = "failure";
                }

                performedActions.push({ tool: toolCall.function.name, status });

                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: toolCall.function.name,
                    content: toolResult,
                });
            }

            // Get next response from AI
            response = await this.openai.chat.completions.create({
                model: this.model,
                messages: messages,
                tools: this.tools,
                temperature: 0.7,
                top_p: 0.9,
                max_tokens: 1024,
            });
            responseMessage = response.choices[0].message;
        }

        // We expect a final JSON response
        let finalOutput = responseMessage.content || "{}";
        
        // Strip markdown if it generated it anyway
        if (finalOutput.startsWith("```")) {
            const lines = finalOutput.split("\\n");
            if (lines.length > 2) {
                finalOutput = lines.slice(1, -1).join("\\n");
            }
        }
        
        let parsed = null;
        try {
            parsed = JSON.parse(finalOutput);
        } catch (e) {
            // Fallback if not valid JSON
            parsed = {
                reply: finalOutput,
                actions: performedActions,
                oled: { enabled: false }
            };
        }
        
        // Ensure actions are tracked if AI forgot
        if (!parsed.actions) parsed.actions = performedActions;
        
        // Push final response to OLED
        if (parsed.reply && parsed.reply.length > 0) {
            broadcastManager.sendAiDisplayResponse(parsed.reply);
        } else {
            broadcastManager.sendAiState('IDLE');
        }

        return parsed;
    }
}

module.exports = new AIManager();
