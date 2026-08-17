#include "backend_manager.h"
#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include "secrets.h"

BackendManager::BackendManager() : lastHeartbeatTime(0) {}

void BackendManager::begin() {
    // Nothing special to init
}

void BackendManager::sendHeartbeat(float temp, float hum, int light) {
    if (millis() - lastHeartbeatTime >= 30000) {
        if (WiFi.status() == WL_CONNECTED) {
            lastHeartbeatTime = millis();
            WiFiClient client;
            HTTPClient http;
            
            String url = String("http://") + BACKEND_IP + ":" + BACKEND_PORT + "/api/device/heartbeat";
            
            http.begin(client, url);
            http.addHeader("Content-Type", "application/json");

            String payload = "{";
            payload += "\"deviceId\":\"desk-assistant\",";
            payload += "\"temperature\":" + String(temp) + ",";
            payload += "\"humidity\":" + String(hum) + ",";
            payload += "\"lightLevel\":" + String(light);
            payload += "}";

            int httpResponseCode = http.POST(payload);

            if (httpResponseCode > 0) {
                Serial.print("Heartbeat sent. Response code: ");
                Serial.println(httpResponseCode);
            } else {
                Serial.print("Error sending heartbeat: ");
                Serial.println(http.errorToString(httpResponseCode).c_str());
            }
            
            http.end();
        }
    }
}
