import { useRouter } from "expo-router";
import { ArrowLeft, ShieldAlert, Lock } from "lucide-react-native";
import React, { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function SuperAdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (password !== "9876") return Alert.alert("Error", "Invalid Super Admin access");
    await AsyncStorage.setItem("bus_session", JSON.stringify({ role: "SuperAdmin" }));
    router.replace("/(super)/dashboard");
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-6">
      <Pressable onPress={() => router.back()} className="mt-4 mb-8 flex-row items-center"><ArrowLeft size={24} color="#64748b" /><Text className="ml-2 text-slate-500 font-bold">Back</Text></Pressable>
      <View className="items-center mb-10">
        <View className="w-16 h-16 bg-red-600 rounded-2xl items-center justify-center mb-4 shadow-lg"><ShieldAlert color="white" size={32} /></View>
        <Text className="text-2xl font-black text-slate-900">Super Admin</Text>
        <Text className="text-slate-500">System Level Access</Text>
      </View>

      <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 mb-8"><Lock size={20} color="#ef4444" /><TextInput placeholder="Master Password" secureTextEntry className="flex-1 h-16 ml-3 font-semibold" value={password} onChangeText={setPassword} keyboardType="numeric" /></View>
      <Pressable onPress={handleLogin} className="bg-red-600 py-5 rounded-2xl items-center shadow-lg"><Text className="text-white text-lg font-black">Authorized Access</Text></Pressable>
    </SafeAreaView>
  );
}