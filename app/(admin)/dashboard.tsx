import React, { useEffect, useState, useRef, useMemo } from "react";
import {
  Alert,
  Pressable,
  Text,
  View,
  ActivityIndicator,
  Linking,
  TextInput,
  Modal,
  FlatList,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  LogOut,
  ShieldCheck,
  RefreshCw,
  Search,
  X,
  ExternalLink,
  Clock,
  Info,
  Globe,
  ArrowRight,
} from "lucide-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import AdminLiveMap from "@/components/AdminLiveMap";
import { StatusBar } from "expo-status-bar";

const API_URL = "https://bus-traker-backend-82zs.vercel.app/api/buses";

export default function AdminDashboard() {
  const router = useRouter();
  const [adminData, setAdminData] = useState<any>(null);
  const [allBuses, setAllBuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStatusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedBus, setSelectedBus] = useState<any>(null);

  const mapRef = useRef<any>(null);

  // LOGIC: Normalization helper to match "Zone - 1" with "Zone 1"
  const normalize = (str: string) => str.toLowerCase().replace(/[\s-]/g, "");

  // MEMO: Filter buses based on normalized zone matching
  const zoneBuses = useMemo(() => {
    if (!adminData?.zone || allBuses.length === 0) return [];
    const targetZone = normalize(adminData.zone);
    return allBuses.filter((bus) => bus.zone && normalize(bus.zone) === targetZone);
  }, [allBuses, adminData]);

  useEffect(() => {
    const initAdmin = async () => {
      const session = await AsyncStorage.getItem("bus_session");
      if (session) {
        const parsed = JSON.parse(session);
        setAdminData(parsed);
        fetchBuses();
        const interval = setInterval(fetchBuses, 5000);
        return () => clearInterval(interval);
      }
    };
    initAdmin();
  }, []);

  const fetchBuses = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch(API_URL);
      const json = await response.json();
      if (json.success) {
        setAllBuses(json.data);
        if (selectedBus) {
          const updated = json.data.find((b: any) => b.busId === selectedBus.busId);
          if (updated) setSelectedBus(updated);
        }
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setTimeout(() => setIsRefreshing(false), 800);
    }
  };

  const getStatus = (lastUpdate?: string) => {
    if (!lastUpdate) return { active: false, label: "INACTIVE" };
    const diff = (new Date().getTime() - new Date(lastUpdate).getTime()) / 60000;
    return { active: diff <= 3, label: diff <= 3 ? "ACTIVE" : "INACTIVE" };
  };

  const counts = useMemo(() => {
    const active = zoneBuses.filter((b) => getStatus(b.lastUpdate).active).length;
    return { active, inactive: zoneBuses.length - active };
  }, [zoneBuses]);

  const handleLogout = () => {
    Alert.alert("Terminate Session", "Exit Admin Control Panel?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem("bus_session");
          router.replace("/");
        },
      },
    ]);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    const found = zoneBuses.find((b) => b.busId.toString() === text.trim());
    if (found && mapRef.current) {
      mapRef.current.animateToRegion({
          latitude: found.location[0],
          longitude: found.location[1],
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 1000);
      setSelectedBus(found);
    }
  };

  if (loading) return (
      <View className="flex-1 justify-center items-center bg-slate-900">
        <ActivityIndicator size="large" color="#10b981" />
        <Text className="text-emerald-500 font-bold mt-4 uppercase tracking-widest">Sector Intel Initialising</Text>
      </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      <StatusBar style="light" />

      {/* HEADER */}
      <View className="px-6 py-4 flex-row items-center justify-between border-b border-slate-800 bg-slate-900">
        <View className="flex-row items-center">
          <ShieldCheck size={24} color="#10b981" />
          <View className="ml-3">
            <Text className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Sector Admin</Text>
            <Text className="text-xl font-black text-white uppercase tracking-tighter">{adminData?.zone}</Text>
          </View>
        </View>
        <Pressable onPress={handleLogout} className="w-10 h-10 bg-emerald-500/10 rounded-xl items-center justify-center border border-emerald-500/20 active:opacity-60">
          <LogOut size={18} color="#10b981" />
        </Pressable>
      </View>

      {/* SEARCH BAR */}
      <View className="px-6 py-3 bg-slate-900">
        <View className="flex-row items-center bg-slate-800 rounded-2xl px-4 border border-slate-700 shadow-sm">
          <Search size={18} color="#94a3b8" />
          <TextInput
            placeholder={`Search ${adminData?.zone} Units...`}
            placeholderTextColor="#64748b"
            className="flex-1 h-12 ml-3 text-white font-medium"
            value={searchQuery}
            onChangeText={handleSearch}
            keyboardType="numeric"
          />
          {searchQuery !== "" && (
            <Pressable onPress={() => { setSearchQuery(""); setSelectedBus(null); }}><X size={18} color="#94a3b8" /></Pressable>
          )}
        </View>
      </View>

      {/* STATS BAR */}
      <Pressable onPress={() => setStatusModalVisible(true)} className="mx-6 mb-4 flex-row bg-slate-800/50 p-3 rounded-2xl border border-slate-700 justify-around items-center">
        <View className="flex-row items-center"><View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" /><Text className="text-white font-bold">{counts.active} Active</Text></View>
        <View className="w-[1px] h-4 bg-slate-700" /><View className="flex-row items-center"><View className="w-2 h-2 rounded-full bg-slate-500 mr-2" /><Text className="text-slate-400 font-bold">{counts.inactive} Inactive</Text></View>
        <Info size={16} color="#10b981" />
      </Pressable>

      <View className="flex-1 relative">
        <AdminLiveMap buses={zoneBuses} mapRef={mapRef} searchQuery={searchQuery} onBusPress={setSelectedBus} />
        
        {/* COMMAND OVERLAY */}
        <View className="absolute top-4 left-6 right-6">
          <View className="bg-slate-900/90 p-3 rounded-2xl shadow-2xl border border-slate-700 flex-row items-center justify-between">
            <View className="flex-row items-center"><Globe size={16} color="#10b981" /><Text className="ml-2 font-bold text-white text-[11px] uppercase tracking-wider">Sector Surveillance</Text></View>
            <View className="flex-row gap-2 items-center">{isRefreshing && <RefreshCw size={10} color="#10b981" className="mr-5" />}<Text className="text-slate-500 text-[9px] font-black uppercase">Live Link</Text></View>
          </View>
        </View>

        {/* DETAIL CARD */}
        {!!selectedBus && (
          <View className="absolute bottom-6 left-6 right-6 bg-white rounded-[32px] p-6 shadow-2xl border border-slate-100">
            <View className="flex-row justify-between items-start mb-4">
              <View>
                <Text className="text-2xl font-black text-slate-900">Bus #{selectedBus.busId}</Text>
                <Text className="text-emerald-600 font-bold uppercase tracking-widest text-[10px]">{selectedBus.zone} Sector</Text>
              </View>
              <View className={`px-4 py-1.5 rounded-full ${getStatus(selectedBus.lastUpdate).active ? "bg-emerald-100" : "bg-slate-100"}`}>
                <Text className={`text-[10px] font-black ${getStatus(selectedBus.lastUpdate).active ? "text-emerald-600" : "text-slate-400"}`}>{getStatus(selectedBus.lastUpdate).label}</Text>
              </View>
            </View>
            <View className="flex-row items-center mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <Clock size={16} color="#10b981" />
              <View className="ml-3">
                <Text className="text-slate-400 text-[10px] font-bold uppercase">Last GPS Pulse</Text>
                <Text className="text-slate-900 font-black text-sm">{selectedBus.lastUpdate ? new Date(selectedBus.lastUpdate).toLocaleTimeString() : "Waiting..."}</Text>
              </View>
            </View>
            <View className="flex-row gap-3">
              <Pressable onPress={() => setSelectedBus(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl items-center"><Text className="text-slate-600 font-bold">Dismiss</Text></Pressable>
              <Pressable onPress={() => Linking.openURL("https://bus-attendance-sys.vercel.app/admin")} className="flex-row items-center justify-center flex-[1.5] bg-emerald-600 py-4 rounded-2xl shadow-lg active:opacity-80"><ExternalLink size={18} color="white" /><Text className="text-white font-bold ml-2">Open Portal</Text></Pressable>
            </View>
          </View>
        )}
      </View>

      {/* PORTAL LINK */}
      {!selectedBus && (
        <View className="bg-slate-900 px-6 pt-6 pb-8 border-t border-slate-800">
          <Pressable onPress={() => Linking.openURL("https://bus-attendance-sys.vercel.app/admin")} className="bg-emerald-600 flex-row items-center justify-between px-6 py-5 rounded-[24px] shadow-lg active:opacity-90 shadow-emerald-500/20">
            <View className="flex-row items-center"><ExternalLink size={20} color="white" /><Text className="text-white text-lg font-black ml-3">Admin Attendance Portal</Text></View>
            <ArrowRight size={22} color="white" />
          </Pressable>
        </View>
      )}

      {/* REGISTRY MODAL */}
      <Modal visible={isStatusModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-slate-900 rounded-t-[40px] p-6 h-3/4 border-t border-slate-700">
            <View className="flex-row justify-between items-center mb-6 px-2">
              <Text className="text-2xl font-black text-white">Registry Directory</Text>
              <Pressable onPress={() => setStatusModalVisible(false)} className="bg-slate-800 p-2 rounded-full"><X size={20} color="white" /></Pressable>
            </View>
            <FlatList
              data={zoneBuses}
              keyExtractor={(item) => item._id}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const { active, label } = getStatus(item.lastUpdate);
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedBus(item);
                      setStatusModalVisible(false);
                      mapRef.current?.animateToRegion({ latitude: item.location[0], longitude: item.location[1], latitudeDelta: 0.005, longitudeDelta: 0.005 }, 1000);
                    }}
                    className="bg-slate-800 p-4 rounded-2xl mb-3 flex-row justify-between items-center border border-slate-700"
                  >
                    <View><Text className="text-white font-bold text-lg">Bus #{item.busId}</Text><Text className="text-slate-400 text-xs uppercase font-medium">{item.zone} Sector</Text></View>
                    <View className={`${active ? "bg-emerald-500/10 border-emerald-500/20" : "bg-slate-500/10 border-slate-500/20"} px-3 py-1 rounded-full border`}><Text className={`${active ? "text-emerald-500" : "text-slate-500"} font-bold text-[10px]`}>{label}</Text></View>
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}