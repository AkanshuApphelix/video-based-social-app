import { useState, useCallback, useEffect } from 'react';

export function useAudioInput() {
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [isMockAudio, setIsMockAudio] = useState(false);

  // Initialize audio context and analyser
  const initializeAudio = useCallback(async () => {
    try {
      // Try to get user media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const context = new AudioContext();
      const source = context.createMediaStreamSource(stream);
      const analyserNode = context.createAnalyser();

      analyserNode.fftSize = 256;
      source.connect(analyserNode);

      setAudioStream(stream);
      setAudioContext(context);
      setAnalyser(analyserNode);
      setIsMockAudio(false);
    } catch (error) {
      console.error('Error initializing audio:', error);
      // Fall back to mock audio for the hackathon demo
      setIsMockAudio(true);
      
      // Set a timer to simulate audio levels changing for the UI
      const mockAudioTimer = setInterval(() => {
        setAudioLevel(Math.random() * 0.5); // Random levels between 0-0.5
      }, 500);
      
      return () => clearInterval(mockAudioTimer);
    }
  }, []);

  // Start audio capture and analysis
  const startAudioCapture = useCallback(async () => {
    if (!audioContext && !isMockAudio) {
      await initializeAudio();
    }
  }, [audioContext, initializeAudio, isMockAudio]);

  // Stop audio capture
  const stopAudioCapture = useCallback(() => {
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
      setAudioStream(null);
    }
    if (audioContext) {
      audioContext.close();
      setAudioContext(null);
    }
    setAnalyser(null);
    setAudioLevel(0);
    setIsMockAudio(false);
  }, [audioStream, audioContext]);

  // Analyze audio levels
  useEffect(() => {
    if (!analyser && !isMockAudio) return;
    
    // If using real audio (not mock)
    if (analyser) {
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      let animationFrameId: number;

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(average / 255); // Normalize to 0-1
        animationFrameId = requestAnimationFrame(updateLevel);
      };

      updateLevel();

      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    }
    
    // For mock audio, we already set up the timer in initializeAudio
  }, [analyser, isMockAudio]);

  // Mock audio simulation for demo purposes
  useEffect(() => {
    if (isMockAudio) {
      const mockInterval = setInterval(() => {
        // Simulate speaking patterns with random levels
        const randomLevel = Math.random();
        if (randomLevel > 0.7) {
          setAudioLevel(randomLevel * 0.6); // Occasional peaks
        } else {
          setAudioLevel(randomLevel * 0.2); // Lower baseline
        }
      }, 300);
      
      return () => clearInterval(mockInterval);
    }
  }, [isMockAudio]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudioCapture();
    };
  }, [stopAudioCapture]);

  return {
    audioLevel,
    startAudioCapture,
    stopAudioCapture,
    isMockAudio
  };
}
//This is the code which I want to modify
