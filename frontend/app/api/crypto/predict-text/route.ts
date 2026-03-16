// API Route - Detector de Algoritmos de Cifrado
// Implementa el clasificador y descifrador directamente en Vercel (sin backend separado)

import { NextRequest, NextResponse } from 'next/server';

// Función para descifrar Base64
function decodeBase64(text: string): string | null {
  try {
    return atob(text);
  } catch (e) {
    return null;
  }
}

// Función para descifrar César con diferentes shifts
function decodeCaesar(text: string): { shift: number; decoded: string } | null {
  for (let shift = 1; shift <= 25; shift++) {
    let decoded = '';
    for (const char of text) {
      if (char >= 'a' && char <= 'z') {
        decoded += String.fromCharCode(((char.charCodeAt(0) - 97 - shift + 26) % 26) + 97);
      } else if (char >= 'A' && char <= 'Z') {
        decoded += String.fromCharCode(((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65);
      } else {
        decoded += char;
      }
    }
    // Si el texto descifrado contiene palabras comunes en español, es probablemente el shift correcto
    if (decoded.includes('el ') || decoded.includes('la ') || decoded.includes('es ') || 
        decoded.includes('en ') || decoded.includes('un ') || decoded.includes('de ')) {
      return { shift, decoded };
    }
  }
  return null;
}

// Función para descifrar XOR con claves comunes
function decodeXOR(hex: string): string | null {
  const commonKeys = ['4b6579', '6b6579', '4b4559', 'key', 'Key', 'KEY'];
  
  for (const keyStr of commonKeys) {
    try {
      let key: number[];
      if (keyStr.length <= 3) {
        // ASCII key
        key = Array.from(keyStr).map(c => c.charCodeAt(0));
      } else {
        // Hex key
        key = [];
        for (let i = 0; i < keyStr.length; i += 2) {
          key.push(parseInt(keyStr.substr(i, 2), 16));
        }
      }
      
      let decoded = '';
      for (let i = 0; i < hex.length; i += 2) {
        const byte = parseInt(hex.substr(i, 2), 16);
        const keyByte = key[Math.floor(i / 2) % key.length];
        decoded += String.fromCharCode(byte ^ keyByte);
      }
      
      // Verificar si el resultado es texto legible
      if (/^[\x20-\x7E]+$/.test(decoded) && 
          (decoded.includes('el ') || decoded.includes('la ') || decoded.includes('es ') ||
           decoded.includes('en ') || decoded.includes('un ') || decoded.includes('de '))) {
        return decoded;
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

function simpleCryptoClassifier(features: any): string {
  const entropia = features.entropia || 0;
  const tienePadding = features.tiene_padding || 0;
  const proporcionAlpha = features.proporcion_alpha || 0;
  const freqEspacios = features.freq_espacios || 0;
  const ratioUnique = features.ratio_unique || 0;

  if (tienePadding === 1 && proporcionAlpha > 0.9 && entropia > 3.5) {
    return 'Base64';
  } else if (entropia > 4.5 && ratioUnique > 0.7 && freqEspacios < 0.05) {
    return 'AES';
  } else if (entropia > 4.0 && proporcionAlpha < 0.5) {
    return 'DES';
  } else if (freqEspacios > 0.1) {
    return 'Sin cifrar';
  } else {
    return 'Desconocido';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const text = body.text || '';

    if (text.length === 0) {
      return NextResponse.json({ error: 'Texto vacío' }, { status: 400 });
    }

    const longitud = text.length;
    const charFreq: { [key: string]: number } = {};
    
    for (const char of text) {
      charFreq[char] = (charFreq[char] || 0) + 1;
    }

    let entropia = 0;
    for (const freq of Object.values(charFreq)) {
      const p = freq / longitud;
      if (p > 0) {
        entropia -= p * Math.log2(p);
      }
    }

    const mayusculas = Array.from(text).filter(c => c === c.toUpperCase() && c !== c.toLowerCase()).length;
    const minusculas = Array.from(text).filter(c => c === c.toLowerCase() && c !== c.toUpperCase()).length;
    const numeros = Array.from(text).filter(c => /\d/.test(c)).length;
    const espacios = Array.from(text).filter(c => c === ' ').length;
    const alpha = Array.from(text).filter(c => /[a-zA-Z]/.test(c)).length;

    const features = {
      longitud,
      entropia,
      freq_mayusculas: mayusculas / longitud,
      freq_minusculas: minusculas / longitud,
      freq_numeros: numeros / longitud,
      freq_espacios: espacios / longitud,
      freq_especiales: (longitud - alpha - numeros - espacios) / longitud,
      tiene_padding: text.endsWith('=') || text.endsWith('==') ? 1 : 0,
      proporcion_alpha: alpha / longitud,
      unique_chars: Object.keys(charFreq).length,
      ratio_unique: Object.keys(charFreq).length / longitud
    };

    const algorithm = simpleCryptoClassifier(features);
    let decoded_text: string | null = null;

        // SIEMPRE intentar descifrar con todos los métodos
    let decoded_text: string | null = null;

    // 1. Intentar Base64 primero
    decoded_text = decodeBase64(text);
    
    // 2. Si no es Base64, intentar César
    if (!decoded_text) {
      const cesarResult = decodeCaesar(text);
      if (cesarResult) {
        decoded_text = cesarResult.decoded;
      }
    }
    
    // 3. Si no es César, intentar XOR (solo si es hex)
    if (!decoded_text && /^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
      decoded_text = decodeXOR(text);
    }

    // 4. Si nada funcionó, devolver el texto original si es "Sin cifrar"
    if (!decoded_text && algorithm === 'Sin cifrar') {
      decoded_text = text;
    }return NextResponse.json({
      algorithm,
      confidence: 0.80,
      decoded_text,
      features
    });

  } catch (error) {
    console.error('Error en la API:', error);
    return NextResponse.json(
      { error: 'Error procesando la solicitud' },
      { status: 500 }
    );
  }
}
