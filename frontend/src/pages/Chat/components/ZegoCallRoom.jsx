import React, { useEffect, useRef, useState, useCallback } from "react";
import { ZegoExpressWebRTMEngine as ZegoExpressEngine } from "zego-express-engine-webrtm";
import { AlertTriangle, X, ExternalLink, Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from "lucide-react";

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

  const [appIdError, setAppIdError] = useState(false);
  const [status, setStatus] = useState("connecting"); // 'connecting' | 'connected' | 'disconnected'
  const [micOn, setMicOn] = useState(true);
  const [cameraOn, setCameraOn] = useState(callType === "video");

  const isVideo = callType === "video";

  const cleanup = useCallback(() => {
    try {
      if (localStreamRef.current && zegoRef.current) {
        zegoRef.current.stopPublishingStream(roomID + "_" + userID);
        zegoRef.current.destroyStream(localStreamRef.current);
        localStreamRef.current = null;
      }
      if (zegoRef.current) {
        zegoRef.current.logoutRoom(roomID);
        zegoRef.current.off("roomStateUpdate");
        zegoRef.current.off("remoteCameraStatusUpdate");
        zegoRef.current.off("remoteMicStatusUpdate");
        zegoRef.current.off("playerStateUpdate");
        zegoRef.current.off("publisherStateUpdate");
        zegoRef.current.off("roomStreamUpdate");
        zegoRef.current = null;
      }
    } catch (e) {
      console.error("Zego cleanup error:", e);
    }
  }, [roomID, userID]);

  useEffect(() => {
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
    const cleanUserID = String(
      userID || "user_" + Math.random().toString(36).substring(7),
    );
    const cleanRoomID = String(roomID);

    const initCall = async () => {
      try {
        const zg = new ZegoExpressEngine(appID, "wss://webliveroom-api.zego.im/ws");
        zegoRef.current = zg;

        zg.on("roomStateUpdate", (rId, state) => {
          if (state === "CONNECTED") setStatus("connected");
          else if (state === "DISCONNECTED") setStatus("disconnected");
        });

        zg.on("roomStreamUpdate", async (rId, updateType, streamList) => {
          if (updateType === "ADD") {
            for (const stream of streamList) {
              const mediaStream = await zg.startPlayingStream(stream.streamID, {});
              if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = mediaStream;
              }
            }
          } else if (updateType === "DELETE") {
            for (const stream of streamList) {
              zg.stopPlayingStream(stream.streamID);
            }
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          }
        });

        // Generate token using generateKitTokenForTest helper approach
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          secretEnv,
          cleanRoomID,
          cleanUserID,
          userName || "ChitChat User",
        );

        // Extract the token from kitToken (format: appID_roomID_userID_token)
        const token = kitToken.split("?")[0].split(",").pop() || kitToken;

        await zg.loginRoom(cleanRoomID, token, {
          userID: cleanUserID,
          userName: userName || "ChitChat User",
        });

        // Create and publish local stream
        const localStream = await zg.createStream({
          camera: {
            video: isVideo,
            audio: true,
          },
        });

        localStreamRef.current = localStream;

        if (localVideoRef.current && isVideo) {
          localVideoRef.current.srcObject = localStream;
        }

        const streamID = cleanRoomID + "_" + cleanUserID;
        zg.startPublishingStream(streamID, localStream);
        setStatus("connected");
      } catch (err) {
        console.error("Zego Express init error:", err);
        // Fallback to UIKit if express fails
        setAppIdError(true);
      }
    };

    initCall();

    return () => {
      cleanup();
    };
  }, [roomID, userID, userName, callType, isVideo, cleanup]);

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
    cleanup();
    if (onLeaveRoom) onLeaveRoom();
  };

  if (appIdError) {
    return (
      <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in">
        <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col items-center text-center space-y-5 relative select-none">
          <button
            onClick={onLeaveRoom}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
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
            <a
              href="https://console.zegocloud.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-md"
            >
              <span>Get Free Zego Keys</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <button
              onClick={onLeaveRoom}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-100 bg-slate-950 flex flex-col w-full h-full select-none">
      {/* Remote Video (Full Screen) */}
      <div className="relative flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
        {isVideo ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center">
              <Phone className="h-9 w-9 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-slate-300">
              {status === "connecting" ? "Connecting..." : "Voice Call Active"}
            </p>
          </div>
        )}

        {/* Local Video PiP */}
        {isVideo && (
          <div className="absolute top-4 right-4 w-24 h-32 sm:w-32 sm:h-44 rounded-2xl overflow-hidden border-2 border-slate-700 shadow-xl bg-slate-800">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          </div>
        )}

        {/* Status Bar */}
        {status === "connecting" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs font-semibold px-4 py-1.5 rounded-full backdrop-blur-sm">
            Connecting...
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-5 flex items-center justify-center gap-6 shrink-0">
        <button
          onClick={toggleMic}
          className={`flex flex-col items-center gap-1 cursor-pointer group`}
        >
          <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${micOn ? "bg-slate-700 hover:bg-slate-600" : "bg-rose-600 hover:bg-rose-500"}`}>
            {micOn ? <Mic className="h-5 w-5 text-white" /> : <MicOff className="h-5 w-5 text-white" />}
          </div>
          <span className="text-[10px] text-slate-400">{micOn ? "Mute" : "Unmute"}</span>
        </button>

        {isVideo && (
          <button
            onClick={toggleCamera}
            className="flex flex-col items-center gap-1 cursor-pointer"
          >
            <div className={`h-12 w-12 rounded-full flex items-center justify-center transition-colors ${cameraOn ? "bg-slate-700 hover:bg-slate-600" : "bg-rose-600 hover:bg-rose-500"}`}>
              {cameraOn ? <Video className="h-5 w-5 text-white" /> : <VideoOff className="h-5 w-5 text-white" />}
            </div>
            <span className="text-[10px] text-slate-400">{cameraOn ? "Camera" : "Camera Off"}</span>
          </button>
        )}

        <button
          onClick={handleEndCall}
          className="flex flex-col items-center gap-1 cursor-pointer"
        >
          <div className="h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-500 flex items-center justify-center shadow-lg transition-transform active:scale-95">
            <PhoneOff className="h-6 w-6 text-white" />
          </div>
          <span className="text-[10px] text-slate-400">End</span>
        </button>
      </div>
    </div>
  );
};
