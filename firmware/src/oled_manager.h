#ifndef OLED_MANAGER_H
#define OLED_MANAGER_H

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "hardware_config.h"

class OledManager {
public:
    OledManager();
    bool begin();
    void showHardwareTest(bool dhtOk, bool ldrOk, bool btnOk, bool relayOk, bool wifiOk);
    void showConnecting();
    void clear();

private:
    Adafruit_SSD1306 display;
};

#endif // OLED_MANAGER_H
