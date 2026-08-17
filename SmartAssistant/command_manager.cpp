#include "command_manager.h"
#include <ArduinoJson.h>

CommandManager::CommandManager(OledManager& o) 
    : server(80), oled(o) {}

void CommandManager::begin() {
    server.on("/", HTTP_GET, [this]() { handleRoot(); });
    server.on("/api/command/oled", HTTP_POST, [this]() { handleOled(); });
    
    server.begin();
    Serial.println("HTTP Server started on port 80");
}

void CommandManager::update() {
    server.handleClient();
}

void CommandManager::handleRoot() {
    server.send(200, "text/plain", "Desk Assistant API");
}

void CommandManager::handleOled() {
    if (server.hasArg("plain") == false) {
        server.send(400, "text/plain", "Body not received");
        return;
    }
    String body = server.arg("plain");
    
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, body);
    
    if (error) {
        server.send(400, "text/plain", "Invalid JSON");
        return;
    }

    if (doc.containsKey("message")) {
        String msg = doc["message"].as<String>();
        String title = "NOTIFICATION";
        if (doc.containsKey("title")) {
            title = doc["title"].as<String>();
        }
        
        oled.setNotification(title, msg);
        
        server.send(200, "application/json", "{\"status\":\"ok\"}");
    } else {
        server.send(400, "text/plain", "Missing message parameter");
    }
}
