#include "sensor_manager.h"

SensorManager::SensorManager() : dht(DHT_PIN, DHT_TYPE), currentTemp(0), currentHum(0), currentLight(0), lastReadTime(0) {}

bool SensorManager::begin() {
    dht.begin();
    pinMode(LDR_PIN, INPUT);
    
    // Initial read
    currentTemp = dht.readTemperature();
    currentHum = dht.readHumidity();
    currentLight = analogRead(LDR_PIN);
    
    // DHT returns NaN if disconnected or failing
    if (isnan(currentTemp) || isnan(currentHum)) {
        return false;
    }
    return true;
}

void SensorManager::update() {
    unsigned long now = millis();
    // Read every 2 seconds (DHT22 max frequency)
    if (now - lastReadTime >= 2000) {
        lastReadTime = now;
        
        float t = dht.readTemperature();
        float h = dht.readHumidity();
        if (!isnan(t) && !isnan(h)) {
            currentTemp = t;
            currentHum = h;
        }
        
        currentLight = analogRead(LDR_PIN);
    }
}

float SensorManager::getTemperature() {
    return currentTemp;
}

float SensorManager::getHumidity() {
    return currentHum;
}

int SensorManager::getLightLevel() {
    return currentLight;
}

String SensorManager::getLightStatus() {
    // Basic threshold logic - these will need calibration per environment
    // ADC returns 0-1023
    if (currentLight > 800) return "BRIGHT";
    if (currentLight > 400) return "NORMAL";
    if (currentLight > 100) return "LOW_LIGHT";
    return "DARK";
}
