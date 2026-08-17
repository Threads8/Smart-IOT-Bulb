#ifndef BACKEND_MANAGER_H
#define BACKEND_MANAGER_H

#include <Arduino.h>

class BackendManager {
public:
    BackendManager();
    void begin();
    
    // Sends temperature, humidity, lightLevel, relayState to the Node.js backend
    void sendHeartbeat(float temperature, float humidity, int lightLevel);

private:
    unsigned long lastHeartbeatTime;
};

#endif // BACKEND_MANAGER_H
