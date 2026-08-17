# 🏠 Smart Room IoT Ecosystem

A complete, AI-powered Smart Room ecosystem that integrates environmental sensing, intelligent lighting, and natural language assistance. The project spans custom ESP hardware, a Node.js backend, and a responsive React dashboard.

## 🌟 Project Overview

This system transforms a standard room into an intelligent environment that adapts to your routines, monitors environmental conditions, and allows seamless control through an intuitive mobile interface or an AI chat assistant. 

The repository is divided into four main components:

### 1. 📱 Mobile App (`/mobile`)
A sleek, responsive frontend dashboard built with React and Vite.
- **Environment Widget:** Real-time temperature, humidity, and ambient light monitoring.
- **Lighting Control:** Full control over WiZ smart bulbs (brightness, color temperature, RGB colors, and presets).
- **Time & Focus:** Time-based lighting modes (Wakeup, Bedtime, Focus mode).
- **AI Chat Widget:** Natural language interface to command the room (e.g., "Dim the lights and set them to blue").

### 2. ⚙️ Backend Server (`/backend`)
The central nervous system of the project, built with Node.js and Express.
- **Device & State Management:** Tracks ESP hardware heartbeats and synchronizes state to Firebase Firestore.
- **Automation & Scheduling:** Runs continuous loops for time-based triggers, reminders, and progressive lighting transitions.
- **AI Integration:** Processes natural language commands, translates them into actionable hardware/lighting instructions, and sends OLED notifications to the hardware.
- **WebSocket Broadcasting:** Pushes real-time updates to the mobile app for zero-latency interactions.

### 3. 🔌 Hardware Firmware (`/firmware`)
C++ firmware built for ESP microcontrollers (using PlatformIO).
- **Sensors:** Reads temperature, humidity, and ambient light (LDR) data and sends heartbeats to the backend.
- **Actuators:** Controls physical relays for appliances and drives an OLED display for notifications and AI responses.
- **Physical Controls:** Manages button inputs for manual overrides.

### 4. 🤖 Smart Assistant (`/SmartAssistant`)
An auxiliary hardware module dedicated to specialized interactions, featuring WebSocket communication, command parsing, and physical sensor/button management.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PlatformIO (for compiling the C++ firmware)
- Firebase Account (for Firestore sync)
- WiZ Smart Bulb (optional, but recommended for lighting control)

### Local Setup

#### Backend
1. Navigate to `/backend`.
2. Run `npm install`.
3. Create a `.env` file containing your Firebase credentials, AI API keys, and WiZ bulb IP.
4. Place your Firebase Admin SDK `firebase-key.json` in the backend directory.
5. Run `npm start` to launch the server.

#### Mobile Frontend
1. Navigate to `/mobile`.
2. Run `npm install`.
3. Run `npm run dev` to start the Vite development server.

#### Hardware
1. Open the `/firmware` folder in an IDE supporting PlatformIO (like VS Code).
2. Configure your Wi-Fi credentials and API endpoints.
3. Build and upload the firmware to your ESP board.

---

## ☁️ Deployment

- **Frontend (Mobile):** Fully compatible with Vercel. Connect your repository to Vercel and set the **Root Directory** to `mobile`. Vercel will automatically detect the Vite framework and handle SPA routing.
- **Backend:** Designed for continuous execution due to persistent WebSockets and automation loops. It must be deployed to a Virtual Private Server (VPS) such as DigitalOcean, AWS EC2, Railway, or Render (as a Web Service). **Do not deploy the backend to serverless platforms.**
