// src/hooks/useMediaDevices.ts - PROPERLY FIXED: Truly independent camera/mic controls
import { useState, useCallback, useRef, useEffect } from 'react';

interface MediaDevicesState {
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  isCameraOn: boolean;
  isMicOn: boolean;
  isScreenSharing: boolean;
  error: string | null;
}

export const useMediaDevices = () => {
  const [state, setState] = useState<MediaDevicesState>({
    localStream: null,
    screenStream: null,
    isCameraOn: false,
    isMicOn: false,
    isScreenSharing: false,
    error: null
  });

  // Separate refs for each device - TRULY INDEPENDENT
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const audioTrackRef = useRef<MediaStreamTrack | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // ✅ Helper: Rebuild stream from active tracks
  const rebuildStream = useCallback(() => {
    const tracks: MediaStreamTrack[] = [];
    
    if (videoTrackRef.current && videoTrackRef.current.readyState === 'live') {
      tracks.push(videoTrackRef.current);
    }
    
    if (audioTrackRef.current && audioTrackRef.current.readyState === 'live') {
      tracks.push(audioTrackRef.current);
    }

    const newStream = tracks.length > 0 ? new MediaStream(tracks) : new MediaStream();
    localStreamRef.current = newStream;

    setState(prev => ({
      ...prev,
      localStream: newStream
    }));

    return newStream;
  }, []);

  // ✅ Start ONLY camera - never touches microphone
  const startCamera = useCallback(async () => {
    try {
      // Request ONLY video permission
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        }
      });

      const videoTrack = videoStream.getVideoTracks()[0];
      
      if (!videoTrack) {
        throw new Error('No video track available');
      }

      // Store video track
      videoTrackRef.current = videoTrack;

      // Rebuild stream with current tracks
      rebuildStream();

      setState(prev => ({
        ...prev,
        isCameraOn: true,
        error: null
      }));

      return videoTrack;
    } catch (error: any) {
      console.error('Camera start error:', error);
      setState(prev => ({
        ...prev,
        isCameraOn: false,
        error: error.message || 'Failed to access camera'
      }));
      return null;
    }
  }, [rebuildStream]);

  // ✅ Start ONLY microphone - never touches camera
  const startMicrophone = useCallback(async () => {
    try {
      // Request ONLY audio permission
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      const audioTrack = audioStream.getAudioTracks()[0];
      
      if (!audioTrack) {
        throw new Error('No audio track available');
      }

      // Store audio track
      audioTrackRef.current = audioTrack;

      // Rebuild stream with current tracks
      rebuildStream();

      setState(prev => ({
        ...prev,
        isMicOn: true,
        error: null
      }));

      return audioTrack;
    } catch (error: any) {
      console.error('Microphone start error:', error);
      setState(prev => ({
        ...prev,
        isMicOn: false,
        error: error.message || 'Failed to access microphone'
      }));
      return null;
    }
  }, [rebuildStream]);

  // ✅ Stop camera completely - releases camera resource
  const stopCamera = useCallback(() => {
    const videoTrack = videoTrackRef.current;
    
    if (videoTrack) {
      videoTrack.stop();
      videoTrackRef.current = null;
    }

    rebuildStream();

    setState(prev => ({
      ...prev,
      isCameraOn: false
    }));
  }, [rebuildStream]);

  // ✅ Stop microphone completely - releases microphone resource
  const stopMicrophone = useCallback(() => {
    const audioTrack = audioTrackRef.current;
    
    if (audioTrack) {
      audioTrack.stop();
      audioTrackRef.current = null;
    }

    rebuildStream();

    setState(prev => ({
      ...prev,
      isMicOn: false
    }));
  }, [rebuildStream]);

  // ✅ Toggle camera - ONLY camera, NEVER mic
  const toggleCamera = useCallback(async () => {
    if (state.isCameraOn) {
      stopCamera();
    } else {
      await startCamera();
    }
  }, [state.isCameraOn, stopCamera, startCamera]);

  // ✅ Toggle microphone - ONLY mic, NEVER camera
  const toggleMicrophone = useCallback(async () => {
    if (state.isMicOn) {
      stopMicrophone();
    } else {
      await startMicrophone();
    }
  }, [state.isMicOn, stopMicrophone, startMicrophone]);

  // ✅ Cleanup on unmount - stop all tracks
  useEffect(() => {
    return () => {
      if (videoTrackRef.current) {
        videoTrackRef.current.stop();
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ✅ Start screen sharing
  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: 'always',
          displaySurface: 'monitor' as any,
        } as any,
        audio: false,
      });

      const screenTrack = stream.getVideoTracks()[0];

      if (!screenTrack) {
        throw new Error('No screen track available');
      }

      // Listen for user clicking "Stop sharing" in browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };

      setState(prev => ({
        ...prev,
        screenStream: stream,
        isScreenSharing: true,
        error: null
      }));

      return stream;
    } catch (error: any) {
      if (error.name !== 'NotAllowedError') {
        console.error('Screen share error:', error);
        setState(prev => ({
          ...prev,
          error: error.message || 'Failed to share screen'
        }));
      }
      return null;
    }
  }, []);

  // ✅ Stop screen sharing
  const stopScreenShare = useCallback(() => {
    setState(prev => {
      if (prev.screenStream) {
        prev.screenStream.getTracks().forEach(track => track.stop());
      }
      return {
        ...prev,
        screenStream: null,
        isScreenSharing: false
      };
    });
  }, []);

  // ✅ Toggle screen sharing
  const toggleScreenShare = useCallback(async () => {
    if (state.isScreenSharing) {
      stopScreenShare();
    } else {
      await startScreenShare();
    }
  }, [state.isScreenSharing, startScreenShare, stopScreenShare]);

  return {
    // Streams
    localStream: state.localStream,
    screenStream: state.screenStream,
    
    // States
    isCameraOn: state.isCameraOn,
    isMicOn: state.isMicOn,
    isScreenSharing: state.isScreenSharing,
    error: state.error,
    
    // Controls
    startCamera,        // Only starts camera
    toggleCamera,       // Only toggles camera
    toggleMicrophone,   // Only toggles microphone
    toggleScreenShare   // Only toggles screen share
  };
};