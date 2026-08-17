#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <DHT.h>
#include "hardware_config.h"

class SensorManager {
public:
    SensorManager();
    bool begin();
    
    void update(); // Non-blocking read
    
    float getTemperature();
    float getHumidity();
    int getLightLevel(); // Raw ADC value
    String getLightStatus();

private:
    DHT dht;
    float currentTemp;
    float currentHum;
    int currentLight;
    unsigned long lastReadTime;
};

#endif // SENSOR_MANAGER_H
