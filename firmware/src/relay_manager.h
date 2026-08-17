#ifndef RELAY_MANAGER_H
#define RELAY_MANAGER_H

#include <Arduino.h>
#include "hardware_config.h"

class RelayManager {
public:
    RelayManager();
    bool begin();
    
    void turnOn();
    void turnOff();
    void toggle();
    bool isOn();

private:
    bool currentState;
};

#endif // RELAY_MANAGER_H
