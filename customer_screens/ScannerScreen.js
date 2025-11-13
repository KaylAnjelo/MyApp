import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { Camera, CameraType } from "react-native-camera-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';

export default function ScannerScreen({ navigation }) {
  const [showCamera, setShowCamera] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);

  const processQRCode = async (qrData) => {
    if (processing) return;
    
    setProcessing(true);
    
    try {
      // Get customer ID from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('@app_user');
      if (!userDataStr) {
        Alert.alert('Error', 'Please log in first');
        navigation.navigate('SignIn');
        return;
      }
      
      const userData = JSON.parse(userDataStr);
      const customerId = userData.user_id;

      // Parse QR data if it's a string
      let transactionData;
      try {
        transactionData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (e) {
        Alert.alert('Error', 'Invalid QR code format');
        setProcessing(false);
        setScanned(false);
        return;
      }

      // Process the transaction
      const response = await apiService.processScannedQR(customerId, transactionData);
      
      if (response.success) {
        Alert.alert(
          'Transaction Successful! 🎉',
          `Total: ₱${response.transaction.total_amount}\n` +
          `Points Earned: ${response.transaction.total_points}\n` +
          `Reference: ${response.transaction.reference_number}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setScanned(false);
                setProcessing(false);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Transaction failed');
        setScanned(false);
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error processing QR:', error);
      Alert.alert('Error', error.message || 'Failed to process transaction');
      setScanned(false);
      setProcessing(false);
    }
  };

  const handleBarcodeScan = (event) => {
    if (scanned || processing) return;
    
    setScanned(true);
    const code = event.nativeEvent.codeStringValue;
    processQRCode(code);
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      Alert.alert("Error", "Please enter a code");
      return;
    }

    setProcessing(true);

    try {
      // Get customer ID from AsyncStorage
      const userDataStr = await AsyncStorage.getItem('@app_user');
      if (!userDataStr) {
        setProcessing(false);
        Alert.alert('Error', 'Please log in first', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn')
          }
        ]);
        return;
      }
      
      const userData = JSON.parse(userDataStr);
      const customerId = userData.user_id;

      console.log('Processing manual code for customer:', customerId, 'Code:', manualCode.trim());
      console.log('apiService.processManualCode type:', typeof apiService.processManualCode);

      // Check if method exists
      if (typeof apiService.processManualCode !== 'function') {
        console.error('processManualCode is not a function!');
        console.log('Available apiService methods:', Object.keys(apiService));
        Alert.alert('Error', 'Method not available. Please restart the app.');
        setProcessing(false);
        return;
      }

      // Process manual code
      const response = await apiService.processManualCode(customerId, manualCode.trim());
      
      console.log('Manual code response:', response);
      
      if (response.success) {
        Alert.alert(
          'Transaction Successful! 🎉',
          `Total: ₱${response.transaction.total_amount}\n` +
          `Points Earned: ${response.transaction.total_points}\n` +
          `Reference: ${response.transaction.reference_number}`,
          [
            {
              text: 'OK',
              onPress: () => {
                setManualCode('');
                setProcessing(false);
                setShowCamera(true);
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Transaction failed');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Error processing manual code:', error);
      Alert.alert('Error', error.message || 'Failed to process code');
      setProcessing(false);
    }
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
            {processing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
                <Text style={styles.processingText}>Processing transaction...</Text>
              </View>
            ) : (
              <Text style={styles.instructionText}>
                {scanned ? "Code Scanned!" : "Point camera at QR code or barcode"}
              </Text>
            )}
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
        <Text style={styles.inputLabel}>Enter 6-Digit Code</Text>
        <TextInput
          style={styles.input}
          placeholder="XXXXXX"
          placeholderTextColor="#CCC"
          value={manualCode}
          onChangeText={setManualCode}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
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
  processingContainer: {
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 40,
    paddingVertical: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  processingText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginTop: 15,
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
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 10,
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
    borderWidth: 2,
    borderColor: "#7D0006",
    borderRadius: 8,
    padding: 16,
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 15,
    backgroundColor: "#FFF",
    textAlign: "center",
    letterSpacing: 4,
    color: "#000",
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
