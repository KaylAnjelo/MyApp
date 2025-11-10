import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput } from "react-native";
import { Camera, CameraType } from "react-native-camera-kit";

export default function ScannerScreen({ navigation }) {
  const [showCamera, setShowCamera] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [scanned, setScanned] = useState(false);

  const handleBarcodeScan = (event) => {
    if (scanned) return;
    
    setScanned(true);
    const code = event.nativeEvent.codeStringValue;
    
    Alert.alert(
      "QR Code Scanned",
      `Code: ${code}`,
      [
        {
          text: "Scan Again",
          onPress: () => {
            setScanned(false);
          }
        },
        {
          text: "OK",
          onPress: () => navigation?.goBack?.()
        }
      ]
    );
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) {
      Alert.alert("Error", "Please enter a code");
      return;
    }

    Alert.alert(
      "Code Entered",
      `Code: ${manualCode}`,
      [
        {
          text: "Enter Another",
          onPress: () => setManualCode("")
        },
        {
          text: "OK",
          onPress: () => navigation?.goBack?.()
        }
      ]
    );
  };

  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          cameraType={CameraType.Back}
          scanBarcode={true}
          onReadCode={handleBarcodeScan}
          showFrame={true}
          laserColor="red"
          frameColor="white"
        />
        
        <View style={styles.cameraOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation?.goBack?.()}
            >
              <Text style={styles.backButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.centerContent}>
            <Text style={styles.instructionText}>
              {scanned ? "Code Scanned!" : "Point camera at QR code or barcode"}
            </Text>
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity 
              style={styles.manualButton}
              onPress={() => setShowCamera(false)}
            >
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Manual Entry</Text>
        <Text style={styles.subtitle}>Enter code manually</Text>
      </View>

      <View style={styles.manualEntry}>
        <TextInput
          style={styles.input}
          placeholder="Enter QR code or barcode"
          placeholderTextColor="#999"
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="none"
          autoFocus
        />
        <TouchableOpacity 
          style={styles.scanButton}
          onPress={handleManualSubmit}
        >
          <Text style={styles.scanButtonText}>Submit Code</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.switchButton}
        onPress={() => setShowCamera(true)}
      >
        <Text style={styles.switchButtonText}>📷 Use Camera Instead</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.closeButton}
        onPress={() => navigation?.goBack?.()}
      >
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "space-between",
  },
  topBar: {
    paddingTop: 50,
    paddingHorizontal: 20,
    alignItems: "flex-start",
  },
  backButton: {
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  backButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  instructionText: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bottomBar: {
    paddingBottom: 50,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  manualButton: {
    backgroundColor: "rgba(125,0,6,0.9)",
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 8,
  },
  manualButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    padding: 20,
  },
  header: {
    marginTop: 40,
    marginBottom: 30,
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#7D0006",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  manualEntry: {
    backgroundColor: "#FFF",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    borderWidth: 1,
    borderColor: "#DDD",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: "#F9F9F9",
  },
  scanButton: {
    backgroundColor: "#7D0006",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  scanButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchButton: {
    backgroundColor: "#FFF",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    borderWidth: 2,
    borderColor: "#7D0006",
  },
  switchButtonText: {
    color: "#7D0006",
    fontSize: 16,
    fontWeight: "600",
  },
  closeButton: {
    backgroundColor: "#666",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  closeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

