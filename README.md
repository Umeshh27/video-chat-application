# WebRTC Multi-Peer Video Chat

A robust, real-time multi-peer video chat application built with Next.js, WebRTC, Socket.io, and Tailwind CSS. The application supports mesh topology for up to 4 participants with bidirectional video/audio streaming and real-time text chat.

## Features
- **P2P Video & Audio**: Real-time media streaming via WebRTC.
- **Multi-Peer Mesh**: Connects up to 4 users in a single room using a fully connected mesh network.
- **Custom Signaling Server**: A dedicated Socket.io WebSocket server integrated directly alongside the Next.js application handling room logic and ICE candidate trickling.
- **In-Call Controls**: Toggle camera, mute microphone, and end call functionalities with immediate UI and remote peer feedback.
- **Real-Time Text Chat**: Integrated room-based messaging.
- **Docker Ready**: Fully containerized with a defined healthcheck for quick, reproducible deployments.

## Architecture & State Management
- **Next.js App Router**: Powers the frontend routing (e.g., dynamic `/room/[roomId]`) and API endpoints.
- **Signaling Layer**: A custom HTTP server (`server.ts`) wraps the Next.js handler and attaches a `socket.io` instance. This prevents the need for a separate backend service, keeping deployment simple.
- **State Management & Hooks**:
  - `useMediaStream`: Manages access to `navigator.mediaDevices`, track toggling (mute/video off), and hardware resource cleanup.
  - `useWebRTC`: Manages the complex state of multiple `RTCPeerConnection` objects. It stores active streams in a React state map and cleans up disconnected peers securely.
  
## Security and Scalability
While this application uses a **mesh topology** (which is excellent for small groups of 3-4 users due to low server bandwidth), it scales quadratically in terms of client upstream/downstream connections. For larger production deployments (e.g., webinars or 10+ participants), migrating from a Mesh topology to a Selective Forwarding Unit (SFU) is recommended to reduce client CPU and network load.

## Setup Instructions

### Environment Variables
1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```
2. Verify the configuration:
   - `PORT=3000`
   - `NEXT_PUBLIC_STUN_SERVER=stun:stun.l.google.com:19302`

### Running with Docker (Recommended)
The application is fully containerized and includes an internal health check.
```bash
docker-compose up --build -d
```
The application will be available at `http://localhost:3000`.

### Running Locally (Development)
If you prefer running outside of Docker:
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the custom development server:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000`.

## Testing
To manually test the WebRTC connection:
1. Open the application and create a room.
2. Grant camera and microphone permissions.
3. Click **Copy Link** to get the room URL.
4. Open the copied URL in a new browser window or a different browser to simulate a second peer joining.
5. You should see both local and remote video streams side-by-side.


