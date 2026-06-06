'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useMediaStream } from '@/hooks/useMediaStream';
import { useWebRTC } from '@/hooks/useWebRTC';

const VideoPlayer = ({ stream, isLocal = false, ...props }: any) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={isLocal}
      className={`w-full h-full object-cover bg-gray-900 ${isLocal ? 'scale-x-[-1]' : ''}`}
      {...props}
    />
  );
};

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomId = params.roomId as string;
  const [chatInput, setChatInput] = useState('');

  const { stream, isMuted, isCameraOff, toggleMute, toggleCamera, stopTracks } = useMediaStream();
  const { peers, status, messages, sendMessage, hangup } = useWebRTC(roomId, stream);

  const handleHangup = () => {
    hangup();
    stopTracks();
    router.push('/');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim()) {
      sendMessage(chatInput);
      setChatInput('');
    }
  };

  const peerIds = Object.keys(peers);

  return (
    <div className="flex h-screen bg-gray-950 text-white font-sans overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Header / Status */}
        <div className="absolute top-4 left-4 z-10 bg-black/50 backdrop-blur px-4 py-2 rounded-full border border-gray-800 flex items-center gap-4">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-yellow-500' : 'bg-blue-500 animate-pulse'}`}></span>
            {status === 'waiting' && <span data-test-id="status-waiting">Waiting for others...</span>}
            {status === 'connecting' && <span data-test-id="status-connecting">Connecting...</span>}
            {status === 'connected' && <span data-test-id="status-connected">Connected</span>}
          </span>
          <div className="w-px h-4 bg-gray-700"></div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Room URL copied to clipboard!');
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold uppercase tracking-wider"
          >
            Copy Link
          </button>
        </div>

        {/* Video Grid */}
        <div className="flex-1 p-4 md:p-8 flex items-center justify-center">
          <div data-test-id="remote-video-container" className={`grid gap-4 w-full h-full max-h-[80vh] ${peerIds.length === 0 ? 'grid-cols-1' : peerIds.length === 1 ? 'grid-cols-1' : peerIds.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'}`}>
            {peerIds.map(peerId => (
              <div key={peerId} className="relative overflow-hidden rounded-xl border border-gray-800 bg-gray-900 shadow-2xl flex items-center justify-center">
                 <VideoPlayer stream={peers[peerId]} />
              </div>
            ))}
            {peerIds.length === 0 && (
              <div className="flex items-center justify-center text-gray-500 w-full h-full border-2 border-dashed border-gray-800 rounded-xl bg-gray-900/50">
                 <div className="text-center">
                   <p className="text-xl mb-2 text-gray-300">Room is empty</p>
                   <p className="text-sm">Share the URL with others to start chatting.</p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* Local Video PIP */}
        <div className="absolute bottom-28 right-4 md:right-8 w-32 h-48 md:w-48 md:h-64 rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl z-20 bg-gray-900">
           {stream ? (
             <VideoPlayer stream={stream} isLocal={true} data-test-id="local-video" />
           ) : (
             <div className="w-full h-full flex items-center justify-center">
               <span className="text-xs text-gray-500">Loading...</span>
             </div>
           )}
        </div>

        {/* Controls */}
        <div className="h-24 flex items-center justify-center gap-4 bg-gray-950/80 backdrop-blur border-t border-gray-900 pb-2 px-4">
           <button 
             data-test-id="mute-mic-button"
             onClick={toggleMute}
             className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'} text-sm font-medium shadow-lg`}
           >
             {isMuted ? 'Unmute' : 'Mute'}
           </button>
           <button 
             data-test-id="toggle-camera-button"
             onClick={toggleCamera}
             className={`w-14 h-14 flex items-center justify-center rounded-full transition-all ${isCameraOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-800 hover:bg-gray-700'} text-sm font-medium shadow-lg`}
           >
             {isCameraOff ? 'No Cam' : 'Cam'}
           </button>
           <button 
             data-test-id="hangup-button"
             onClick={handleHangup}
             className="px-8 h-14 rounded-full bg-red-600 hover:bg-red-700 transition-all font-semibold shadow-lg shadow-red-900/20"
           >
             End Call
           </button>
        </div>
      </div>

      {/* Chat Sidebar */}
      <div className="w-80 border-l border-gray-900 bg-gray-950 flex flex-col hidden lg:flex">
        <div className="p-4 border-b border-gray-900 font-semibold bg-gray-900/50">
          Room Chat
        </div>
        <div data-test-id="chat-log" className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {messages.map((msg, idx) => (
            <div key={idx} data-test-id="chat-message" className={`p-3 rounded-xl text-sm max-w-[90%] shadow-md ${msg.isSelf ? 'bg-blue-600 self-end rounded-tr-sm' : 'bg-gray-800 self-start rounded-tl-sm'}`}>
              <div className="text-[10px] opacity-60 mb-1 uppercase tracking-wider">{msg.senderId === 'Me' ? 'You' : `User ${msg.senderId.slice(0, 4)}`}</div>
              <div className="leading-relaxed">{msg.message}</div>
            </div>
          ))}
          {messages.length === 0 && (
             <div className="h-full flex items-center justify-center text-gray-600 text-sm italic">
               No messages yet.
             </div>
          )}
        </div>
        <div className="p-4 border-t border-gray-900 bg-gray-900/50">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              data-test-id="chat-input"
              type="text" 
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-4 py-2 outline-none focus:border-blue-500 text-sm transition-all"
              placeholder="Type a message..."
            />
            <button data-test-id="chat-submit" type="submit" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium text-sm transition-all">
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
