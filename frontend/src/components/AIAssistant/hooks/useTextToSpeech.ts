import { useState, useRef, useCallback, useEffect } from 'react';
import api from '../../api';

interface UseTextToSpeechProps {
  enabled: boolean;
}

export const useTextToSpeech = ({ enabled }: UseTextToSpeechProps) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsAvailable, setTtsAvailable] = useState(false);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check TTS availability on mount
  useEffect(() => {
    const checkTTS = async () => {
      try {
        const status = await api.getTTSStatus();
        setTtsAvailable(status.available);
      } catch {
        setTtsAvailable(false);
      }
    };
    checkTTS();
  }, []);

  const speakText = useCallback(async (text: string) => {
    if (!enabled || !text) return;

    // Stop any current speech
    stopSpeaking();

    // Try ElevenLabs first if available
    if (ttsAvailable) {
      try {
        setIsSpeaking(true);
        const audioBlob = await api.textToSpeech({ text });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        audioRef.current = new Audio(audioUrl);
        audioRef.current.onended = () => {
          setIsSpeaking(false);
          URL.revokeObjectURL(audioUrl);
        };
        audioRef.current.onerror = () => {
          setIsSpeaking(false);
          // Fallback to browser TTS
          speakWithBrowser(text);
        };
        await audioRef.current.play();
        return;
      } catch (error) {
        console.error('ElevenLabs TTS failed:', error);
        // Fallback to browser TTS
        speakWithBrowser(text);
      }
    } else {
      speakWithBrowser(text);
    }
  }, [enabled, ttsAvailable]);

  const speakWithBrowser = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      speechSynthRef.current = new SpeechSynthesisUtterance(text);
      speechSynthRef.current.rate = 1.0;
      speechSynthRef.current.pitch = 1.0;
      speechSynthRef.current.onend = () => setIsSpeaking(false);
      speechSynthRef.current.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(speechSynthRef.current);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    // Stop browser speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Stop audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsSpeaking(false);
  }, []);

  return {
    isSpeaking,
    ttsAvailable,
    speakText,
    stopSpeaking,
  };
};

export default useTextToSpeech;
