#include "button_manager.h"

ButtonManager::ButtonManager() : button(BUTTON_PIN, BUTTON_ACTIVE_LOW, BUTTON_ACTIVE_LOW) {}

bool ButtonManager::begin() {
    // Basic test to ensure it doesn't crash, pin setup is handled by OneButton
    return true; // We can't strictly "test" a button non-interactively, so return true
}

void ButtonManager::update() {
    button.tick();
}

void ButtonManager::setShortPressCallback(callbackFunction cb) {
    button.attachClick(cb);
}

void ButtonManager::setDoublePressCallback(callbackFunction cb) {
    button.attachDoubleClick(cb);
}

void ButtonManager::setLongPressCallback(callbackFunction cb) {
    button.attachLongPressStart(cb);
}
