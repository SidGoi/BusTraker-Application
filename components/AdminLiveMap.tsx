import React, { useState } from "react";
import { Image, View, Text, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import { Clock, Navigation } from "lucide-react-native";

interface Bus {
  _id: string;
  busId: number;
  zone: string;
  location: [number, number];
  lastUpdate?: string;
}

interface AdminLiveMapProps {
  buses: Bus[];
  mapRef: any;
  searchQuery: string;
  onBusPress: (bus: Bus) => void;
}

const DESTINATION = {
  latitude: 23.0451519,
  longitude: 72.5900635,
};

export default function AdminLiveMap({ buses, mapRef, searchQuery, onBusPress }: AdminLiveMapProps) {
  const [isMapReady, setIsMapReady] = useState(false);

  const getBusStatus = (lastUpdate?: string) => {
    if (!lastUpdate) return { isInactive: true };
    const diff = (new Date().getTime() - new Date(lastUpdate).getTime()) / 60000;
    return { isInactive: diff > 3 };
  };

  const formatTime = (dateString?: string) => {
    if (!dateString) return "Signal Lost";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "Waiting..." : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const focusDestination = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion({
        ...DESTINATION,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
  };

  return (
    <View className="flex-1 overflow-hidden bg-slate-900 border-t border-slate-800">
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{ ...DESTINATION, latitudeDelta: 0.1, longitudeDelta: 0.1 }}
        onMapReady={() => setIsMapReady(true)}
      >
        {buses.map((bus) => {
          const { isInactive } = getBusStatus(bus.lastUpdate);
          const isHighlighted = searchQuery !== "" && bus.busId.toString() === searchQuery.trim();

          return (
            <Marker
              key={bus._id}
              coordinate={{ latitude: bus.location[0], longitude: bus.location[1] }}
              flat
              anchor={{ x: 0.5, y: 0.5 }}
              onPress={() => onBusPress(bus)}
            >
              <View className="items-center justify-center">
                {isHighlighted && <View className="absolute w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400" />}
                <Image
                  source={isInactive ? require("../assets/bus-top-view-inactive.png") : require("../assets/bus-top-view.png")}
                  style={{ width: isHighlighted ? 48 : 36, height: isHighlighted ? 48 : 36, opacity: isInactive ? 0.7 : 1 }}
                  resizeMode="contain"
                />
              </View>

              <Callout tooltip>
                <View style={styles.calloutContainer}>
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-black text-slate-900 text-lg">Unit #{bus.busId}</Text>
                    <View className={`w-3 h-3 rounded-full ${!isInactive ? "bg-emerald-500 shadow-sm" : "bg-slate-300"}`} />
                  </View>
                  <Text className="text-emerald-600 font-bold text-[10px] uppercase tracking-widest">{bus.zone} Sector</Text>
                  <View className="h-[1px] bg-slate-100 w-full my-1" />
                  <View className="flex-row items-center mt-1">
                    <Clock size={10} color="#64748b" />
                    <Text className="text-slate-500 text-[11px] font-bold ml-1">Last: {formatTime(bus.lastUpdate)}</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}

        <Marker coordinate={DESTINATION} anchor={{ x: 0.5, y: 1 }}>
          <Image source={require("../assets/flag.png")} style={{ width: 40, height: 40 }} resizeMode="contain" />
        </Marker>
      </MapView>

      {isMapReady && (
        <Pressable
          onPress={focusDestination}
          className="absolute bottom-6 right-6 bg-emerald-600 w-16 h-16 rounded-full items-center justify-center shadow-2xl border border-emerald-400 active:bg-emerald-700"
        >
          <Navigation size={28} color="white" />
        </Pressable>
      )}

      {!isMapReady && <View style={styles.loadingOverlay}><ActivityIndicator size="large" color="#10b981" /></View>}
    </View>
  );
}

const styles = StyleSheet.create({
  calloutContainer: { backgroundColor: "white", padding: 16, borderRadius: 24, borderWidth: 1, borderColor: "#e2e8f0", minWidth: 180 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#0f172a", justifyContent: "center", alignItems: "center", zIndex: 10 },
});