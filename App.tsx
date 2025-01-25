// Importación de React y el hook useState para manejar el estado
import React, { useState } from "react";
// Importación de componentes nativos de React Native
import { View, TouchableOpacity, Image, StyleSheet, Text, ScrollView, ActivityIndicator, TextInput } from "react-native";
// Importación del módulo ImagePicker de Expo para acceder a la cámara
import * as ImagePicker from "expo-image-picker";
// Importación de íconos de Material Community
import { MaterialCommunityIcons } from "@expo/vector-icons";
// Importación de Speech para texto a voz
import * as Speech from 'expo-speech';

// Interfaz que define la estructura de una predicción
interface Prediction {
  class_id: string;
  class_name: string;
  probability: number;
}

// Interfaz que define la estructura de la respuesta del servidor
interface PredictionResponse {
  predictions: Prediction[];
}

// Componente principal de la aplicación
export default function App() {
  // Estado para almacenar la URI de la imagen capturada
  const [imageUri, setImageUri] = useState<string | null>(null);
  // Estado para almacenar las predicciones recibidas
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  // Estado para controlar el indicador de carga
  const [isLoading, setIsLoading] = useState(false);
  // Estado para almacenar la IP del servidor
  const [serverIP, setServerIP] = useState('54.164.207.27');

  // Función para leer las predicciones
  const speakPredictions = async (predictions: Prediction[]) => {
    const textToSpeak = predictions
      .map(pred => `${pred.class_name} con ${(pred.probability * 100).toFixed(2)}% de probabilidad`)
      .join('. ');
    
    try {
      await Speech.speak(textToSpeak, {
        language: 'es',
        pitch: 1,
        rate: 1.2
      });
    } catch (error) {
      console.error('Error al reproducir audio:', error);
    }
  };

  // Función para enviar la imagen al servidor y procesar la respuesta
  const sendImageToServer = async (uri: string) => {
    try {
      setIsLoading(true);
      // Crear FormData para enviar la imagen
      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        type: 'image/jpeg',
        name: 'photo.jpg',
      } as any);

      // Realizar la petición POST al servidor
      const response = await fetch(`http://${serverIP}:8720/predict/`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const data: PredictionResponse = await response.json();
      setPredictions(data.predictions);
      // Leer las predicciones en voz alta
      await speakPredictions(data.predictions);
    } catch (error) {
      console.error('Error al enviar la imagen:', error);
      alert('Error al procesar la imagen');
    } finally {
      setIsLoading(false);
    }
  };

  // Función para tomar una foto usando la cámara
  const takePhoto = async () => {
    // Solicitar permisos de cámara
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      alert("Se requieren permisos para usar la cámara.");
      return;
    }

    // Lanzar la cámara
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    // Procesar el resultado si no se canceló la captura
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
      await sendImageToServer(result.assets[0].uri);
    }
  };

  // Renderizado del componente
  return (
    <View style={styles.container}>
      {/* Título de la aplicación */}
      <Text style={styles.title}>Analizar imagen</Text>

      {/* Input para la dirección IP del servidor */}
      <View style={styles.ipInputContainer}>
        <Text style={styles.ipLabel}>Dirección IP del servidor:</Text>
        <TextInput
          style={styles.ipInput}
          value={serverIP}
          onChangeText={setServerIP}
          placeholder="Ingrese la IP del servidor"
          keyboardType="numeric"
        />
      </View>

      {/* Botón para tomar foto */}
      <TouchableOpacity style={styles.button} onPress={takePhoto}>
        <MaterialCommunityIcons name="camera" size={24} color="white" />
        <Text style={styles.buttonText}>Tomar Foto</Text>
      </TouchableOpacity>

      {/* Mostrar la imagen si existe */}
      {imageUri && (
        <View style={styles.imageCard}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </View>
      )}

      {/* Mostrar loading o resultados */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loadingText}>Analizando imagen...</Text>
        </View>
      ) : (
        predictions.length > 0 && (
          <View style={styles.predictionsCard}>
            <Text style={styles.predictionsTitle}>Resultados del Análisis</Text>
            <ScrollView style={styles.predictionsContainer}>
              {predictions.map((prediction, index) => (
                <View key={index} style={styles.predictionItem}>
                  <View style={styles.predictionContent}>
                    <Text style={styles.predictionName}>
                      {prediction.class_name}
                    </Text>
                    <Text style={styles.predictionProb}>
                      {(prediction.probability * 100).toFixed(2)}%
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        )
      )}
    </View>
  );
}

// Estilos de la aplicación
const styles = StyleSheet.create({
  // Contenedor principal
  container: {
    flex: 1,
    backgroundColor: "#F5F6FA",
    padding: 10,
    paddingTop: 80,
  },
  // Estilo del título
  title: {
    fontSize: 22,
    marginBottom: 15,
    fontWeight: "bold",
    textAlign: 'center',
    color: '#2D3436',
  },
  // Estilo del contenedor del input IP
  ipInputContainer: {
    marginBottom: 15,
  },
  // Estilo de la etiqueta del input IP
  ipLabel: {
    fontSize: 16,
    marginBottom: 5,
    color: '#2D3436',
  },
  // Estilo del input IP
  ipInput: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E1E4E8',
  },
  // Estilo de la tarjeta que contiene la imagen
  imageCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 10,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  // Estilo de la imagen
  image: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  // Estilo del botón
  button: {
    backgroundColor: '#6C63FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
    shadowColor: "#6C63FF",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 4,
  },
  // Estilo del texto del botón
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600'
  },
  // Estilo del contenedor de carga
  loadingContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  // Estilo del texto de carga
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6C63FF',
    fontWeight: '500'
  },
  // Estilo de la tarjeta de predicciones
  predictionsCard: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 7,
    marginTop: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 3.84,
    elevation: 3,
  },
  // Estilo del contenedor de predicciones
  predictionsContainer: {
    maxHeight: 250,
  },
  // Estilo del título de predicciones
  predictionsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#2D3436',
    textAlign: 'center',
  },
  // Estilo del item de predicción
  predictionItem: {
    marginBottom: 10,
  },
  // Estilo del contenido de predicción
  predictionContent: {
    backgroundColor: '#F8F9FE',
    padding: 13,
    borderRadius: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  // Estilo del nombre de predicción
  predictionName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2D3436',
    textTransform: 'capitalize',
  },
  // Estilo de la probabilidad de predicción
  predictionProb: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6C63FF',
  }
});
