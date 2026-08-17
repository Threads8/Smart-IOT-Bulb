#include "websocket_manager.h"
#include <ArduinoJson.h>

WebSocketManager* WebSocketManager::instance = nullptr;

WebSocketManager::WebSocketManager(OledManager& oledRef) : oled(oledRef), connected(false) {
    instance = this;
}

void WebSocketManager::begin(const char* host, uint16_t port) {
    webSocket.begin(host, port, "/");
    webSocket.onEvent(staticWebSocketEvent);
    webSocket.setReconnectInterval(5000);
}

void WebSocketManager::update() {
    webSocket.loop();
}

bool WebSocketManager::isConnected() {
    return connected;
}

void WebSocketManager::sendButtonEvent(int type) {
    if (!connected) return;
    
    StaticJsonDocument<200> doc;
    doc["type"] = "BUTTON_EVENT";
    doc["action"] = type == 1 ? "SINGLE" : (type == 2 ? "DOUBLE" : "LONG");
    
    String output;
    serializeJson(doc, output);
    webSocket.sendTXT(output);
}

void WebSocketManager::staticWebSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    if (instance) {
        instance->webSocketEvent(type, payload, length);
    }
}

void WebSocketManager::webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
    switch(type) {
        case WStype_DISCONNECTED:
            connected = false;
            oled.setState(OLED_OFFLINE);
            Serial.println("[WS] Disconnected!");
            break;
        case WStype_CONNECTED:
            connected = true;
            oled.setState(OLED_ONLINE, 2000);
            Serial.println("[WS] Connected to url!");
            break;
        case WStype_TEXT:
            handleJsonPayload(payload);
            break;
        case WStype_BIN:
        case WStype_ERROR:
        case WStype_FRAGMENT_TEXT_START:
        case WStype_FRAGMENT_BIN_START:
        case WStype_FRAGMENT:
        case WStype_FRAGMENT_FIN:
        case WStype_PING:
        case WStype_PONG:
            break;
    }
}

extern String globalLightMode;

void WebSocketManager::handleJsonPayload(uint8_t * payload) {
    StaticJsonDocument<512> doc;
    DeserializationError error = deserializeJson(doc, payload);

    if (error) {
        Serial.print(F("deserializeJson() failed: "));
        Serial.println(error.f_str());
        return;
    }

    String type = doc["type"] | "";
    String screen = doc["screen"] | "";
    unsigned long duration = doc["duration"] | 0;

    if (type == "AI_STATE") {
        if (screen == "LISTENING") oled.setState(OLED_LISTENING);
        else if (screen == "THINKING") oled.setState(OLED_AI_THINKING);
        else if (screen == "EXECUTING") oled.setState(OLED_AI_EXECUTING);
        else oled.clearTransientStates();
    }
    else if (type == "AI_DISPLAY") {
        if (screen == "ACTION") {
            oled.setAiAction(doc["action1"] | "", doc["action2"] | "");
        } else if (screen == "RESPONSE") {
            oled.setAiResponse(doc["message"] | "");
        } else if (screen == "REMINDER") {
            oled.setNotification(doc["title"] | "REMINDER", doc["message"] | "");
            oled.setState(OLED_REMINDER, duration > 0 ? duration : 5000);
            return;
        } else if (screen == "NOTIFICATION") {
            oled.setNotification(doc["title"] | "NOTICE", doc["message"] | "");
            oled.setState(OLED_NOTIFICATION, duration > 0 ? duration : 5000);
            return;
        }
    }
    else if (type == "TIMER_UPDATE") {
        oled.setTimer(doc["title"] | "TIMER", doc["remaining"] | "");
    }
    else if (type == "PROGRESSIVE_UPDATE") {
        oled.setProgressive(doc["title"] | "PROGRESSIVE", doc["status"] | "");
    }
    else if (type == "ENVIRONMENT_UPDATE") {
        globalLightMode = doc["lightMode"].as<String>();
    }
}
