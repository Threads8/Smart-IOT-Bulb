#include <Arduino.h>
#include <Wire.h>
#include "hardware_config.h"
#include "oled_manager.h"
#include "sensor_manager.h"
#include "button_manager.h"
#include "wifi_manager.h"
#include "backend_manager.h"
#include "command_manager.h"
#include "websocket_manager.h"
#include "secrets.h"

OledManager oled;
SensorManager sensors;
ButtonManager button;
WifiManager wifi;
BackendManager backend;
CommandManager cmd(oled);
WebSocketManager ws(oled);

String globalLightMode = "MANUAL";

bool oledOk = false;
bool dhtOk = false;
bool btnOk = false;
bool wifiOk = false;
bool ldrOk = false;

// Timing variables for screen updates
unsigned long lastScreenUpdate = 0;
const unsigned long SCREEN_UPDATE_INTERVAL = 1000; // 1 second

// For temporary OLED testing on boot
int testScreenState = 0;
bool testModeActive = true;
unsigned long lastTestUpdate = 0;

void onButtonShortPress() {
    ws.sendButtonEvent(1);
    oled.clearTransientStates();
}

void onButtonDoublePress() {
    ws.sendButtonEvent(2);
}

void onButtonLongPress() {
    ws.sendButtonEvent(3);
}

void scanI2C() {
    Serial.println("\nI2C Scanner");
    Serial.println("Scanning...");
    byte error, address;
    int nDevices = 0;
    
    for(address = 1; address < 127; address++ ) {
        Wire.beginTransmission(address);
        error = Wire.endTransmission();
        
        if (error == 0) {
            Serial.print("Found device at 0x");
            if (address < 16) Serial.print("0");
            Serial.println(address, HEX);
            nDevices++;
        }
        else if (error == 4) {
            Serial.print("Unknown error at address 0x");
            if (address < 16) Serial.print("0");
            Serial.println(address, HEX);
        }    
    }
    if (nDevices == 0) {
        Serial.println("No I2C devices found\n");
    } else {
        Serial.println("done\n");
    }
}

void setup() {
    Serial.begin(115200);
    delay(1000);
    
    // Initialize I2C first
    Wire.begin(I2C_SDA_PIN, I2C_SCL_PIN);
    
    Serial.println("\n\n========================");
    Serial.println("PERSONAL AI ASSISTANT");
    Serial.println("========================");
    Serial.println("ESP8266: OK\n");

    // 1. Scan I2C
    scanI2C();
    
    // 2. Init OLED
    oledOk = oled.begin();
    
    // 3. Init other hardware
    dhtOk = sensors.begin();
    int ldrVal = sensors.getLightLevel();
    ldrOk = (ldrVal >= 0 && ldrVal <= 1024);
    btnOk = button.begin();
    button.setShortPressCallback(onButtonShortPress);
    // button.setDoublePressCallback(onButtonDoublePress); // If button library supports it
    // button.setLongPressCallback(onButtonLongPress);

    Serial.print("DHT22: "); Serial.println(dhtOk ? "OK" : "ERR");
    Serial.print("LDR: "); Serial.println(ldrOk ? "OK" : "ERR");
    Serial.print("BUTTON: "); Serial.println(btnOk ? "OK" : "ERR");
    
    if (oledOk) {
        // Run test mode sequence
        // Test mode removed, skipping straight to connect
    }
    
    testModeActive = false;
    
    // 4. Connect WiFi
    Serial.println("\nWiFi: CONNECTING...");
    if (oledOk) oled.setState(OLED_CONNECTING);
    
    wifiOk = wifi.begin();
    
    if (wifiOk) {
        Serial.println("WiFi: ONLINE");
        Serial.print("IP: "); Serial.println(wifi.getIPAddress());
        
        // Connect WebSocket
        ws.begin(BACKEND_IP, BACKEND_PORT); 
    } else {
        if (oledOk) oled.setState(OLED_OFFLINE);
    }

    // 5. Init Managers
    backend.begin();
    cmd.begin();
    
    Serial.println("Backend HTTP: ONLINE");
    Serial.println("SYSTEM READY");
}

void loop() {
    sensors.update();
    button.update();
    wifi.update();
    
    // Process backend and HTTP
    if (wifi.isConnected()) {
        cmd.update(); 
        ws.update();
        backend.sendHeartbeat(
            sensors.getTemperature(),
            sensors.getHumidity(),
            sensors.getLightLevel()
        );
    }
    
    // OLED Render Loop
    if (oledOk && !testModeActive) {
        oled.update();
        
        unsigned long currentMillis = millis();
        if (currentMillis - lastScreenUpdate >= SCREEN_UPDATE_INTERVAL) {
            lastScreenUpdate = currentMillis;
            
            // Push background environment state to OLED
            // If the current priority is higher, it will ignore this and continue rendering the higher priority
            oled.setEnvironment(
                sensors.getTemperature(), 
                sensors.getHumidity(), 
                sensors.getLightLevel(),
                globalLightMode
            );
        }
    }
}
