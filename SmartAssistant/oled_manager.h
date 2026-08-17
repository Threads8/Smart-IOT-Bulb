#ifndef OLED_MANAGER_H
#define OLED_MANAGER_H

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "hardware_config.h"

enum OLEDState {
    OLED_BOOT = 100,
    OLED_CONNECTING = 99,
    OLED_ERROR = 98,
    OLED_OFFLINE = 97,
    OLED_ONLINE = 96,
    
    OLED_LISTENING = 80,
    OLED_AI_THINKING = 79,
    OLED_AI_EXECUTING = 78,
    OLED_AI_ACTION = 77,
    
    OLED_REMINDER = 60,
    OLED_NOTIFICATION = 59,
    OLED_AI_RESPONSE = 58,
    
    OLED_FOCUS = 40,
    OLED_BEDTIME = 39,
    OLED_WAKEUP = 38,
    
    OLED_ENVIRONMENT = 20,
    OLED_IDLE = 0
};

class OledManager {
public:
    OledManager();
    bool begin();
    
    void clear();
    void update(); // call in loop for animations / timeouts
    void forceRender();

    // Priority Setters (Only renders if new priority >= current priority)
    // Pass duration=0 for infinite until cleared manually
    void setState(OLEDState newState, unsigned long durationMs = 0);
    
    void clearState(OLEDState state); // clears specific state, reverting to highest active
    void clearTransientStates(); // clears everything except base states

    // Data updaters
    void setEnvironment(float temp, float hum, int light, String lightMode);
    void setNotification(String title, String message);
    void setAiResponse(String text);
    void setAiAction(String action1, String action2);
    void setTimer(String title, String remainingStr);
    void setProgressive(String title, String status);

private:
    Adafruit_SSD1306 display;
    
    OLEDState currentState;
    unsigned long stateSetTime;
    unsigned long stateDuration;
    
    // Fallback states if current expires
    OLEDState baseState;
    
    // Animation state
    unsigned long lastAnimationUpdate;
    int animationFrame;
    
    // Stored data
    float _temp; float _hum; int _light; String _lightMode;
    String _notifTitle; String _notifMessage;
    String _aiResponse;
    String _action1; String _action2;
    String _timerTitle; String _timerRemaining;
    String _progTitle; String _progStatus;
    
    bool isAvailable;
    
    void renderCurrentScreen();
    void renderTextWrapped(String text);
};

#endif // OLED_MANAGER_H
