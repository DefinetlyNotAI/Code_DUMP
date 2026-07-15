package com.example.safetymonitoringapp

import android.app.Service
import android.content.Intent
import android.os.IBinder

class EmergencyService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Implement emergency contact logic here
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
}