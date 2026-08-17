#include <Arduino.h>
#include "hardware_config.h"
#include "oled_manager.h"
#include "sensor_manager.h"
#include "button_manager.h"
#include "relay_manager.h"
#include "wifi_manager.h"

OledManager oled;
SensorManager sensors;
ButtonManager button;
RelayManager relay;
WifiManager wifi;

bool oledOk = false;
bool dhtOk = false;
bool btnOk = false;
bool relayOk = false;
bool wifiOk = false;

// We will use the LDR reading to verify it's working (should be > 0 and < 1024 usually)
bool ldrOk = false;

void onButtonShortPress() {
    Serial.println("Button short pressed! Toggling relay.");
    relay.toggle();
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    Serial.println("\n\n--- Personal AI Desk Assistant : Hardware Test ---");

    // 1. Init OLED
    oledOk = oled.begin();
    if (oledOk) {
        Serial.println("OLED: OK");
    } else {
        Serial.println("OLED: FAILED (Check I2C pins & address)");
    }

    // 2. Init Sensors
    dhtOk = sensors.begin();
    Serial.print("DHT22: "); Serial.println(dhtOk ? "OK" : "FAILED");

    // LDR initial check
    int ldrVal = sensors.getLightLevel();
    ldrOk = (ldrVal >= 0 && ldrVal <= 1024);
    Serial.print("LDR: "); Serial.println(ldrOk ? "OK" : "FAILED");

    // 3. Init Button
    btnOk = button.begin();
    button.setShortPressCallback(onButtonShortPress);
    Serial.print("BUTTON: "); Serial.println(btnOk ? "OK" : "FAILED");

    // 4. Init Relay
    relayOk = relay.begin();
    Serial.print("RELAY: "); Serial.println(relayOk ? "OK" : "FAILED");

    // 5. Init WiFi test
    wifiOk = wifi.begin();
    Serial.print("WIFI: "); Serial.println(wifiOk ? "OK" : "FAILED");

    // Display status on OLED
    if (oledOk) {
        oled.showHardwareTest(dhtOk, ldrOk, btnOk, relayOk, wifiOk);
    }
}

void loop() {
    sensors.update();
    button.update();
    wifi.update();
    
    // Periodically log sensor values to Serial for debugging
    static unsigned long lastLog = 0;
    if (millis() - lastLog > 5000) {
        lastLog = millis();
        Serial.print("Temp: "); Serial.print(sensors.getTemperature());
        Serial.print("C | Hum: "); Serial.print(sensors.getHumidity());
        Serial.print("% | Light: "); Serial.print(sensors.getLightLevel());
        Serial.print(" ("); Serial.print(sensors.getLightStatus()); Serial.println(")");
    }
}
