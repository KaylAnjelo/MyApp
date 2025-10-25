import React, { useState } from "react";
import { View, Text, Button, StyleSheet } from "react-native";
import { Camera } from "expo-camera";

export default function ScannerScreen() {
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [open, setOpen] = useState(true); // auto-open camera

  if (!permission) {
    return (
      <View style={styles.center}>
        <Text>Loading camera permissions...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>We need camera access</Text>
        <Button onPress={() => requestPermission()} title="Grant Permission" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      {open ? (
        <Camera style={{ flex: 1 }} type={Camera.Constants.Type.back} />
      ) : (
        <View style={styles.center}>
          <Text style={styles.text}>📸 Ready to open camera</Text>
          <Button title="Open Camera" onPress={() => setOpen(true)} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 18, fontWeight: "bold" },
});

