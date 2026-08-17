#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <ESP8266WiFi.h>

class WifiManager {
public:
    WifiManager();
    bool begin(); // For Phase 1, just initialize the module, won't connect
    void update();
    bool isConnected();

private:
    // we'll add SSID/PASS management in later phases
};

#endif // WIFI_MANAGER_H
