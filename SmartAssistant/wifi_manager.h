#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <ESP8266WiFi.h>

class WifiManager {
public:
    WifiManager();
    bool begin(); 
    void update();
    bool isConnected();
    String getIPAddress();

private:
    unsigned long lastReconnectAttempt;
};

#endif // WIFI_MANAGER_H
