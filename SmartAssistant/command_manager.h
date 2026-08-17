#ifndef COMMAND_MANAGER_H
#define COMMAND_MANAGER_H

#include <ESP8266WebServer.h>
#include "oled_manager.h"

class CommandManager {
public:
    CommandManager(OledManager& o);
    void begin();
    void update(); // Must be called in loop

private:
    ESP8266WebServer server;
    OledManager& oled;

    void handleRoot();
    void handleRelay();
    void handleOled();
};

#endif // COMMAND_MANAGER_H
