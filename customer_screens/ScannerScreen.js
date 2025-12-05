import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  PermissionsAndroid,
  Platform
} from "react-native";
import { Camera, CameraType } from "react-native-camera-kit";
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/apiService';
import { ThemedAlert, showThemedAlert } from '../components/ThemedAlert';

export default function ScannerScreen({ navigation }) {
  const [showCamera, setShowCamera] = useState(true);
  const [manualCode, setManualCode] = useState("");
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const [alert, setAlert] = useState({ visible: false, title: '', message: '', buttons: [] });

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Camera Permission',
            message: 'This app needs camera access to scan QR codes',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );

        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
        } else {
          setHasPermission(false);
          showThemedAlert(setAlert, 'Permission Denied', 'Camera permission is required to scan QR codes');
        }
      } catch (err) {
        console.error('Permission error:', err);
        setHasPermission(false);
      }
    } else {
      setHasPermission(true);
    }
  };

  const processQRCode = async (qrData) => {
    if (processing) return;

    setProcessing(true);

    try {
      const userDataStr = await AsyncStorage.getItem('@app_user');
      if (!userDataStr) {
        showThemedAlert(setAlert, 'Error', 'Please log in first', [
          { text: 'OK', onPress: () => navigation.navigate('SignIn') }
        ]);
        return;
      }

      const userData = JSON.parse(userDataStr);
      const customerId = userData.user_id;

      let transactionData;
      try {
        transactionData = typeof qrData === 'string' ? JSON.parse(qrData) : qrData;
      } catch (e) {
        showThemedAlert(setAlert, 'Error', 'Invalid QR code format');
        setProcessing(false);
        setScanned(false);
        return;
      }

      const response = await apiService.processScannedQR(customerId, transactionData);

      if (response.success) {
        showThemedAlert(
          setAlert,
          'Transaction Successful! 🎉',
          `Total: ₱${response.transaction.total_amount}\n` +
          `Points Earned: ${response.transaction.total_points}\n` +
          `Reference: ${response.transaction.reference_number}`,
          [
            {
              text: 'Scan Another',
              onPress: () => {
                setScanned(false);
                setProcessing(false);
              }
            },
            {
              text: 'Done',
              onPress: () => {
                setScanned(false);
                setProcessing(false);
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        showThemedAlert(setAlert, 'Error', response.message || 'Transaction failed');
        setScanned(false);
        setProcessing(false);
      }

    } catch (error) {
      console.error('QR Processing Error:', error);
      showThemedAlert(setAlert, 'Error', error.message || 'Failed to process transaction');
      setScanned(false);
      setProcessing(false);
    }
  };

  // ✔ FINAL CLEAN HANDLER
  const handleBarcodeScan = (event) => {
    if (scanned || processing) return;

    try {
      const scannedDataString = event?.nativeEvent?.codeStringValue;
      if (!scannedDataString) {
        showThemedAlert(setAlert, 'Error', 'Invalid or unreadable QR code.');
        setScanned(false);
        return;
      }

      setScanned(true);
      processQRCode(scannedDataString);

    } catch (error) {
      console.log("QR Scan Error:", error);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualCode.trim()) {
      showThemedAlert(setAlert, "Error", "Please enter a code");
      return;
    }

    setProcessing(true);

    try {
      const userDataStr = await AsyncStorage.getItem('@app_user');
      if (!userDataStr) {
        setProcessing(false);
        showThemedAlert(setAlert, 'Error', 'Please log in first', [
          { text: 'OK', onPress: () => navigation.navigate('SignIn') }
        ]);
        return;
      }

      const userData = JSON.parse(userDataStr);
      const customerId = userData.user_id;

      const response = await apiService.processManualCode(customerId, manualCode.trim());

      if (response.success) {
        showThemedAlert(
          setAlert,
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
        showThemedAlert(setAlert, 'Error', response.message || 'Transaction failed');
        setProcessing(false);
      }
    } catch (error) {
      console.error('Manual code error:', error);
      showThemedAlert(setAlert, 'Error', error.message || 'Failed to process code');
      setProcessing(false);
    }
  };

  // PERMISSION STATES
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Requesting camera permission...</Text>
        <ThemedAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttons={alert.buttons}
          onDismiss={() => setAlert({ ...alert, visible: false })}
        />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera permission denied</Text>
        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Go Back</Text>
        </TouchableOpacity>
        <ThemedAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttons={alert.buttons}
          onDismiss={() => setAlert({ ...alert, visible: false })}
        />
      </View>
    );
  }

  // CAMERA SCREEN
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Camera
          style={styles.camera}
          cameraType={CameraType.Back}
          scanBarcode={true}
          onReadCode={(event) => handleBarcodeScan(event)}
          showFrame={true}
          laserColor="red"
          frameColor="white"
          scanThrottleDelay={500}
          focusMode="on"
          zoomMode="on"
        />

        <View style={styles.cameraOverlay}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
              <Text style={styles.backButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.centerContent}>
            {processing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color="#FFF" />
                <Text style={styles.processingText}>Processing transaction...</Text>
              </View>
            ) : (
              <Text style={styles.instructionText}>
                {scanned ? "Code Scanned!" : "Point camera at QR code"}
              </Text>
            )}
          </View>

          <View style={styles.bottomBar}>
            <TouchableOpacity style={styles.manualButton} onPress={() => setShowCamera(false)}>
              <Text style={styles.manualButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ThemedAlert
          visible={alert.visible}
          title={alert.title}
          message={alert.message}
          buttons={alert.buttons}
          onDismiss={() => setAlert({ ...alert, visible: false })}
        />
      </View>
    );
  }

  // MANUAL ENTRY SCREEN
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Manual Entry</Text>

      <View style={styles.manualEntry}>
        <TextInput
          style={styles.input}
          placeholder="XXXXXX"
          value={manualCode}
          onChangeText={setManualCode}
          maxLength={6}
          autoCapitalize="characters"
        />

        <TouchableOpacity style={styles.scanButton} onPress={handleManualSubmit}>
          <Text style={styles.scanButtonText}>Submit Code</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.switchButton} onPress={() => setShowCamera(true)}>
        <Text style={styles.switchButtonText}>📷 Use Camera Instead</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
      <ThemedAlert
        visible={alert.visible}
        title={alert.title}
        message={alert.message}
        buttons={alert.buttons}
        onDismiss={() => setAlert({ ...alert, visible: false })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  topBar: { paddingTop: 50, paddingHorizontal: 20 },
  backButton: { backgroundColor: "rgba(0,0,0,0.6)", padding: 10, borderRadius: 10 },
  backButtonText: { color: "#FFF", fontSize: 16 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  instructionText: {
    color: "#FFF", fontSize: 18, backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8
  },
  processingContainer: {
    backgroundColor: "rgba(0,0,0,0.8)", paddingHorizontal: 40,
    paddingVertical: 30, borderRadius: 12, alignItems: "center"
  },
  processingText: { color: "#FFF", fontSize: 16, marginTop: 15 },
  bottomBar: { paddingBottom: 50, alignItems: "center" },
  manualButton: { backgroundColor: "#7D0006", padding: 14, borderRadius: 8 },
  manualButtonText: { color: "#FFF", fontSize: 16 },
  container: { flex: 1, padding: 20, backgroundColor: "#F5F5F5" },
  title: { fontSize: 28, fontWeight: "bold", color: "#7D0006", textAlign: "center" },
  manualEntry: {
    backgroundColor: "#FFF", padding: 20, borderRadius: 12,
    marginVertical: 20, elevation: 3
  },
  input: {
    borderWidth: 2, borderColor: "#7D0006", borderRadius: 8, padding: 16,
    fontSize: 24, textAlign: "center", letterSpacing: 4, color: "#000"
  },
  scanButton: {
    backgroundColor: "#7D0006", padding: 14, borderRadius: 8, alignItems: "center",
    marginTop: 10
  },
  scanButtonText: { color: "#FFF", fontSize: 16 },
  switchButton: {
    backgroundColor: "#FFF", padding: 14, borderRadius: 8, alignItems: "center",
    borderWidth: 2, borderColor: "#7D0006", marginBottom: 10
  },
  switchButtonText: { color: "#7D0006", fontSize: 16 },
  closeButton: {
    backgroundColor: "#666", padding: 14, borderRadius: 8, alignItems: "center"
  },
  closeButtonText: { color: "#FFF", fontSize: 16 }
});
