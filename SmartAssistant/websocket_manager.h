#ifndef WEBSOCKET_MANAGER_H
#define WEBSOCKET_MANAGER_H

#include <WebSocketsClient.h>
#include "oled_manager.h"

class WebSocketManager {
public:
    WebSocketManager(OledManager& oledRef);
    void begin(const char* host, uint16_t port);
    void update();
    void sendButtonEvent(int type); // 1=Single, 2=Double, 3=Long
    bool isConnected();

private:
    WebSocketsClient webSocket;
    OledManager& oled;
    bool connected;
    
    void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
    static void staticWebSocketEvent(WStype_t type, uint8_t * payload, size_t length);
    void handleJsonPayload(uint8_t * payload);
    
    // Static pointer for callback
    static WebSocketManager* instance;
};

#endif // WEBSOCKET_MANAGER_H
