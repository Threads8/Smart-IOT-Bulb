#include "oled_manager.h"
#include <Wire.h>

OledManager::OledManager() : display(OLED_WIDTH, OLED_HEIGHT, &Wire, -1) {
    currentState = OLED_BOOT;
    baseState = OLED_ENVIRONMENT;
    stateSetTime = 0;
    stateDuration = 0;
    lastAnimationUpdate = 0;
    animationFrame = 0;
    isAvailable = false;
    _temp = 0; _hum = 0; _light = 0; _lightMode = "MANUAL";
}

bool OledManager::begin() {
    if (!display.begin(SSD1306_SWITCHCAPVCC, OLED_I2C_ADDRESS)) {
        Serial.println("OLED INIT FAILED");
        isAvailable = false;
        return false;
    }
    
    isAvailable = true;
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    
    setState(OLED_BOOT);
    return true;
}

void OledManager::clear() {
    if (!isAvailable) return;
    display.clearDisplay();
    display.setCursor(0,0);
}

void OledManager::setState(OLEDState newState, unsigned long durationMs) {
    bool isSystemStateTransition = (currentState >= 90 && newState >= 90);
    bool isAiStateTransition = (currentState >= 70 && currentState <= 80 && newState >= 70 && newState <= 80);
    // If it's a transient higher priority state, or we are clearing down, or swapping system/AI states
    if (newState >= currentState || newState == baseState || isSystemStateTransition || isAiStateTransition) {
        currentState = newState;
        stateSetTime = millis();
        stateDuration = durationMs;
        animationFrame = 0;
        forceRender();
    }
}

void OledManager::clearState(OLEDState state) {
    if (currentState == state) {
        currentState = baseState;
        forceRender();
    }
}

void OledManager::clearTransientStates() {
    currentState = baseState;
    forceRender();
}

void OledManager::setEnvironment(float temp, float hum, int light, String lightMode) {
    _temp = temp; _hum = hum; _light = light; _lightMode = lightMode;
    if (currentState <= OLED_ENVIRONMENT) {
        setState(OLED_ENVIRONMENT);
    }
}

void OledManager::setNotification(String title, String message) {
    _notifTitle = title;
    _notifMessage = message;
    setState(OLED_NOTIFICATION, 5000);
}

void OledManager::setAiResponse(String text) {
    _aiResponse = text;
    setState(OLED_AI_RESPONSE, 8000);
}

void OledManager::setAiAction(String action1, String action2) {
    _action1 = action1; _action2 = action2;
    setState(OLED_AI_ACTION, 4000);
}

void OledManager::setTimer(String title, String remainingStr) {
    _timerTitle = title; _timerRemaining = remainingStr;
    setState(OLED_FOCUS); // Keep alive as long as we get updates
}

void OledManager::setProgressive(String title, String status) {
    _progTitle = title; _progStatus = status;
    setState(OLED_BEDTIME);
}

void OledManager::update() {
    if (!isAvailable) return;
    
    unsigned long now = millis();
    
    // Check timeouts
    if (stateDuration > 0 && (now - stateSetTime >= stateDuration)) {
        currentState = baseState;
        stateDuration = 0;
        forceRender();
        return;
    }
    
    // Animations
    if (currentState == OLED_AI_THINKING || currentState == OLED_LISTENING || currentState == OLED_AI_EXECUTING) {
        if (now - lastAnimationUpdate > 500) {
            lastAnimationUpdate = now;
            animationFrame = (animationFrame + 1) % 4;
            forceRender();
        }
    }
}

void OledManager::forceRender() {
    renderCurrentScreen();
}

void OledManager::renderTextWrapped(String text) {
    // Basic wrap for OLED size
    display.println(text);
}

void OledManager::renderCurrentScreen() {
    if (!isAvailable) return;
    clear();
    
    String dots = "";
    for(int i=0; i<animationFrame; i++) dots += ".";
    
    switch(currentState) {
        case OLED_BOOT:
            display.println("AI ASSISTANT"); display.println("\nBOOTING...");
            break;
        case OLED_CONNECTING:
            display.println("AI ASSISTANT"); display.println("\nCONNECTING...");
            break;
        case OLED_ONLINE:
            display.println("AI ASSISTANT"); display.println("\nONLINE O_O");
            break;
        case OLED_OFFLINE:
            display.println("BACKEND"); display.println("\nOFFLINE");
            break;
        case OLED_ERROR:
            display.println("ERROR");
            break;
            
        case OLED_LISTENING:
            display.println("LISTENING");
            display.println("\n" + dots);
            break;
        case OLED_AI_THINKING:
            display.println("AI");
            display.println("\nTHINKING" + dots);
            break;
        case OLED_AI_EXECUTING:
            display.println("EXECUTING");
            display.println("\n" + dots);
            break;
            
        case OLED_AI_ACTION:
            display.println("AI ACTION");
            display.println();
            display.println(_action1);
            if (_action2.length() > 0) display.println(_action2);
            break;
            
        case OLED_AI_RESPONSE:
            display.println("AI");
            display.println();
            renderTextWrapped(_aiResponse);
            break;
            
        case OLED_NOTIFICATION:
        case OLED_REMINDER:
            display.println(_notifTitle);
            display.println();
            renderTextWrapped(_notifMessage);
            break;
            
        case OLED_FOCUS:
            display.println(_timerTitle);
            display.println();
            display.setTextSize(2);
            display.println(_timerRemaining);
            display.setTextSize(1);
            break;
            
        case OLED_BEDTIME:
        case OLED_WAKEUP:
            display.println(_progTitle);
            display.println();
            display.println(_progStatus);
            break;
            
        case OLED_ENVIRONMENT:
        case OLED_IDLE:
        default:
            display.println("ROOM");
            display.println();
            display.print(_temp, 1); display.println(" C");
            display.print(_hum, 0); display.println(" %");
            display.println(_lightMode);
            break;
    }
    
    display.display();
}
