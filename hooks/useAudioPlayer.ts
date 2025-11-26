
import { useState, useRef, useCallback, useEffect } from 'react';

// Base64 decode function
function decode(base64: string): Uint8Array {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Raw PCM to AudioBuffer decode function
async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const useAudioPlayer = () => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceRef = useRef<AudioBufferSourceNode | null>(null);

    const play = useCallback(async (base64Audio: string) => {
        if (sourceRef.current) {
            sourceRef.current.stop();
        }

        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
            const AudioCtxt = window.AudioContext || (window as any).webkitAudioContext;
            audioContextRef.current = new AudioCtxt({ sampleRate: 24000 });
        }
        
        const context = audioContextRef.current;
        await context.resume();

        const audioBytes = decode(base64Audio);
        const audioBuffer = await decodeAudioData(audioBytes, context, 24000, 1);
        
        const source = context.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(context.destination);
        
        source.onended = () => {
            setIsPlaying(false);
            sourceRef.current = null;
        };

        source.start();
        sourceRef.current = source;
        setIsPlaying(true);
    }, []);

    const stop = useCallback(() => {
        if (sourceRef.current) {
            sourceRef.current.stop();
        }
    }, []);

    useEffect(() => {
        return () => {
            if (sourceRef.current) {
                sourceRef.current.stop();
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    return { isPlaying, play, stop };
};
