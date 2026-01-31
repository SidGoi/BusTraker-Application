import * as Location from "expo-location";
import { useEffect, useState, useRef, useMemo } from "react";
import { ActivityIndicator, Alert, Image, StyleSheet, Text, View, Pressable } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Map as MapIcon, Timer, Navigation } from "lucide-react-native";

const DESTINATION = {
  latitude: 23.0451519,
  longitude: 72.5900635,
};

export default function LiveMap() {
  const [location, setLocation] = useState<any>(null);
  const [heading, setHeading] = useState(0);
  const [isMapReady, setIsMapReady] = useState(false);
  const mapRef = useRef<MapView>(null);

  // REAL-TIME CALCULATION
  const etaInfo = useMemo(() => {
    if (!location) return null;

    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371; 
    const dLat = toRad(DESTINATION.latitude - location.latitude);
    const dLon = toRad(DESTINATION.longitude - location.longitude);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(location.latitude)) * Math.cos(toRad(DESTINATION.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Avg City Speed for Bus: 22 km/h
    const timeMinutes = Math.round((distanceKm / 22) * 60);

    return {
      distance: distanceKm.toFixed(1),
      minutes: timeMinutes > 0 ? timeMinutes : 1 
    };
  }, [location]);

  useEffect(() => {
    let subscription: Location.LocationSubscription;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 2000, distanceInterval: 5 },
        (loc) => {
          setLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
          if (loc.coords.heading !== null) setHeading(loc.coords.heading);
        }
      );
    })();
    return () => subscription?.remove();
  }, []);

  const showFullRoute = () => {
    if (mapRef.current && location) {
      mapRef.current.fitToCoordinates([location, DESTINATION], {
        edgePadding: { top: 150, right: 80, bottom: 150, left: 80 },
        animated: true,
      });
    }
  };

  if (!location) return null;

  return (
    <View className="flex-1 overflow-hidden bg-slate-900 border-t border-slate-800">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={{ ...location, latitudeDelta: 0.005, longitudeDelta: 0.005 }}
        onMapReady={() => setIsMapReady(true)}
      >
        <Marker coordinate={location} flat anchor={{ x: 0.5, y: 0.5 }} rotation={heading}>
          <Image source={require("../assets/bus-top-view.png")} style={{ width: 30, height: 30 }} resizeMode="contain" />
        </Marker>

        <Marker coordinate={DESTINATION} anchor={{ x: 0.5, y: 1 }}>
          <Image source={require("../assets/flag.png")} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </Marker>
      </MapView>

      {/* COMBINED BOTTOM-RIGHT INFO PANEL */}
      {isMapReady && etaInfo && (
        <View className="absolute bottom-6 left-6 flex-row items-center justify-center gap-5">
          {/* Route Toggle Button */}
          <Pressable
            onPress={showFullRoute}
            className="bg-blue-600 w-16 h-16 rounded-full items-center justify-center shadow-2xl border border-blue-400 active:bg-blue-700"
          >
            <Navigation size={24} color="white" />
          </Pressable>
        </View>
      )}

      {!isMapReady && (
        <View className="absolute inset-0 bg-slate-900 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    </View>
  );
}