from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import math

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def simple_crypto_classifier(features):
    entropia = features.get('entropia', 0)
    tiene_padding = features.get('tiene_padding', 0)
    proporcion_alpha = features.get('proporcion_alpha', 0)
    freq_espacios = features.get('freq_espacios', 0)
    ratio_unique = features.get('ratio_unique', 0)
    
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
async def predict_crypto(request: Request):
    try:
        data = await request.json()
        prediction = simple_crypto_classifier(data)
        return {"algorithm": prediction, "confidence": 0.85}
    except Exception as e:
        return {"error": str(e)}

@app.post("/api/crypto/predict-text")
async def predict_from_text(request: Request):
    try:
        data = await request.json()
        text = data.get('text', '')
        
        if len(text) == 0:
            return {"error": "Texto vacio"}
        
        longitud = len(text)
        char_freq = {}
        for char in text:
            char_freq[char] = char_freq.get(char, 0) + 1
        
        entropia = 0
        for freq in char_freq.values():
            p = freq / longitud
            if p > 0:
                entropia -= p * math.log2(p)
        
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
            'tiene_padding': 1 if text.endswith('=') or text.endswith('==') else 0,
            'proporcion_alpha': alpha / longitud,
            'unique_chars': len(char_freq),
            'ratio_unique': len(char_freq) / longitud
        }
        
        prediction = simple_crypto_classifier(features)
        return {"algorithm": prediction, "confidence": 0.80, "features": features}
    except Exception as e:
        return {"error": str(e)}
