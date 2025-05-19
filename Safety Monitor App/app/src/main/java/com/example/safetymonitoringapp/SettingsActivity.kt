package com.example.safetymonitoringapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.tooling.preview.Preview
import com.example.safetymonitoringapp.ui.theme.SafetyMonitoringAppTheme

class SettingsActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            SafetyMonitoringAppTheme {
                SettingsScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") }
            )
        },
        content = { padding ->
            Column(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
            ) {
                Text("Timer Configuration", style = MaterialTheme.typography.titleLarge)
                // Add UI elements for setting check-in interval, response window, and countdown duration

                Spacer(modifier = Modifier.height(16.dp))

                Text("Emergency Contacts", style = MaterialTheme.typography.titleLarge)
                // Add UI elements for entering emergency contact details

                Spacer(modifier = Modifier.height(16.dp))

                Text("Personal Information", style = MaterialTheme.typography.titleLarge)
                // Add UI elements for entering personal information like medical history, primary physician contact, etc.

                Spacer(modifier = Modifier.height(16.dp))

                Text("Additional Settings", style = MaterialTheme.typography.titleLarge)
                // Add UI elements for additional settings like customizable emergency message template, GPS tracking, etc.
            }
        }
    )
}

@Preview(showBackground = true)
@Composable
fun SettingsPreview() {
    SafetyMonitoringAppTheme {
        SettingsScreen()
    }
}