// Copyright (c) 2025 Eclipse Foundation.
//
// This program and the accompanying materials are made available under the
// terms of the MIT License which is available at
// https://opensource.org/licenses/MIT.
//
// SPDX-License-Identifier: MIT

// Constants for Vehicle Edge Runtime Dashboard

export const DEFAULT_DEPLOYMENT_CONFIG = {
  vehicleId: 'default-vehicle',
  entryPoint: 'main.py',
  environment: 'python',
  resources: {
    cpu: 0.5,
    memory: 512
  },
  autoStart: true,
  restartOnFailure: true,
  healthCheck: {
    enabled: true,
    interval: 30,
    timeout: 10,
    retries: 3
  }
}

export const PROTOTYPE_APPS = [
  {
    id: '1',
    name: 'Vehicle Data Logger',
    description: 'Logs vehicle speed, location, and sensor data',
    category: 'Data Collection',
    difficulty: 'Beginner',
    estimatedTime: '10 minutes',
    code: `# Vehicle Data Logger
import json
import time
from datetime import datetime

class VehicleDataLogger:
    def __init__(self):
        self.log_file = "vehicle_data.json"

    def log_vehicle_data(self, speed, location, sensors):
        """Log vehicle telemetry data"""
        timestamp = datetime.now().isoformat()

        data_entry = {
            "timestamp": timestamp,
            "speed": speed,
            "location": location,
            "sensors": sensors
        }

        try:
            with open(self.log_file, 'a') as f:
                json.dump(data_entry, f)
                f.write('\\n')
            return True
        except Exception as e:
            print(f"Error logging data: {e}")
            return False

# Example usage
logger = VehicleDataLogger()
logger.log_vehicle_data(
    speed=60.0,
    location={"lat": 37.7749, "lon": -122.4194},
    sensors={"temperature": 25.5, "pressure": 1013.25}
)
`
  },
  {
    id: '2',
    name: 'Speed Alert System',
    description: 'Monitors vehicle speed and triggers alerts',
    category: 'Safety',
    difficulty: 'Intermediate',
    estimatedTime: '15 minutes',
    code: `# Speed Alert System
import time

class SpeedAlertSystem:
    def __init__(self, speed_limit=80):
        self.speed_limit = speed_limit
        self.alert_threshold = 10  # Alert when 10 km/h over limit

    def check_speed(self, current_speed):
        """Check if speed exceeds limit and trigger alert"""
        if current_speed > self.speed_limit + self.alert_threshold:
            self.trigger_alert(current_speed)
            return True
        return False

    def trigger_alert(self, speed):
        """Trigger speed alert"""
        print(f"⚠️ SPEED ALERT: {speed} km/h (Limit: {self.speed_limit} km/h)")
        # In a real vehicle, this would activate dashboard alerts

# Example usage
alert_system = SpeedAlertSystem(speed_limit=80)
alert_system.check_speed(95)  # This would trigger an alert
`
  },
  {
    id: '3',
    name: 'Fuel Efficiency Monitor',
    description: 'Calculates and monitors fuel efficiency',
    category: 'Efficiency',
    difficulty: 'Intermediate',
    estimatedTime: '20 minutes',
    code: `# Fuel Efficiency Monitor
import time

class FuelEfficiencyMonitor:
    def __init__(self):
        self.trip_distance = 0
        self.trip_fuel = 0
        self.fuel_history = []

    def add_distance(self, km):
        """Add distance traveled"""
        self.trip_distance += km

    def add_fuel_consumption(self, liters):
        """Add fuel consumed"""
        self.trip_fuel += liters

    def calculate_efficiency(self):
        """Calculate fuel efficiency in km/l"""
        if self.trip_fuel > 0:
            return self.trip_distance / self.trip_fuel
        return 0

    def log_efficiency(self):
        """Log current efficiency"""
        efficiency = self.calculate_efficiency()
        if efficiency > 0:
            self.fuel_history.append({
                "timestamp": time.time(),
                "efficiency": efficiency,
                "distance": self.trip_distance,
                "fuel": self.trip_fuel
            })
        return efficiency

# Example usage
monitor = FuelEfficiencyMonitor()
monitor.add_distance(100)
monitor.add_fuel_consumption(8)
print(f"Efficiency: {monitor.calculate_efficiency():.1f} km/l")
`
  }
]

export const MARKETPLACE_CATEGORIES = [
  'all',
  'Data Collection',
  'Safety',
  'Efficiency',
  'Navigation',
  'Entertainment',
  'Diagnostics',
  'Communication'
]

export const WEBSOCKET_CONFIG = {
  RECONNECT_INTERVAL: 3000,
  MAX_RECONNECT_ATTEMPTS: 5,
  CONNECTION_TIMEOUT: 5000,
  PING_INTERVAL: 30000
}

export const AUTO_REFRESH_INTERVAL = 30000 // 30 seconds
export const CONSOLE_BUFFER_SIZE = 1000
export const MAX_CONSOLE_LINES = 500