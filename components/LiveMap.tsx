import React, { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import OSMMap from './OSMMap';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-bus-tracking';

// Fixed Type Error: Added 'async' to make it return a Promise<void>
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }: any) => {
  if (error || !data) return;
  
  const { locations } = data;
  if (locations && locations.length > 0) {
    const { latitude, longitude } = locations[0].coords;

    try {
      // 1. Get the bus session to know WHICH bus ID to update
      const session = await AsyncStorage.getItem("bus_session");
      if (!session) return;
      const { busId } = JSON.parse(session);

      // 2. Send the update to your Vercel API
      await fetch("https://bus-traker-backend-82zs.vercel.app/api/buses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          busId: busId,
          location: [latitude, longitude],
        }),
      });
      
      console.log(`Background update sent for Bus ${busId}: ${latitude}, ${longitude}`);
    } catch (err) {
      console.error("Background fetch failed:", err);
    }
  }
});
export default function LiveMap() {
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    let foregroundSub: Location.LocationSubscription;

    const setupLocation = async () => {
      try {
        const { status: foreStatus } = await Location.requestForegroundPermissionsAsync();
        const { status: backStatus } = await Location.requestBackgroundPermissionsAsync();
        
        if (foreStatus !== 'granted' || backStatus !== 'granted') return;

        const initial = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setLocation(initial.coords);

        foregroundSub = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.High, distanceInterval: 5 },
          (loc) => setLocation(loc.coords)
        );

        const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
        if (!isRegistered) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 5,
            // Required for Android Background behavior
            foregroundService: {
              notificationTitle: "Bus Tracker Active",
              notificationBody: "Live location sharing is enabled.",
              notificationColor: "#10b981"
            },
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
          });
        }
      } catch (err) {}
    };

    setupLocation();
    return () => { if (foregroundSub) foregroundSub.remove(); };
  }, []);

  const markers = location ? [{
    id: 'driver',
    latitude: location.latitude,
    longitude: location.longitude,
    title: 'ME',
    color: '#22c55e' 
  }] : [];

  return <OSMMap markers={markers} />;
}