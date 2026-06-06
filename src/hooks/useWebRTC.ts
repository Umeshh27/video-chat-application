import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

const STUN_SERVER = process.env.NEXT_PUBLIC_STUN_SERVER || 'stun:stun.l.google.com:19302';

export interface ChatMessage {
  senderId: string;
  message: string;
  isSelf: boolean;
}

export function useWebRTC(roomId: string, localStream: MediaStream | null) {
  const [peers, setPeers] = useState<{ [id: string]: MediaStream }>({});
  const [socket, setSocket] = useState<Socket | null>(null);
  const [status, setStatus] = useState<'waiting' | 'connecting' | 'connected'>('waiting');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const peerConnections = useRef<{ [id: string]: RTCPeerConnection }>({});
  const socketRef = useRef<Socket | null>(null);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => [...prev, msg]);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (socketRef.current) {
      socketRef.current.emit('chat-message', { roomId, message });
      addMessage({ senderId: 'Me', message, isSelf: true });
    }
  }, [roomId, addMessage]);

  useEffect(() => {
    if (!localStream) return;

    // Connect to signaling server
    const s = io(window.location.origin);
    setSocket(s);
    socketRef.current = s;

    s.on('connect', () => {
      s.emit('join-room', roomId);
    });

    s.on('user-joined', async (userId: string) => {
      // Create a new RTCPeerConnection as the caller
      const pc = createPeerConnection(userId, s, localStream);
      peerConnections.current[userId] = pc;
      setStatus('connecting');

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      s.emit('offer', {
        target: userId,
        caller: s.id,
        sdp: pc.localDescription
      });
    });

    s.on('offer', async (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
      const { caller, sdp } = payload;
      const pc = createPeerConnection(caller, s, localStream);
      peerConnections.current[caller] = pc;
      setStatus('connecting');

      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      s.emit('answer', {
        target: caller,
        caller: s.id,
        sdp: pc.localDescription
      });
    });

    s.on('answer', async (payload: { target: string, caller: string, sdp: RTCSessionDescriptionInit }) => {
      const { caller, sdp } = payload;
      const pc = peerConnections.current[caller];
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        setStatus('connected');
      }
    });

    s.on('ice-candidate', async (payload: { caller: string, candidate: RTCIceCandidateInit }) => {
      const pc = peerConnections.current[payload.caller];
      if (pc && payload.candidate) {
        await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
      }
    });

    s.on('user-disconnected', (userId: string) => {
      if (peerConnections.current[userId]) {
        peerConnections.current[userId].close();
        delete peerConnections.current[userId];
        
        setPeers(prev => {
          const newPeers = { ...prev };
          delete newPeers[userId];
          return newPeers;
        });

        if (Object.keys(peerConnections.current).length === 0) {
          setStatus('waiting');
        }
      }
    });

    s.on('chat-message', (payload: { senderId: string, message: string }) => {
      addMessage({ senderId: payload.senderId, message: payload.message, isSelf: false });
    });

    return () => {
      Object.values(peerConnections.current).forEach(pc => pc.close());
      peerConnections.current = {};
      s.disconnect();
    };
  }, [localStream, roomId, addMessage]);

  function createPeerConnection(userId: string, s: Socket, stream: MediaStream) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: STUN_SERVER }]
    });

    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        s.emit('ice-candidate', {
          target: userId,
          candidate: event.candidate
        });
      }
    };

    pc.ontrack = (event) => {
      setPeers(prev => ({
        ...prev,
        [userId]: event.streams[0]
      }));
      setStatus('connected');
    };

    return pc;
  }

  const hangup = useCallback(() => {
    Object.values(peerConnections.current).forEach(pc => pc.close());
    peerConnections.current = {};
    setPeers({});
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  }, []);

  return { peers, status, messages, sendMessage, hangup };
}
