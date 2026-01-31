import { useRouter, Link } from "expo-router";
import {
  ArrowRight,
  Bus,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react-native";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";

const API_URL =
  "https://bus-traker-backend-82zs.vercel.app/api/buses/login-details";

export default function LoginScreen() {
  const router = useRouter();
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [busList, setBusList] = useState([]);

  const [selectedZone, setSelectedZone] = useState("");
  const [selectedBusId, setSelectedBusId] = useState<number | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<"zone" | "bus">("zone");

  useEffect(() => {
    fetch(API_URL)
      .then((res) => res.json())
      .then((json) => {
        if (json.success) setBusList(json.data);
      })
      .catch(() => Alert.alert("Error", "Server connection failed"))
      .finally(() => setInitialLoading(false));
  }, []);

  const zones = useMemo(
    () => [...new Set(busList.map((item: any) => item.zone))].sort(),
    [busList],
  );
  const filteredBuses = useMemo(
    () => busList.filter((item: any) => item.zone === selectedZone),
    [selectedZone, busList],
  );

  const handleLogin = async () => {
    if (!selectedZone || !selectedBusId || !password)
      return Alert.alert("Required", "Please fill all fields.");
    setIsLoggingIn(true);

    const bus: any = busList.find(
      (b: any) => b.zone === selectedZone && b.busId === selectedBusId,
    );
    if (bus && bus.password.toString() === password.trim()) {
      await AsyncStorage.setItem(
        "bus_session",
        JSON.stringify({
          busId: selectedBusId,
          zone: selectedZone,
          role: "User",
        }),
      );
      router.replace("/(user)/dashboard");
    } else {
      Alert.alert("Failed", "Incorrect credentials.");
    }
    setIsLoggingIn(false);
  };

  if (initialLoading)
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      <StatusBar style="dark" backgroundColor="#ffffff" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView className="px-6" contentContainerStyle={{ flexGrow: 1 }}>
          <View className="items-center mt-12 mb-8">
            <View className="w-20 h-20 bg-blue-600 rounded-3xl items-center justify-center shadow-xl mb-4">
              <Bus color="white" size={40} />
            </View>
            <Text className="text-3xl font-black text-slate-900">
              Mission <Text className="text-blue-600">92</Text>
            </Text>
            <Text className="text-slate-400 font-bold mt-1">
              Bus Attendance System
            </Text>
          </View>

          {/* User Form Fields */}
          <Pressable
            onPress={() => {
              setModalType("zone");
              setModalVisible(true);
            }}
            className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-5 mb-4 shadow-sm active:bg-slate-50"
          >
            <MapPin size={20} color="#2563eb" />
            <Text className="flex-1 ml-3 text-slate-700 font-semibold">
              {selectedZone || "Select Zone"}
            </Text>
            <ChevronDown size={18} color="#94a3b8" />
          </Pressable>

          <Pressable
            disabled={!selectedZone}
            onPress={() => {
              setModalType("bus");
              setModalVisible(true);
            }}
            className={`flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 py-5 mb-4 shadow-sm ${!selectedZone ? "opacity-50" : "active:bg-slate-50"}`}
          >
            <Bus size={20} color="#2563eb" />
            <Text className="flex-1 ml-3 text-slate-700 font-semibold">
              {selectedBusId ? `Bus ID: ${selectedBusId}` : "Select Bus"}
            </Text>
            <ChevronDown size={18} color="#94a3b8" />
          </Pressable>

          <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-4 mb-8 shadow-sm">
            <Lock size={20} color="#2563eb" />
            <TextInput
              placeholder="Password"
              secureTextEntry={!showPassword}
              className="flex-1 h-16 ml-3 font-semibold text-slate-800"
              value={password}
              onChangeText={setPassword}
              keyboardType="numeric"
            />
            <Pressable onPress={() => setShowPassword(!showPassword)}>
              {showPassword ? (
                <EyeOff size={22} color="#94a3b8" />
              ) : (
                <Eye size={22} color="#94a3b8" />
              )}
            </Pressable>
          </View>

          {/* Primary Login Button */}
          <Pressable
            onPress={handleLogin}
            disabled={isLoggingIn}
            className="bg-blue-600 py-5 rounded-2xl flex-row justify-center items-center shadow-lg active:bg-blue-700"
          >
            {isLoggingIn ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text className="text-white text-lg font-black mr-2">
                  Sign In
                </Text>
                <ArrowRight size={20} color="white" />
              </>
            )}
          </Pressable>

          {/* ROLE SWITCHING SECTION */}
          <View className="mt-12">
            <View className="flex-row items-center mb-4">
              <View className="flex-1 h-[1px] bg-slate-200" />
              <Text className="mx-4 text-slate-400 font-bold uppercase text-[10px] tracking-widest">
                Login As
              </Text>
              <View className="flex-1 h-[1px] bg-slate-200" />
            </View>

            <View className="flex-row justify-between gap-4">
              <Pressable
                onPress={() => router.push("/admin-login")}
                className="flex-1 bg-white py-4 rounded-2xl border border-emerald-100 flex-row justify-center items-center shadow-sm active:bg-emerald-50"
              >
                <View className="w-8 h-8 bg-emerald-100 rounded-lg items-center justify-center mr-2">
                  <ShieldCheck size={16} color="#10b981" />
                </View>
                <Text className="text-emerald-700 font-black">Admin</Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/super-admin-login")}
                className="flex-1 bg-white py-4 rounded-2xl border border-red-100 flex-row justify-center items-center shadow-sm active:bg-red-50"
              >
                <View className="w-8 h-8 bg-red-100 rounded-lg items-center justify-center mr-2">
                  <ShieldAlert size={16} color="#ef4444" />
                </View>
                <Text className="text-red-700 font-black">Super</Text>
              </Pressable>
            </View>
          </View>

          <View className="pb-10 mt-8 items-center">
            <Text className="text-slate-400 text-xs font-medium">
              Internal Use Only
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-[40px] p-8 h-1/2">
            <FlatList
              data={modalType === "zone" ? zones : filteredBuses}
              renderItem={({ item }: any) => (
                <Pressable
                  onPress={() => {
                    if (modalType === "zone") {
                      setSelectedZone(item);
                      setSelectedBusId(null);
                    } else {
                      setSelectedBusId(item.busId);
                    }
                    setModalVisible(false);
                  }}
                  className="py-5 border-b border-slate-50"
                >
                  <Text className="text-lg font-medium">
                    {typeof item === "string" ? item : `Bus ${item.busId}`}
                  </Text>
                </Pressable>
              )}
            />
            <Pressable
              onPress={() => setModalVisible(false)}
              className="mt-4 items-center"
            >
              <Text className="text-blue-600 font-bold">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
