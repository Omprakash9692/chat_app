import React, { useEffect, useRef, useState } from "react";
import { ZegoExpressWebRTMEngine } from "zego-express-engine-webrtm";
import {
  AlertTriangle, X, ExternalLink,
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
} from "lucide-react";

// Generate a ZegoCloud token using the server-side algorithm (pure JS, no import needed)
function generateZegoToken(appID, serverSecret, roomID, userID, userName) {
  // Use ZegoUIKitPrebuilt.generateKitTokenForTest which internally generates a proper Zego token
  // We'll return the raw token for ZegoExpressEngine.loginRoom
  const expiredTs = Math.floor(Date.now() / 1000) + 3600;
  // Simple HMAC-SHA256 based Zego token generation
  // Since we can't do HMAC in the browser without crypto API complications on all browsers,
  // we rely on ZegoUIKitPrebuilt.generateKitTokenForTest and extract the inner token
  return null; // handled async below
}

export const ZegoCallRoom = ({
  roomID,
  userID,
  userName,
  callType = "video",
  onLeaveRoom,
}) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const zegoRef = useRef(null);
  const localStreamRef = useRef(null);
  const onLeaveRoomRef = useRef(onLeaveRoom);
  const initializedRef = useRef(false);

  // Keep callback ref fresh without triggering useEffect re-runs
  useEffect(() => {
    onLeaveRoomRef.current = onLeaveRoom;
  }, [onLeaveRoom]);

  const [appIdError, setAppIdError] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const [status, setStatus] = useState("connecting");
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(callType === "video");

  const isVideo = callType === "video";

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const appIdEnv =
      import.meta.env.VITE_ZEGO_APP_ID ||
      import.meta.env.ZEGO_APP_ID ||
      (typeof process !== "undefined" && process.env?.ZEGO_APP_ID);
    const secretEnv =
      import.meta.env.VITE_ZEGO_SERVER_SECRET ||
      import.meta.env.ZEGO_SERVER_SECRET ||
      (typeof process !== "undefined" && process.env?.ZEGO_SERVER_SECRET);

    if (
      !appIdEnv ||
      String(appIdEnv) === "123456789" ||
      !secretEnv ||
      secretEnv === "your_zego_server_secret"
    ) {
      setAppIdError(true);
      return;
    }

    const appID = Number(appIdEnv);
    const cleanUserID = String(userID || "user_" + Math.random().toString(36).substring(7));
    const cleanUserName = userName || "ChitChat User";
    const cleanRoomID = String(roomID);
    const streamID = cleanRoomID + "_" + cleanUserID;

    const initCall = async () => {
      try {
        // Generate a proper token using ZegoUIKitPrebuilt's helper (test token)
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          secretEnv,
          cleanRoomID,
          cleanUserID,
          cleanUserName,
        );

        // ZegoExpressEngine loginRoom needs just the raw token part
        // kitToken format from generateKitTokenForTest: "<base64_payload>"
        const token = kitToken;

        // Create the Zego Express engine instance
        const zg = new ZegoExpressWebRTMEngine(appID, "wss://webliveroom-api.zego.im/ws");
        zegoRef.current = zg;

        // Room state listener
        zg.on("roomStateUpdate", (_rId, state) => {
          if (state === "CONNECTED") setStatus("connected");
          else if (state === "DISCONNECTED") setStatus("disconnected");
        });

        // Remote stream listener
        zg.on("roomStreamUpdate", async (_rId, updateType, streamList) => {
          if (updateType === "ADD") {
            for (const s of streamList) {
              try {
                const mediaStream = await zg.startPlayingStream(s.streamID, {});
                if (remoteVideoRef.current) {
                  remoteVideoRef.current.srcObject = mediaStream;
                }
              } catch (e) {
                console.warn("Failed to play remote stream:", e);
              }
            }
          } else if (updateType === "DELETE") {
            for (const s of streamList) {
              zg.stopPlayingStream(s.streamID);
            }
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          }
        });

        // Login to room
        await zg.loginRoom(cleanRoomID, token, {
          userID: cleanUserID,
          userName: cleanUserName,
        });

        // Create and publish local stream
        const localStream = await zg.createStream({
          camera: { video: isVideo, audio: true },
        });

        localStreamRef.current = localStream;

        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = localStream;
        }

        zg.startPublishingStream(streamID, localStream);
        setStatus("connected");
      } catch (err) {
        console.error("Zego Express init error:", err);
        const msg = err?.message || String(err);
        // Only show appId error modal for actual auth failures
        if (
          msg.includes("appid") ||
          msg.includes("1001004") ||
          msg.includes("invalid")
        ) {
          setAppIdError(true);
        } else {
          setConnectionError(msg);
        }
      }
    };

    initCall();

    return () => {
      initializedRef.current = false;
      const zg = zegoRef.current;
      const stream = localStreamRef.current;
      if (stream && zg) {
        try {
          zg.stopPublishingStream(streamID);
          zg.destroyStream(stream);
        } catch (_) {}
        localStreamRef.current = null;
      }
      if (zg) {
        try {
          zg.logoutRoom(cleanRoomID);
        } catch (_) {}
        zegoRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomID, userID, userName, callType]);

  const toggleMic = () => {
    if (localStreamRef.current) {
      const enabled = !micOn;
      localStreamRef.current.getAudioTracks().forEach((t) => (t.enabled = enabled));
      setMicOn(enabled);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current && isVideo) {
      const enabled = !cameraOn;
      localStreamRef.current.getVideoTracks().forEach((t) => (t.enabled = enabled));
      setCameraOn(enabled);
    }
  };

  const handleEndCall = () => {
    const zg = zegoRef.current;
    const stream = localStreamRef.current;
    const cleanRoomID = String(roomID);
    const cleanUserID = String(userID || "");
    if (stream && zg) {
      try {
        zg.stopPublishingStream(cleanRoomID + "_" + cleanUserID);
        zg.destroyStream(stream);
      } catch (_) {}
      localStreamRef.current = null;
    }
    if (zg) {
      try { zg.logoutRoom(cleanRoomID); } catch (_) {}
      zegoRef.current = null;
    }
    if (onLeaveRoomRef.current) onLeaveRoomRef.current();
  };

  // ─── AppID Error Modal ─────────────────────────────────────────────────────
  if (appIdError) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-5 relative">
          <button onClick={() => onLeaveRoomRef.current?.()} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
          <div className="h-14 w-14 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">ZegoCloud App ID Required</h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              To start live Audio & Video Calls, please create a free account at{" "}
              <strong className="text-emerald-400">ZEGOCLOUD Console</strong> and add
              your App ID & Server Secret.
            </p>
          </div>
          <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 text-left text-[11px] font-mono text-slate-300 space-y-1">
            <p className="text-slate-500 font-sans font-semibold mb-1">Add to frontend/.env or Vercel:</p>
            <p className="text-emerald-400">VITE_ZEGO_APP_ID=your_app_id</p>
            <p className="text-emerald-400">VITE_ZEGO_SERVER_SECRET=your_secret_key</p>
          </div>
          <div className="flex items-center gap-3 w-full pt-1">
            <a href="https://console.zegocloud.com" target="_blank" rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md">
              <span>Get Free Zego Keys</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button onClick={() => onLeaveRoomRef.current?.()} className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer">
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Connection Error (non-auth) ──────────────────────────────────────────
  if (connectionError) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-sm w-full shadow-2xl flex flex-col items-center text-center space-y-4 relative">
          <button onClick={() => onLeaveRoomRef.current?.()} className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="h-5 w-5" />
          </button>
          <div className="h-12 w-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center shrink-0">
            <Phone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Connection Failed</h3>
            <p className="text-xs text-slate-400 mt-1">Could not connect to the call. Please try again.</p>
          </div>
          <button onClick={() => onLeaveRoomRef.current?.()} className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer">
            Close
          </button>
        </div>
      </div>
    );
  }

  // ─── Call UI ───────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 flex flex-col w-full h-full select-none">
      {/* Remote Video / Voice screen */}
      <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
              <Phone className="h-9 w-9 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {status === "connecting" ? "Connecting…" : "Voice Call Active"}
            </p>
          </div>
        )}

        {/* Local video PiP */}
        {isVideo && (
          <div className="absolute top-4 right-4 w-24 h-32 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-800">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
          </div>
        )}

        {/* Status badge */}
        {status === "connecting" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm animate-pulse">
            Connecting…
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-5 flex items-center justify-center gap-6 shrink-0">
        <button onClick={toggleMic} className="flex flex-col items-center gap-1 cursor-pointer">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${micOn ? "bg-slate-700 hover:bg-slate-600" : "bg-rose-600 hover:bg-rose-500"}`}>
            {micOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}
          </div>
          <span className="text-[10px] text-slate-400">{micOn ? "Mute" : "Unmute"}</span>
        </button>

        {isVideo && (
          <button onClick={toggleCamera} className="flex flex-col items-center gap-1 cursor-pointer">
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${cameraOn ? "bg-slate-700 hover:bg-slate-600" : "bg-rose-600 hover:bg-rose-500"}`}>
              {cameraOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}
            </div>
            <span className="text-[10px] text-slate-400">{cameraOn ? "Camera" : "Camera Off"}</span>
          </button>
        )}

        <button onClick={handleEndCall} className="flex flex-col items-center gap-1 cursor-pointer">
          <div className="h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-lg transition-transform active:scale-95">
            <PhoneOff className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] text-slate-400">End</span>
        </button>
      </div>
    </div>
  );
};
