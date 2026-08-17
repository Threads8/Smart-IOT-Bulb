#include "relay_manager.h"

RelayManager::RelayManager() : currentState(false) {}

bool RelayManager::begin() {
    pinMode(RELAY_PIN, OUTPUT);
    turnOff(); // Default to OFF
    return true; // Simple GPIO, no real failure check possible
}

void RelayManager::turnOn() {
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_HIGH ? HIGH : LOW);
    currentState = true;
}

void RelayManager::turnOff() {
    digitalWrite(RELAY_PIN, RELAY_ACTIVE_HIGH ? LOW : HIGH);
    currentState = false;
}

void RelayManager::toggle() {
    if (currentState) {
        turnOff();
    } else {
        turnOn();
    }
}

bool RelayManager::isOn() {
    return currentState;
}
