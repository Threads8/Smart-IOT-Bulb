require('dotenv').config({ path: '../.env.example' }); // using .env.example for now, or .env if they copied it
// Let's actually load from .env first, fallback to .env.example
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.resolve(__dirname, '../../../.env');
const envExamplePath = path.resolve(__dirname, '../../../.env.example');

if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config({ path: envExamplePath });
}

const WizController = require('./wizController');

const ip = process.env.WIZ_LIGHT_IP;

if (!ip || ip.includes('x')) {
    console.error("ERROR: Please set a valid WIZ_LIGHT_IP in your .env or .env.example file!");
    process.exit(1);
}

const bulb = new WizController(ip);

async function runTests() {
    console.log(`Testing WiZ bulb at ${ip}...\n`);

    try {
        console.log("1. Getting current state...");
        const state = await bulb.getState();
        console.log("State:", JSON.stringify(state.result, null, 2));
        
        console.log("\n2. Turning ON...");
        await bulb.turnOn();
        await delay(2000);

        console.log("3. Setting brightness to 50%...");
        await bulb.setBrightness(50);
        await delay(2000);

        console.log("4. Setting color to RED (255, 0, 0)...");
        await bulb.setRGB(255, 0, 0);
        await delay(2000);

        console.log("5. Setting color to BLUE (0, 0, 255)...");
        await bulb.setRGB(0, 0, 255);
        await delay(2000);

        console.log("6. Setting to Warm White (2700K)...");
        await bulb.setWhite(2700);
        await delay(2000);

        console.log("7. Turning OFF...");
        await bulb.turnOff();
        
        console.log("\nAll tests completed successfully!");
        process.exit(0);
    } catch (error) {
        console.error("\nTEST FAILED:", error.message);
        process.exit(1);
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

runTests();
