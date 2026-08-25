import React, { useEffect, useRef, useState } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";
import { AlertTriangle, X, ExternalLink } from "lucide-react";

export const ZegoCallRoom = ({
  roomID,
  userID,
  userName,
  callType = "video",
  onLeaveRoom,
}) => {
  const containerRef = useRef(null);
  const [appIdError, setAppIdError] = useState(false);

  useEffect(() => {
    let zpInstance = null;

    // Suppress Zego UI kit null track, AiDenoiseConfig, and cancel login rejections
    const handleRejection = (event) => {
      if (
        event.reason &&
        (event.reason.message?.includes("setting 'enabled'") ||
          event.reason.message?.includes("Cannot set properties of null") ||
          event.reason.message?.includes("AiDenoiseConfig") ||
          event.reason.message?.includes("1102026") ||
          event.reason.message?.includes("cancel login") ||
          event.reason.message?.includes("1001004") ||
          event.reason.message?.includes("appid invalid"))
      ) {
        if (
          event.reason.message?.includes("1001004") ||
          event.reason.message?.includes("appid invalid")
        ) {
          setAppIdError(true);
        }
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    const initMeeting = async () => {
      const appIdEnv =
        import.meta.env.VITE_ZEGO_APP_ID ||
        import.meta.env.ZEGO_APP_ID ||
        (typeof process !== "undefined" && process.env?.ZEGO_APP_ID);
      const secretEnv =
        import.meta.env.VITE_ZEGO_SERVER_SECRET ||
        import.meta.env.ZEGO_SERVER_SECRET ||
        (typeof process !== "undefined" && process.env?.ZEGO_SERVER_SECRET);

      // Check if real Zego Cloud App ID is configured
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
      const serverSecret = secretEnv;

      const cleanUserID = String(
        userID || "user_" + Math.random().toString(36).substring(7),
      );
      const cleanUserName = userName || "ChitChat User";
      const isVideo = callType === "video";

      try {
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomID,
          cleanUserID,
          cleanUserName,
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        zpInstance = zp;

        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: isVideo
              ? ZegoUIKitPrebuilt.OneONoneCall
              : ZegoUIKitPrebuilt.GroupCall,
          },
          turnOnCameraWhenJoining: isVideo,
          turnOnMicrophoneWhenJoining: true,
          showMyCameraToggleButton: isVideo,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: false,
          showScreenSharingButton: false,
          showPreJoinView: false,
          showTextChat: false,
          showUserList: false,
          onLeaveRoom: () => {
            if (onLeaveRoom) onLeaveRoom();
          },
        });
      } catch (err) {
        console.error("Failed to initialize ZegoCallRoom:", err);
        setAppIdError(true);
      }
    };

    if (containerRef.current && roomID) {
      initMeeting();
    }

    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      if (zpInstance) {
        try {
          zpInstance.destroy();
        } catch (e) {
          console.error("Zego destroy error:", e);
        }
      }
    };
  }, [roomID, userID, userName, callType, onLeaveRoom]);

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
            <h3 className="text-lg font-bold text-white">
              ZegoCloud App ID Required
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              To start live Audio & Video Calls, please create a free account at{" "}
              <strong className="text-emerald-400">ZEGOCLOUD Console</strong> and add your App ID & Server Secret to your{" "}
              <code className="bg-slate-800 px-1.5 py-0.5 rounded text-amber-300 font-mono">.env</code> file.
            </p>
          </div>

          <div className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl p-3.5 text-left text-[11px] font-mono text-slate-300 space-y-1">
            <p className="text-slate-500 font-sans font-semibold mb-1">
              Add to frontend/.env or Vercel:
            </p>
            <p className="text-emerald-400">VITE_ZEGO_APP_ID=123456789</p>
            <p className="text-emerald-400">
              VITE_ZEGO_SERVER_SECRET=your_secret_key
            </p>
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
    <div className="fixed inset-0 z-100 bg-slate-950 flex flex-col w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
