import React, { useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, Mic } from "lucide-react";
import { Avatar } from "../../../components/ui/ui";

export const IncomingCallModal = ({ incomingCall, onAccept, onDecline }) => {
  const audioContextRef = useRef(null);

  // Synthetic Ringtone Generator using Web Audio API
  useEffect(() => {
    if (!incomingCall) return;

    let isRinging = true;
    let intervalId = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        audioContextRef.current = ctx;

        const playTone = () => {
          if (!isRinging || ctx.state === "closed") return;
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            osc.frequency.setValueAtTime(480, ctx.currentTime + 0.1);

            gain.gain.setValueAtTime(0.12, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 1.2);
          } catch (e) {
            console.error("Ringtone error:", e);
          }
        };

        playTone();
        intervalId = setInterval(playTone, 2200);
      }
    } catch (e) {
      console.error("AudioContext initialization error:", e);
    }

    return () => {
      isRinging = false;
      if (intervalId) clearInterval(intervalId);
      if (
        audioContextRef.current &&
        audioContextRef.current.state !== "closed"
      ) {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, [incomingCall]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.callType === "video";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-800 flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <Avatar
            src={incomingCall.callerAvatar}
            name={incomingCall.callerName || "User"}
            size="xl"
            color="from-[#008069] to-[#00a884]"
          />
          <div className="absolute -bottom-1 -right-1 p-2 rounded-full bg-[#008069] text-white shadow-md animate-pulse">
            {isVideo ? (
              <Video className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white truncate max-w-xs">
            {incomingCall.callerName || "Incoming Call"}
          </h3>
          <p className="text-xs font-semibold text-emerald-400 mt-1 uppercase tracking-wider">
            {isVideo ? "Incoming Video Call..." : "Incoming Voice Call..."}
          </p>
        </div>

        <div className="flex items-center gap-6 pt-2 w-full justify-center">
          <button
            type="button"
            onClick={onDecline}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="h-14 w-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 group-hover:rotate-12">
              <PhoneOff className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-rose-400">
              Decline
            </span>
          </button>

          <button
            type="button"
            onClick={onAccept}
            className="flex flex-col items-center gap-1.5 cursor-pointer group"
          >
            <div className="h-14 w-14 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center shadow-lg transition-transform active:scale-95 animate-bounce">
              <Phone className="h-6 w-6" />
            </div>
            <span className="text-[11px] font-bold text-slate-400 group-hover:text-emerald-400">
              Accept
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
