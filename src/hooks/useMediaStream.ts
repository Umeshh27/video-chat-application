import { useState, useEffect, useCallback, useRef } from 'react';

export function useMediaStream() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;
    async function initStream() {
      if (streamRef.current) return;
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (mounted) {
          streamRef.current = mediaStream;
          setStream(mediaStream);
        } else {
          mediaStream.getTracks().forEach(t => t.stop());
        }
      } catch (err) {
        console.error('Failed to get media stream', err);
      }
    }
    initStream();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleMute = useCallback(() => {
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  }, [stream]);

  const toggleCamera = useCallback(() => {
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  }, [stream]);

  const stopTracks = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      streamRef.current = null;
    }
  }, [stream]);

  return { stream, isMuted, isCameraOff, toggleMute, toggleCamera, stopTracks };
}
