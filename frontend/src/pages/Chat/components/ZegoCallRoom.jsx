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

    const initMeeting = async () => {
      // Default Zego Test Credentials (or override via VITE_ZEGO_APP_ID / VITE_ZEGO_SERVER_SECRET)
      const appID = Number(import.meta.env.VITE_ZEGO_APP_ID) || 123456789;
      const serverSecret =
        import.meta.env.VITE_ZEGO_SERVER_SECRET || "your_zego_server_secret";

      const cleanUserID = String(
        userID || "user_" + Math.random().toString(36).substring(7),
      );
      const cleanUserName = userName || "ChitChat User";

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
            mode:
              callType === "video"
                ? ZegoUIKitPrebuilt.OneONoneCall
                : ZegoUIKitPrebuilt.GroupCall,
          },
          turnOnCameraWhenJoining: callType === "video",
          turnOnMicrophoneWhenJoining: true,
          showMyCameraToggleButton: true,
          showMyMicrophoneToggleButton: true,
          showAudioVideoSettingsButton: true,
          showScreenSharingButton: true,
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
