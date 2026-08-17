#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

/**
 * PERSONAL AI DESK ASSISTANT - HARDWARE CONFIGURATION
 * 
 * Please update these pin definitions to match your exact hardware wiring.
 * DO NOT guess these values. Refer to your ESP8266 board's pinout diagram.
 */

// ---------------------------------------------------------
// 1. ESP8266 Board Settings
// ---------------------------------------------------------
// Moonpreneur IoT Development Board mappings:
#define I2C_SDA_PIN D2 // G4
#define I2C_SCL_PIN D1 // G5

// ---------------------------------------------------------
// 2. OLED Display (I2C)
// ---------------------------------------------------------
#define OLED_I2C_ADDRESS 0x3C // Usually 0x3C or 0x3D
#define OLED_WIDTH 128
#define OLED_HEIGHT 64

// ---------------------------------------------------------
// 3. DHT22 Sensor
// ---------------------------------------------------------
#define DHT_PIN D6     // G12 on the board
#define DHT_TYPE DHT22 // Keep as DHT22

// ---------------------------------------------------------
// 4. LDR (Light Dependent Resistor)
// ---------------------------------------------------------
#define LDR_PIN A0     // Analog pin (ESP8266 only has one: A0)

// ---------------------------------------------------------
// 5. Push Button
// ---------------------------------------------------------
#define BUTTON_PIN D3  // G0 on the board
#define BUTTON_ACTIVE_LOW true // Set to true if button connects to GND

// ---------------------------------------------------------
// 6. Relay Module
// ---------------------------------------------------------
#define RELAY_PIN D0   // G16 on the board
#define RELAY_ACTIVE_HIGH true // Set to true if HIGH turns relay ON

#endif // HARDWARE_CONFIG_H
