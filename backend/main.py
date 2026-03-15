from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import math

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CryptoFeatures(BaseModel):
    longitud: float
    entropia: float
    freq_mayusculas: float
    freq_minusculas: float
    freq_numeros: float
    freq_espacios: float
    freq_especiales: float
    rango_ascii_min: float
    rango_ascii_max: float
    media_ascii: float
    varianza_ascii: float
    freq_char_top1: float
    freq_char_top2: float
    tiene_padding: int
    proporcion_alpha: float
    unique_chars: int
    ratio_unique: float

class TextInput(BaseModel):
    text: str

def simple_crypto_classifier(features: dict) -> str:
    """
    Clasificador simple basado en reglas para detectar algoritmos de cifrado
    """
    entropia = features['entropia']
    tiene_padding = features['tiene_padding']
    proporcion_alpha = features['proporcion_alpha']
    freq_espacios = features['freq_espacios']
    ratio_unique = features['ratio_unique']
    
    # Reglas simples basadas en características típicas
    if tiene_padding == 1 and proporcion_alpha > 0.9 and entropia > 3.5:
        return 'Base64'
    elif entropia > 4.5 and ratio_unique > 0.7 and freq_espacios < 0.05:
        return 'AES'
    elif entropia > 4.0 and proporcion_alpha < 0.5:
        return 'DES'
    elif freq_espacios > 0.1:
        return 'Sin cifrar'
    else:
        return 'Desconocido'

@app.get("/")
async def root():
    return {"message": "Detector de Algoritmos de Cifrado API", "status": "active"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.post("/api/crypto/predict")
async def predict_crypto(features: CryptoFeatures):
    try:
        features_dict = features.dict()
        prediction = simple_crypto_classifier(features_dict)
        return {
            "algorithm": prediction,
            "confidence": 0.85
        }
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/crypto/predict-text")
async def predict_from_text(input_data: TextInput):
    try:
        text = input_data.text
        
        # Calcular características básicas del texto
        longitud = len(text)
        if longitud == 0:
            return {"error": "Texto vacío"}
        
        # Calcular entropía
        char_freq = {}
        for char in text:
            char_freq[char] = char_freq.get(char, 0) + 1
        
        entropia = 0
        for freq in char_freq.values():
            p = freq / longitud
            if p > 0:
                entropia -= p * math.log2(p)
        
        # Análisis simple del texto
        mayusculas = sum(1 for c in text if c.isupper())
        minusculas = sum(1 for c in text if c.islower())
        numeros = sum(1 for c in text if c.isdigit())
        espacios = text.count(' ')
        alpha = sum(1 for c in text if c.isalpha())
        
        features = {
            'longitud': longitud,
            'entropia': entropia,
            'freq_mayusculas': mayusculas / longitud,
            'freq_minusculas': minusculas / longitud,
            'freq_numeros': numeros / longitud,
            'freq_espacios': espacios / longitud,
            'freq_especiales': (longitud - alpha - numeros - espacios) / longitud,
            'rango_ascii_min': min(ord(c) for c in text),
            'rango_ascii_max': max(ord(c) for c in text),
            'media_ascii': sum(ord(c) for c in text) / longitud,
            'varianza_ascii': 0,
            'freq_char_top1': max(char_freq.values()) / longitud if char_freq else 0,
            'freq_char_top2': sorted(char_freq.values(), reverse=True)[1] / longitud if len(char_freq) > 1 else 0,
            'tiene_padding': 1 if text.endswith('=') or text.endswith('==') else 0,
            'proporcion_alpha': alpha / longitud,
            'unique_chars': len(char_freq),
            'ratio_unique': len(char_freq) / longitud
        }
        
        prediction = simple_crypto_classifier(features)
        return {
            "algorithm": prediction,
            "confidence": 0.80,
            "features": features
        }
    except Exception as e:
        return {"error": str(e)}
