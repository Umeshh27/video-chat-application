'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [roomId, setRoomId] = useState('');
  const router = useRouter();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId) {
      router.push(`/room/${roomId}`);
    }
  };

  const createRoom = () => {
    const id = uuidv4();
    router.push(`/room/${id}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white font-sans selection:bg-blue-500/30">
      <div className="bg-gray-900/50 backdrop-blur-xl p-10 rounded-3xl shadow-2xl max-w-md w-full border border-gray-800">
        <h1 className="text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-blue-400 to-purple-500 text-transparent bg-clip-text tracking-tight">Video Connect</h1>
        <p className="text-gray-400 text-center mb-8 text-sm">Real-time peer-to-peer meetings.</p>
        
        <button 
          onClick={createRoom}
          className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-4 rounded-xl mb-6 transition-all shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
          Create New Room
        </button>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-800/50"></div>
          <span className="flex-shrink-0 mx-4 text-xs font-medium text-gray-500 uppercase tracking-widest">or</span>
          <div className="flex-grow border-t border-gray-800/50"></div>
        </div>

        <form onSubmit={handleJoin} className="mt-4">
          <div className="relative mb-4">
            <input 
              type="text" 
              placeholder="Enter Room ID" 
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="w-full bg-gray-950/50 border border-gray-800 rounded-xl px-5 py-4 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
            />
          </div>
          <button 
            type="submit"
            className="w-full bg-gray-800 hover:bg-gray-700 active:bg-gray-900 text-white font-semibold py-4 rounded-xl transition-all border border-gray-700 shadow-md flex items-center justify-center gap-2"
          >
            Join Room
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
