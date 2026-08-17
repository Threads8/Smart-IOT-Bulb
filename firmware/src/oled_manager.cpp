#include "oled_manager.h"
#include <Wire.h>

OledManager::OledManager() : display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1) {}

bool OledManager::begin() {
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDRESS)) {
        return false;
    }
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(0, 0);
    display.println("BOOTING...");
    display.display();
    return true;
}

void OledManager::clear() {
    display.clearDisplay();
    display.setCursor(0,0);
}

void OledManager::showHardwareTest(bool dhtOk, bool ldrOk, bool btnOk, bool relayOk, bool wifiOk) {
    clear();
    display.println("HARDWARE TEST");
    display.println("-------------");
    
    display.print("DHT22: "); display.println(dhtOk ? "OK" : "ERR");
    display.print("LDR  : "); display.println(ldrOk ? "OK" : "ERR");
    display.print("BTN  : "); display.println(btnOk ? "OK" : "ERR");
    display.print("RELAY: "); display.println(relayOk ? "OK" : "ERR");
    display.print("WIFI : "); display.println(wifiOk ? "OK" : "ERR");
    
    display.display();
}

void OledManager::showConnecting() {
    clear();
    display.println("CONNECTING...");
    display.display();
}
