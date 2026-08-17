const firebaseManager = require('./firebaseManager');

class TimeManager {
    constructor() {
        this.preferences = {
            wakeUpTime: "07:00",
            bedtime: "23:00",
            wakeUpDuration: 30, // minutes
            bedtimeDuration: 30, // minutes
            autoLighting: true,
            bedtimeLighting: true,
            wakeUpLighting: true
        };
        
        // Cache basic location times for fallback sunset/sunrise
        this.sunTimes = { sunrise: "06:30", sunset: "18:00" }; 
        this.lastPhase = null;
    }

    async init() {
        const prefs = await firebaseManager.getUserPreferences('default_user');
        if (prefs && prefs.time) {
            this.preferences = { ...this.preferences, ...prefs.time };
        }
    }

    async updatePreferences(newPrefs) {
        this.preferences = { ...this.preferences, ...newPrefs };
        await firebaseManager.saveUserPreferences('default_user', { time: this.preferences });
    }

    // Returns minutes since midnight
    _timeToMinutes(timeStr) {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + (m || 0);
    }
    
    // Returns HH:MM from minutes
    _minutesToTime(mins) {
        const m = (mins % 1440 + 1440) % 1440; // handle negative
        const h = Math.floor(m / 60);
        const mm = m % 60;
        return `${h.toString().padStart(2, '0')}:${mm.toString().padStart(2, '0')}`;
    }

    getState() {
        const now = new Date();
        const currentMins = now.getHours() * 60 + now.getMinutes();
        const wakeMins = this._timeToMinutes(this.preferences.wakeUpTime);
        const bedMins = this._timeToMinutes(this.preferences.bedtime);
        
        const wakeStart = wakeMins;
        const earlyMornStart = wakeMins - 120; // 2 hrs before
        
        const eveningStart = 17 * 60; // 17:00
        const nightStart = 21 * 60; // 21:00
        
        const bedWindowStart = bedMins - this.preferences.bedtimeDuration;
        
        let phase = "DAY";
        let isNight = false;
        let isDay = true;
        
        // Logic for wrap-around midnight
        const isBetween = (curr, start, end) => {
            if (start <= end) return curr >= start && curr < end;
            return curr >= start || curr < end; // spans midnight
        };

        if (isBetween(currentMins, earlyMornStart, wakeStart)) {
            phase = "EARLY_MORNING";
        } else if (isBetween(currentMins, wakeStart, eveningStart)) {
            phase = "DAY";
        } else if (isBetween(currentMins, eveningStart, nightStart)) {
            phase = "EVENING";
        } else if (isBetween(currentMins, nightStart, bedWindowStart)) {
            phase = "NIGHT";
            isDay = false; isNight = true;
        } else if (isBetween(currentMins, bedWindowStart, bedMins)) {
            phase = "BEDTIME";
            isDay = false; isNight = true;
        } else if (isBetween(currentMins, bedMins, earlyMornStart)) {
            phase = "SLEEP";
            isDay = false; isNight = true;
        }

        const state = {
            currentTime: this._minutesToTime(currentMins),
            currentDate: now.toISOString().split('T')[0],
            dayOfWeek: now.getDay(),
            phase: phase,
            isDay,
            isNight,
            isBedtime: phase === "BEDTIME",
            isWakeWindow: phase === "EARLY_MORNING" || (currentMins >= wakeStart && currentMins < wakeStart + this.preferences.wakeUpDuration),
            bedtime: this.preferences.bedtime,
            wakeUp: this.preferences.wakeUpTime,
            sunrise: this.sunTimes.sunrise,
            sunset: this.sunTimes.sunset
        };
        
        // Detect transitions for event hooks
        if (this.lastPhase !== phase) {
            state.phaseChanged = true;
            state.previousPhase = this.lastPhase;
            this.lastPhase = phase;
        } else {
            state.phaseChanged = false;
        }
        
        return state;
    }
}

module.exports = new TimeManager();
