// API Route - Detector de Algoritmos de Cifrado
// Implementa el clasificador directamente en Vercel (sin backend separado)

import { NextRequest, NextResponse } from 'next/server';

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

    return NextResponse.json({
      algorithm,
      confidence: 0.80,
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
