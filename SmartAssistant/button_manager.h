#ifndef BUTTON_MANAGER_H
#define BUTTON_MANAGER_H

#include <OneButton.h>
#include "hardware_config.h"

class ButtonManager {
public:
    ButtonManager();
    bool begin();
    void update(); // Call in loop

    // Callback setters
    void setShortPressCallback(callbackFunction cb);
    void setDoublePressCallback(callbackFunction cb);
    void setLongPressCallback(callbackFunction cb);

private:
    OneButton button;
};

#endif // BUTTON_MANAGER_H
