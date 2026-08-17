#include "wifi_manager.h"

WifiManager::WifiManager() {}

bool WifiManager::begin() {
    WiFi.mode(WIFI_STA);
    WiFi.disconnect(); // Don't auto connect yet
    delay(100);
    // As a basic hardware test, check if the WiFi module responds (it should always return wl_status_t)
    return WiFi.status() == WL_IDLE_STATUS || WiFi.status() == WL_DISCONNECTED;
}

void WifiManager::update() {
    // Phase 1: nothing to update
}

bool WifiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}
