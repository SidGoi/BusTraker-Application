import { useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, MapPin, Lock, ChevronDown } from "lucide-react-native";
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert, Modal, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [selectedZone, setSelectedZone] = useState("");
  const [zones, setZones] = useState<string[]>([]); // Array of strings
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  // FETCH ZONES
  useEffect(() => {
    fetch("https://bus-traker-backend-82zs.vercel.app/api/admin/login")
      .then(res => res.json())
      .then(json => { 
        if (json.success) {
          // ENSURE DATA IS STRINGS: Even if the API returns objects, we map them to strings
          const zoneNames = json.data.map((item: any) => 
            typeof item === 'object' ? item.zone : item
          );
          // Remove duplicates and sort
          setZones([...new Set(zoneNames)].sort() as string[]);
        } 
      })
      .catch(err => console.log("Failed to load zones:", err));
  }, []);

  const handleLogin = async () => {
    if (!selectedZone || !password) return Alert.alert("Error", "Please select a zone and enter password");
    
    setLoading(true);
    try {
      const response = await fetch("https://bus-traker-backend-82zs.vercel.app/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: selectedZone, password: password.trim() }),
      });

      const json = await response.json();

      if (json.success) {
        await AsyncStorage.setItem("bus_session", JSON.stringify({ 
          zone: selectedZone,   
          role: "Admin" 
        }));
        router.replace("/(admin)/dashboard");
      } else {
        Alert.alert("Login Failed", "Incorrect password for " + selectedZone);
      }
    } catch (error) {
      Alert.alert("Error", "Server is not responding");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white px-6">
      {/* HEADER */}
      <Pressable onPress={() => router.back()} className="mt-4 mb-8 flex-row items-center">
        <ArrowLeft size={24} color="#64748b" />
        <Text className="ml-2 text-slate-500 font-bold">Back</Text>
      </Pressable>

      <View className="items-center mb-10">
        <View className="w-16 h-16 bg-emerald-100 rounded-3xl items-center justify-center mb-4 border border-emerald-200">
          <ShieldCheck color="#059669" size={32} />
        </View>
        <Text className="text-3xl font-black text-slate-900">Admin Portal</Text>
        <Text className="text-slate-400 font-medium mt-1">Zone-specific access only</Text>
      </View>

      {/* FORM */}
      <View className="space-y-4">
        {/* ZONE SELECTOR */}
        <Pressable 
          onPress={() => setModalVisible(true)} 
          className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 py-5 mb-4 shadow-sm"
        >
          <MapPin size={20} color="#10b981" />
          <Text className="flex-1 ml-3 font-bold text-slate-700">
            {selectedZone || "Select Your Zone"}
          </Text>
          <ChevronDown size={18} color="#94a3b8" />
        </Pressable>

        {/* PASSWORD INPUT */}
        <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-2xl px-4 mb-8 shadow-sm">
          <Lock size={20} color="#10b981" />
          <TextInput 
            placeholder="Zone Password" 
            secureTextEntry 
            className="flex-1 h-16 ml-3 font-bold text-slate-900" 
            value={password} 
            onChangeText={setPassword} 
            keyboardType="numeric" 
          />
        </View>

        {/* LOGIN BUTTON */}
        <Pressable 
          onPress={handleLogin} 
          disabled={loading}
          className="bg-emerald-600 py-5 rounded-2xl items-center shadow-lg active:bg-emerald-700"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white text-lg font-black uppercase tracking-widest">Verify & Enter</Text>
          )}
        </Pressable>
      </View>

      {/* ZONE SELECTION MODAL */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/40">
          <View className="bg-white rounded-t-[40px] p-8 h-2/3">
            <Text className="text-xl font-black text-slate-900 mb-6 text-center">Select Zone</Text>
            
            <FlatList 
              data={zones} 
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <Pressable 
                  onPress={() => { setSelectedZone(item); setModalVisible(false); }} 
                  className="py-5 border-b border-slate-50 active:bg-slate-50"
                >
                  <Text className="text-lg font-bold text-slate-700 text-center">{item}</Text>
                </Pressable>
              )} 
            />
            
            <Pressable onPress={() => setModalVisible(false)} className="mt-4 py-4 items-center">
              <Text className="text-emerald-600 font-black">Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}