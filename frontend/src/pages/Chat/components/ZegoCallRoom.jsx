import React, { useEffect, useRef } from "react";
import { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

export const ZegoCallRoom = ({
  roomID,
  userID,
  userName,
  callType = "video",
  onLeaveRoom,
}) => {
  const containerRef = useRef(null);

  useEffect(() => {
    let zpInstance = null;

    // Suppress Zego UI kit null track errors when camera is unavailable or on voice calls
    const handleRejection = (event) => {
      if (
        event.reason &&
        (event.reason.message?.includes("setting 'enabled'") ||
          event.reason.message?.includes("Cannot set properties of null"))
      ) {
        event.preventDefault();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);

    const initMeeting = async () => {
      // Default Zego Test Credentials (or override via VITE_ZEGO_APP_ID / VITE_ZEGO_SERVER_SECRET)
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID) || 123456789;
      const serverSecret =
        import.meta.env.VITE_ZEGO_SERVER_SECRET || "your_zego_server_secret";

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
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: isVideo,
          showPreJoinView: false, // Prevents pre-join preview null track errors
          showTextChat: false,
          showUserList: false,
          onLeaveRoom: () => {
            if (onLeaveRoom) onLeaveRoom();
          },
        });
      } catch (err) {
        console.error("Failed to initialize ZegoCallRoom:", err);
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

  return (
    <div className="fixed inset-0 z-100 bg-slate-950 flex flex-col w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
};
