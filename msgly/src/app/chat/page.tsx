"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { CSSProperties } from "react";
import { useSession, signOut } from "next-auth/react";
import { io } from "socket.io-client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MoreVertical, Send, User, 
  MessageSquare, Settings, LogOut, Paperclip, ArrowLeft, UserPlus,
  Image as ImageIcon, Video as VideoIcon, FileText, Camera,
  Phone, Video as VideoCall, X, MoreHorizontal, Trash2, Forward, Download, Lock, Unlock
} from "lucide-react";

const socketUrl =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    : "";
const socket = io(socketUrl, { autoConnect: false });

const Message = ({
  id,
  bubble,
  time,
  type,
  mediaUrl,
  mediaType,
  onDelete,
  onForward,
  onDownload,
  selectionMode,
  selected,
  onToggleSelect,
  sentBg,
  recvBg,
  onSystemClick,
}: any) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: Event) => {
      if (!menuRef.current) return;
      const target = e.target as Node | null;
      if (target && menuRef.current.contains(target)) return;
      setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
    };
  }, [menuOpen]);
  const isCallSystem = typeof bubble === "string" && /is calling/i.test(bubble);
  if (type === "system" || isCallSystem) {
    return (
      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="flex justify-center mb-4">
        <button
          onClick={() => onSystemClick?.(bubble)}
          className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[11px] text-white/60 hover:bg-white/10 transition"
        >
          {bubble}
        </button>
      </motion.div>
    );
  }
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group flex ${type === 'sent' ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className="flex items-start gap-2 overflow-visible">
        {selectionMode && (
          <button
            onClick={() => onToggleSelect?.(id)}
            className={`mt-2 h-5 w-5 rounded-full border ${
              selected ? "bg-blue-500 border-blue-400" : "border-white/30"
            }`}
            aria-label="Select message"
          />
        )}
        <div
          onClick={() => selectionMode && onToggleSelect?.(id)}
          className={`relative max-w-[80%] p-2.5 px-4 rounded-[1.5rem] shadow-sm overflow-visible ${
            type === "sent"
              ? "text-black rounded-tr-none"
              : "text-white border border-white/5 backdrop-blur-md rounded-tl-none"
          }`}
          style={{
            background: type === "sent" ? sentBg : recvBg,
          }}
        >
          {mediaUrl ? (
            mediaType?.startsWith("image") ? (
              <img src={mediaUrl} alt="Image" className="max-w-[280px] rounded-xl border border-white/10" />
            ) : mediaType?.startsWith("video") ? (
              <video src={mediaUrl} controls className="max-w-[280px] rounded-xl border border-white/10" />
            ) : (
              <a
                href={mediaUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline underline-offset-4"
              >
                Open document
              </a>
            )
          ) : (
            <p className="text-sm font-medium">{bubble}</p>
          )}
          <span className={`text-[9px] mt-1 block ${type === 'sent' ? 'text-black/40' : 'text-white/30'} text-right`}>{time}</span>

          {!selectionMode && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((v) => !v);
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition h-7 w-7 rounded-full bg-black/50 text-white flex items-center justify-center"
              aria-label="Message actions"
            >
              <MoreHorizontal size={14} />
            </button>
          )}

          {menuOpen && !selectionMode && (
            <div
              ref={menuRef}
              className={`absolute top-10 w-44 rounded-2xl border border-white/15 p-2 shadow-2xl z-30 ${
                type === "sent" ? "right-0" : "left-0"
              } bg-white/10 backdrop-blur-2xl`}
            >
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete?.(id);
                }}
                className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/20 text-red-200">
                  <Trash2 size={12} />
                </span>
                Delete
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onForward?.(id);
                }}
                className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/20 text-blue-200">
                  <Forward size={12} />
                </span>
                Forward
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDownload?.(id);
                }}
                className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10"
              >
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/20 text-emerald-200">
                  <Download size={12} />
                </span>
                Download
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default function ChatPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<"chats" | "calls" | "settings" | "none">("chats");
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [allMessages, setAllMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // Default Khali
  const [searchResult, setSearchResult] = useState<any>(null);
  const [requestStatus, setRequestStatus] = useState<any>(null);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [chatList, setChatList] = useState<any[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [isTypingFriend, setIsTypingFriend] = useState(false);
  const [profileImage, setProfileImage] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [currentUsername, setCurrentUsername] = useState("");
  const [draftUsername, setDraftUsername] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardMessageId, setForwardMessageId] = useState<string | null>(null);
  const [callLog, setCallLog] = useState<any[]>([]);
  const [callSelectionMode, setCallSelectionMode] = useState(false);
  const [selectedCallIds, setSelectedCallIds] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showMediaPanel, setShowMediaPanel] = useState(false);
  const [themeId, setThemeId] = useState("aurora");
  const [fontId, setFontId] = useState("geist");
  const [lockedChats, setLockedChats] = useState<Record<string, { password: string }>>({});
  const [showLockModal, setShowLockModal] = useState(false);
  const [lockTarget, setLockTarget] = useState<string | null>(null);
  const [lockMode, setLockMode] = useState<"set" | "unlock">("set");
  const [lockInput, setLockInput] = useState("");
  const [lockNoteAck, setLockNoteAck] = useState(false);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const profileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [callOpen, setCallOpen] = useState(false);
  const [callMinimized, setCallMinimized] = useState(false);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "ringing" | "active">("idle");
  const [callKind, setCallKind] = useState<"video" | "audio">("video");
  const [callPeer, setCallPeer] = useState<any>(null);
  const [remoteStreamTick, setRemoteStreamTick] = useState(0);
  const iceServersRef = useRef<RTCIceServer[] | null>(null);
  const turnFetchedAtRef = useRef<number | null>(null);
  const [zegoOpen, setZegoOpen] = useState(false);
  const [zegoRoomId, setZegoRoomId] = useState("");
  const [zegoKind, setZegoKind] = useState<"video" | "audio">("video");
  const [zegoMinimized, setZegoMinimized] = useState(false);
  const zegoContainerRef = useRef<HTMLDivElement | null>(null);
  const zegoInstanceRef = useRef<any>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const remoteStreamRef = useRef<MediaStream | null>(null);
    const typingTimeoutRef = useRef<any>(null);
    const callPeerRef = useRef<string | null>(null);
    const ringCtxRef = useRef<AudioContext | null>(null);
    const ringIntervalRef = useRef<number | null>(null);
    const callTimeoutRef = useRef<number | null>(null);
    const callStartedAtRef = useRef<number | null>(null);

  const startRingtone = useCallback((tone: "incoming" | "outgoing") => {
    try {
      stopRingtone();
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      ringCtxRef.current = ctx;
      const freq = tone === "incoming" ? 520 : 420;
      const tick = () => {
        if (!ringCtxRef.current) return;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        const now = ctx.currentTime;
        gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
        osc.stop(now + 0.24);
      };
      tick();
      ringIntervalRef.current = window.setInterval(tick, 700);
    } catch (err) {
      console.warn("Ringtone error", err);
    }
  }, []);

  const stopRingtone = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (ringCtxRef.current) {
      ringCtxRef.current.close();
      ringCtxRef.current = null;
    }
  }, []);


  // --- 👤 User Identity Logic (Based on Email) ---
  const userEmail = session?.user?.email ?? ""; 
  
  const getNickname = (email: string) => {
    if (!email) return "User";
    let namePart = email.split("@")[0] ?? "";
    namePart = namePart.replace(/[^a-zA-Z]/g, "");
    if (!namePart) return "User";
    return namePart.charAt(0).toUpperCase() + namePart.slice(1, 6);
  };

  // Email se unique username banana (no numbers)
  const generateUniqueUsername = (email: string) => {
    if (!email) return "user";
    const [local = "", domain = ""] = email.toLowerCase().split("@");
    let base = (local + domain).replace(/[^a-z]/g, "");
    if (!base) return "user";
    base = base.slice(0, 8);
    let sum = 0;
    for (let i = 0; i < email.length; i++) sum += email.charCodeAt(i);
    const c1 = String.fromCharCode(97 + (sum % 26));
    const c2 = String.fromCharCode(97 + ((sum * 7) % 26));
    return (base + c1 + c2).slice(0, 10);
  };

  const derivedUserId = generateUniqueUsername(userEmail);
  const myUniqueId = resolvedUserId || currentUsername || derivedUserId;
  const myNickname = getNickname(userEmail);
  const selectedDisplayName = selectedChat?.nickname ?? selectedChat?.username ?? "";
  const requestSender = requestStatus?.direction === "incoming" ? selectedChat?.username : myUniqueId;
  const requestReceiver = requestStatus?.direction === "incoming" ? myUniqueId : selectedChat?.username;
  const activeCallName =
    callPeer?.nickname ||
    callPeer?.username ||
    selectedChat?.nickname ||
    selectedChat?.username ||
    "User";
  const activeCallId = callPeer?.username || selectedChat?.username || "";
  const callAvatarUrl = callPeer?.image || selectedChat?.image || "";
  const callInitial = (activeCallName || "U").charAt(0).toUpperCase();
  const callStatusLabel =
    callStatus === "calling"
      ? "Calling..."
      : callStatus === "ringing"
        ? "Incoming..."
        : callStatus === "active"
          ? "Connected"
          : "Live Call";
  const formatDuration = (totalSeconds?: number) => {
    if (totalSeconds === undefined || totalSeconds === null) return "";
    const seconds = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };
  const formatCallTime = (value?: string | Date) => {
    if (!value) return "";
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleString([], {
      weekday: "short",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const resolveCallPeer = (username: string) => {
    if (!username) return null;
    const fromChats = chatList.find((c) => c.username === username);
    if (fromChats) return { username, nickname: fromChats.nickname, image: fromChats.image };
    const fromRequests = incomingRequests.find((r) => r.username === username);
    if (fromRequests) return { username, nickname: fromRequests.nickname, image: fromRequests.image };
    return { username };
  };
  const incomingPeer = incomingCall ? resolveCallPeer(incomingCall.from) : null;
  const incomingName = incomingPeer?.nickname || incomingPeer?.username || incomingCall?.from || "Unknown";
  const incomingId = incomingPeer?.username || incomingCall?.from || "";
  const incomingAvatarUrl = incomingPeer?.image || "";
  const incomingInitial = (incomingName || "U").charAt(0).toUpperCase();
  const isGroupChat = (username?: string) => !!username && username.startsWith("group_");
  const contactOptions = [
    ...incomingRequests.map((r) => ({ username: r.username, nickname: r.nickname, image: r.image || "" })),
    ...chatList
      .filter((c) => !isGroupChat(c.username))
      .map((c) => ({ username: c.username, nickname: c.nickname, image: c.image || "" })),
  ].filter((v, i, arr) => arr.findIndex((x) => x.username === v.username) === i && v.username !== myUniqueId);

  const parseJsonSafe = useCallback(async (res: Response, label: string) => {
    const text = await res.text();
    if (!text) {
      console.warn(`${label} empty response`, { status: res.status });
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (err) {
      console.error(`${label} invalid JSON`, { status: res.status, text });
      return null;
    }
  }, []);

  const ensureIceServers = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && iceServersRef.current?.length && turnFetchedAtRef.current && now - turnFetchedAtRef.current < 60_000) {
      return;
    }
    try {
      const res = await fetch("/api/turn", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      const servers = Array.isArray(data?.iceServers)
        ? data.iceServers
        : Array.isArray(data)
          ? data
          : null;
      if (servers && servers.length) {
        iceServersRef.current = servers;
        turnFetchedAtRef.current = now;
      }
    } catch {}
  }, []);

  const getRoomId = useCallback(
    (a?: string, b?: string, kind: "audio" | "video" = "video") => {
      const one = (a || "").trim();
      const two = (b || "").trim();
      if (!one || !two) return "";
      const pair = [one, two].sort().join("_");
      return `call_${pair}_${kind}`;
    },
    []
  );

  const openZegoCall = useCallback(
    async (kind: "audio" | "video", peerId: string) => {
      const roomId = getRoomId(myUniqueId, peerId, kind);
      if (!roomId) return;
      setZegoKind(kind);
      setZegoRoomId(roomId);
      setZegoOpen(true);
      setCallKind(kind);
      setCallStatus("active");
    },
    [getRoomId, myUniqueId]
  );

  const closeZegoCall = useCallback(() => {
    try {
      zegoInstanceRef.current?.destroy?.();
    } catch {}
    zegoInstanceRef.current = null;
    setZegoOpen(false);
    setZegoRoomId("");
    setCallStatus("idle");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let active = true;
    const loadTurn = async () => {
      try {
        const res = await fetch("/api/turn", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const servers = Array.isArray(data?.iceServers)
          ? data.iceServers
          : Array.isArray(data)
            ? data
            : null;
        if (active && servers && servers.length) {
          iceServersRef.current = servers;
        }
      } catch {}
    };
    loadTurn();
    return () => {
      active = false;
    };
  }, []);

  const fetchUserProfile = useCallback(async (username: string) => {
    if (!username) return null;
    try {
      const res = await fetch(`/api/users/search?username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (data?.success && data.user) {
        return {
          username: data.user.uniqueUsername || username,
          nickname: data.user.nickname || data.user.name || "",
          image: data.user.image || "",
        };
      }
    } catch {}
    return null;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!showAttachMenu) return;
    const onDocClick = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest?.("#attach-menu") || target?.closest?.("#attach-toggle")) return;
      setShowAttachMenu(false);
    };
    document.addEventListener("mousedown", onDocClick as EventListener);
    document.addEventListener("touchstart", onDocClick as EventListener);
    return () => {
      document.removeEventListener("mousedown", onDocClick as EventListener);
      document.removeEventListener("touchstart", onDocClick as EventListener);
    };
  }, [showAttachMenu]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("msgly_locks");
    if (raw) {
      try {
        setLockedChats(JSON.parse(raw));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("msgly_locks", JSON.stringify(lockedChats));
  }, [lockedChats]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem("msgly_calllog");
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setCallLog(
            parsed.map((c, idx) => ({
              ...c,
              id: c.id || `${c.ts || Date.now()}-${c.user || "u"}-${idx}`,
            }))
          );
        }
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("msgly_calllog", JSON.stringify(callLog));
  }, [callLog]);

  useEffect(() => {
    if (activeTab !== "calls") {
      setCallSelectionMode(false);
      setSelectedCallIds([]);
    }
  }, [activeTab]);

  useEffect(() => {
    setSelectedCallIds((prev) => prev.filter((id) => callLog.some((c: any) => String(c.id) === id)));
  }, [callLog]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("msgly_theme");
    if (saved) setThemeId(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("msgly_theme", themeId);
  }, [themeId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem("msgly_font");
    if (saved) setFontId(saved);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("msgly_font", fontId);
  }, [fontId]);

  useEffect(() => {
    const stream = remoteStreamRef.current;
    if (!stream) return;
    if (callKind === "video" && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = stream;
      remoteVideoRef.current.muted = true;
      remoteVideoRef.current.playsInline = true;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = stream;
      remoteAudioRef.current.muted = false;
      remoteAudioRef.current.volume = 1;
      remoteAudioRef.current.play().catch(() => {});
    }
  }, [remoteStreamTick, callKind]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!socket.connected) socket.connect();
    const onConnect = () => console.log("[socket] connected", socket.id, socketUrl);
    const onError = (err: any) => console.log("[socket] connect_error", err?.message || err);
    const onDisconnect = (reason: any) => console.log("[socket] disconnected", reason);
    socket.on("connect", onConnect);
    socket.on("connect_error", onError);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("connect_error", onError);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    if (!zegoOpen || !zegoRoomId || typeof window === "undefined") return;
    let cancelled = false;
    const join = async () => {
      try {
        const res = await fetch("/api/zego/token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: myUniqueId,
            userName: myNickname || myUniqueId,
            roomId: zegoRoomId,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.token || cancelled) {
          alert("Zego token error. Check ZEGO_APP_ID / ZEGO_SERVER_SECRET in Vercel.");
          closeZegoCall();
          return;
        }
        const { ZegoUIKitPrebuilt } = await import("@zegocloud/zego-uikit-prebuilt");
        const zp = ZegoUIKitPrebuilt.create(data.token);
        zegoInstanceRef.current = zp;
        const mode =
          zegoKind === "audio"
            ? ZegoUIKitPrebuilt.OneONoneCall
            : ZegoUIKitPrebuilt.OneONoneCall;
        zp.joinRoom({
          container: zegoContainerRef.current,
          scenario: { mode },
          turnOnMicrophoneWhenJoining: true,
          turnOnCameraWhenJoining: zegoKind === "video",
          showScreenSharingButton: false,
          showTextChat: false,
          showUserList: false,
          showPreJoinView: false,
          onLeaveRoom: () => {
            const target = callPeerRef.current || selectedChat?.username;
            if (target) {
              socket.emit("call:end", { to: target, from: myUniqueId });
            }
            closeZegoCall();
          },
        });
      } catch (err) {
        console.error("Zego join error", err);
        closeZegoCall();
      }
    };
    join();
    return () => {
      cancelled = true;
    };
  }, [zegoOpen, zegoRoomId, zegoKind, myUniqueId, myNickname, selectedChat, closeZegoCall]);

  const logCall = useCallback(
    (entry: {
      user: string;
      kind: "audio" | "video";
      direction: "outgoing" | "incoming";
      status: string;
      durationSec?: number;
    }) => {
      const id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      setCallLog((prev) => [{ id, ...entry, ts: new Date().toISOString() }, ...prev].slice(0, 20));
    },
    []
  );

  const toggleSelectMessage = (id: string) => {
    setSelectedMessageIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearSelection = () => {
    setSelectedMessageIds([]);
    setSelectionMode(false);
  };

  const deleteSelected = () => {
    if (!selectedMessageIds.length) return;
    setAllMessages((prev) => prev.filter((m: any) => !selectedMessageIds.includes(String(m.id))));
    clearSelection();
  };

  const toggleCallSelect = (id: string) => {
    setSelectedCallIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const clearCallSelection = () => {
    setSelectedCallIds([]);
    setCallSelectionMode(false);
  };

  const deleteSelectedCalls = () => {
    if (!selectedCallIds.length) return;
    setCallLog((prev) => prev.filter((c: any) => !selectedCallIds.includes(String(c.id))));
    clearCallSelection();
  };

  const deleteSingleCall = (id: string) => {
    setCallLog((prev) => prev.filter((c: any) => String(c.id) !== id));
  };

  const openLockModal = (username: string, mode: "set" | "unlock") => {
    setLockTarget(username);
    setLockMode(mode);
    setLockInput("");
    setLockNoteAck(false);
    setShowLockModal(true);
  };

  const validatePassword = (p: string) => {
    if (p.length !== 6) return false;
    const hasLetter = /[a-zA-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    return hasLetter && hasNumber;
  };

  const themes = [
    {
      id: "aurora",
      name: "Aurora",
      bg: "linear-gradient(135deg, #0b1220 0%, #0f172a 50%, #0b0f16 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #ffffff 0%, #e5f3ff 60%, #bfe7ff 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "sunset",
      name: "Sunset",
      bg: "linear-gradient(135deg, #2b1631 0%, #3b1d2d 45%, #2b1b1f 100%)",
      panel: "rgba(255,255,255,0.06)",
      sent: "linear-gradient(135deg, #fff1e6 0%, #ffd6c2 60%, #ffb3b3 100%)",
      recv: "rgba(255,255,255,0.1)",
    },
    {
      id: "ocean",
      name: "Ocean",
      bg: "linear-gradient(135deg, #071b2c 0%, #0a2a3f 55%, #05151f 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #e6f7ff 0%, #c2ecff 60%, #9fdcff 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "forest",
      name: "Forest",
      bg: "linear-gradient(135deg, #0d1b16 0%, #123024 55%, #0b1612 100%)",
      panel: "rgba(255,255,255,0.06)",
      sent: "linear-gradient(135deg, #f2fff3 0%, #c9f3d0 60%, #b0e7c0 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "violet",
      name: "Violet",
      bg: "linear-gradient(135deg, #17122b 0%, #24163a 55%, #140e22 100%)",
      panel: "rgba(255,255,255,0.06)",
      sent: "linear-gradient(135deg, #f5f0ff 0%, #e0d4ff 60%, #c3b0ff 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "ember",
      name: "Ember",
      bg: "linear-gradient(135deg, #240b0b 0%, #3a1612 55%, #1a0b0b 100%)",
      panel: "rgba(255,255,255,0.06)",
      sent: "linear-gradient(135deg, #fff0e6 0%, #ffd2b3 60%, #ffb07a 100%)",
      recv: "rgba(255,255,255,0.09)",
    },
    {
      id: "mint",
      name: "Mint",
      bg: "linear-gradient(135deg, #0b1f1a 0%, #103028 55%, #081814 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #f0fffb 0%, #c9f7ee 60%, #9fead8 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "royal",
      name: "Royal",
      bg: "linear-gradient(135deg, #0a1126 0%, #111a3a 55%, #0a0f20 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #eef3ff 0%, #cfdcff 60%, #a9bfff 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "peach",
      name: "Peach",
      bg: "linear-gradient(135deg, #2b1512 0%, #3a1e16 55%, #20100d 100%)",
      panel: "rgba(255,255,255,0.06)",
      sent: "linear-gradient(135deg, #fff4ee 0%, #ffd8c7 60%, #ffbfa4 100%)",
      recv: "rgba(255,255,255,0.09)",
    },
    {
      id: "ice",
      name: "Ice",
      bg: "linear-gradient(135deg, #0b1720 0%, #102330 55%, #0a141b 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #f4fbff 0%, #d7f0ff 60%, #b7e2ff 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "sand",
      name: "Sand",
      bg: "linear-gradient(135deg, #1f1a0f 0%, #2a2315 55%, #15110a 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #fff7e8 0%, #f3e0b7 60%, #e3c58d 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "berry",
      name: "Berry",
      bg: "linear-gradient(135deg, #1f0b1a 0%, #2b1024 55%, #160914 100%)",
      panel: "rgba(255,255,255,0.06)",
      sent: "linear-gradient(135deg, #fff0fa 0%, #f5c9e9 60%, #e9a6d7 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "citrus",
      name: "Citrus",
      bg: "linear-gradient(135deg, #1a1a0b 0%, #24240f 55%, #121209 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #fffbe5 0%, #f7efb3 60%, #ecd77a 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "nebula",
      name: "Nebula",
      bg: "linear-gradient(135deg, #0c0f1f 0%, #131a33 55%, #0a0d18 100%)",
      panel: "rgba(255,255,255,0.05)",
      sent: "linear-gradient(135deg, #eef2ff 0%, #cfd9ff 60%, #aab8ff 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
    {
      id: "rosewood",
      name: "Rosewood",
      bg: "linear-gradient(135deg, #200d12 0%, #2c121a 55%, #16080b 100%)",
      panel: "rgba(255,255,255,0.06)",
      sent: "linear-gradient(135deg, #fff0f3 0%, #f9c9d4 60%, #eea2b6 100%)",
      recv: "rgba(255,255,255,0.08)",
    },
  ];

  const activeTheme = themes.find((t) => t.id === themeId) || themes[0];

  const fonts = [
    { id: "geist", name: "Geist", stack: "var(--font-geist-sans), ui-sans-serif, system-ui" },
    { id: "ui", name: "UI Sans", stack: "system-ui, -apple-system, Segoe UI, Roboto" },
    { id: "human", name: "Humanist", stack: "Tahoma, Trebuchet MS, Verdana, sans-serif" },
    { id: "slab", name: "Slab", stack: "Rockwell, Georgia, serif" },
    { id: "neo", name: "Neo Grotesk", stack: "Segoe UI, Helvetica, Arial, sans-serif" },
    { id: "mono", name: "Mono", stack: "Consolas, Menlo, Monaco, monospace" },
    { id: "round", name: "Rounded", stack: "\"Comic Sans MS\", \"Arial Rounded MT Bold\", Arial, sans-serif" },
    { id: "gothic", name: "Gothic", stack: "\"Century Gothic\", \"Franklin Gothic\", Arial, sans-serif" },
    { id: "serif", name: "Serif", stack: "Georgia, \"Times New Roman\", serif" },
    { id: "modern", name: "Modern", stack: "Calibri, Candara, Segoe, sans-serif" },
    ];
    const activeFont = fonts.find((f) => f.id === fontId) || fonts[0];
    const modalVars = {
      background: activeTheme.bg,
      "--modal-panel": activeTheme.panel,
      "--modal-panel-strong": activeTheme.recv,
      "--modal-accent": activeTheme.sent,
    } as CSSProperties;

  const submitLock = () => {
    if (!lockTarget) return;
    if (lockMode === "set") {
      if (!validatePassword(lockInput)) {
        alert("Password must be 6 characters and include letters + numbers.");
        return;
      }
      if (!lockNoteAck) {
        alert("Please check the box to confirm you noted the password.");
        return;
      }
      setLockedChats((prev) => ({ ...prev, [lockTarget]: { password: lockInput } }));
      setShowLockModal(false);
      setLockTarget(null);
      return;
    }
    const existing = lockedChats[lockTarget];
    if (!existing || existing.password !== lockInput) {
      alert("Incorrect password.");
      return;
    }
    setLockedChats((prev) => {
      const next = { ...prev };
      delete next[lockTarget];
      return next;
    });
    setShowLockModal(false);
    setLockTarget(null);
  };

  const forwardSelected = async () => {
    if (!selectedMessageIds.length) return;
    setForwardMessageId("MULTI");
    setShowForwardModal(true);
  };

  const downloadSelected = () => {
    if (!selectedMessageIds.length) return;
    const messages = allMessages.filter((m: any) => selectedMessageIds.includes(String(m.id)));
    messages.forEach((m: any) => downloadMessage(m));
    clearSelection();
  };

  const downloadMessage = (m: any) => {
    if (m.mediaUrl) {
      const a = document.createElement("a");
      a.href = m.mediaUrl;
      a.download = "attachment";
      a.target = "_blank";
      a.rel = "noreferrer";
      a.click();
      return;
    }
    const blob = new Blob([m.text || ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "message.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteMessage = (id: string) => {
    setAllMessages((prev) => prev.filter((m: any) => String(m.id) !== String(id)));
  };

  const forwardMessage = (id: string) => {
    setForwardMessageId(String(id));
    setShowForwardModal(true);
  };

  const forwardToUser = async (toUser: string) => {
    if (!forwardMessageId) return;
    if (forwardMessageId === "MULTI") {
      const messages = allMessages.filter((m: any) => selectedMessageIds.includes(String(m.id)));
      for (const m of messages) {
        await sendDirectMessage(toUser, m.text || "", m.mediaUrl || "", m.mediaType || "");
      }
      clearSelection();
    } else {
      const msg = allMessages.find((m: any) => String(m.id) === String(forwardMessageId));
      if (!msg) return;
      await sendDirectMessage(toUser, msg.text || "", msg.mediaUrl || "", msg.mediaType || "");
    }
    setShowForwardModal(false);
    setForwardMessageId(null);
  };

  const downloadSingle = (id: string) => {
    const msg = allMessages.find((m: any) => String(m.id) === String(id));
    if (!msg) return;
    downloadMessage(msg);
  };

  const loadInbox = useCallback(async () => {
    if (!profileLoaded || !myUniqueId || myUniqueId === "user") {
      return;
    }
    try {
      const res = await fetch(`/api/requests?inbox=1&user=${encodeURIComponent(myUniqueId)}`);
      const data = await parseJsonSafe(res, "inbox");
      if (!res.ok || !data) return;
      setIncomingRequests(Array.isArray(data?.items) ? data.items : []);
    } catch (err) {
      console.error("Inbox error", err);
    }
  }, [profileLoaded, myUniqueId, parseJsonSafe]);

  const loadChats = useCallback(async () => {
    if (!profileLoaded || !myUniqueId || myUniqueId === "user") {
      return;
    }
    try {
      const res = await fetch(`/api/chats?me=${encodeURIComponent(myUniqueId)}`);
      const data = await parseJsonSafe(res, "chats");
      if (!res.ok || !data) return;
      const items = Array.isArray(data?.items) ? data.items : [];
      setChatList((prev) => (items.length ? items : prev));
    } catch (err) {
      console.error("Chat list error", err);
    }
  }, [profileLoaded, myUniqueId, parseJsonSafe]);

  const handleSearch = async () => {
    const query = searchQuery.trim();
    if (!query) return;
    try {
      const res = await fetch(`/api/users/search?username=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data?.success && data.user) {
        setSearchResult(data.user);
        setSelectedChat(data.user);
        setSearchQuery("");
        return;
      }
      setSearchResult(null);
      alert("Bhai, ye unique ID database mein nahi mili!");
    } catch (err) {
      console.error("Search error", err);
      alert("Search error");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const cached = window.localStorage.getItem("msgly_uid");
    if (cached && !resolvedUserId) {
      setResolvedUserId(cached);
      setCurrentUsername(cached);
      setDraftUsername(cached);
      setProfileLoaded(true);
    }
  }, [resolvedUserId]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!userEmail) return;
      try {
        const res = await fetch(`/api/users/profile?email=${encodeURIComponent(userEmail)}`);
        const data = await res.json();
        if (data?.success && data.user) {
          if (data.user.uniqueUsername) {
            setCurrentUsername(data.user.uniqueUsername);
            setDraftUsername(data.user.uniqueUsername);
            setResolvedUserId(data.user.uniqueUsername);
            if (typeof window !== "undefined") {
              window.localStorage.setItem("msgly_uid", data.user.uniqueUsername);
            }
          } else {
            setResolvedUserId(derivedUserId);
          }
          if (data.user.image) setProfileImage(data.user.image);
          if (data.user.status) setStatusText(data.user.status);
        } else {
          setResolvedUserId(derivedUserId);
        }
      } catch (err) {
        console.error("Profile load error", err);
        setResolvedUserId(derivedUserId);
      } finally {
        setProfileLoaded(true);
      }
    };
    loadProfile();
  }, [userEmail, derivedUserId]);

  useEffect(() => {
    if (!profileLoaded || !myUniqueId || myUniqueId === "user") return;
    if (!socket.connected) {
      socket.connect();
    }
    loadInbox();
    loadChats();
  }, [profileLoaded, myUniqueId, loadInbox, loadChats]);

  useEffect(() => {
    socket.on("receive-message", (data) => {
      const selectedIsGroup = isGroupChat(selectedChat?.username);
      if (
        (!selectedIsGroup &&
          ((data.sender === selectedChat?.username && data.receiver === myUniqueId) ||
            (data.sender === myUniqueId && data.receiver === selectedChat?.username))) ||
        (selectedIsGroup && data.receiver === selectedChat?.username)
      ) {
        setAllMessages((prev) => [
          ...prev,
          {
            ...data,
            type: data.type === "system" ? "system" : data.sender === myUniqueId ? "sent" : "received",
            bubble: data.text || "",
          },
        ]);
      }
      if (data.sender === myUniqueId || data.receiver === myUniqueId || isGroupChat(data.receiver)) {
        const other = isGroupChat(data.receiver)
          ? data.receiver
          : data.sender === myUniqueId
          ? data.receiver
          : data.sender;
        const preview =
          data.text ||
          (data.mediaType?.startsWith("image") ? "[Image]" : data.mediaType?.startsWith("video") ? "[Video]" : data.mediaUrl ? "[Document]" : "");
        setChatList((prev) => {
          const existing = prev.find((c) => c.username === other);
          const filtered = prev.filter((c) => c.username !== other);
          return [
            {
              username: other,
              nickname: existing?.nickname || "",
              image: existing?.image || "",
              lastMessage: preview,
              lastTimestamp: new Date(),
              isGroup: existing?.isGroup || isGroupChat(other),
              description: existing?.description || "",
            },
            ...filtered,
          ];
        });
        if ((data.receiver === myUniqueId || isGroupChat(data.receiver)) && selectedChat?.username !== other) {
          setUnreadCounts((prev) => ({ ...prev, [other]: (prev[other] || 0) + 1 }));
        }
      }
    });
    socket.on("receive-request", (data) => {
      if (data?.receiver === myUniqueId) {
        setIncomingRequests((prev) => {
          if (prev.some((p) => p.username === data.sender)) return prev;
          return [{ username: data.sender, nickname: data.nickname || "" }, ...prev];
        });
      }
    });
    socket.on("request-updated", (data) => {
      if (data?.receiver === myUniqueId || data?.sender === myUniqueId) {
        setIncomingRequests((prev) => prev.filter((p) => p.username !== data.sender));
      }
    });
    socket.on("typing", (data) => {
      if (data?.sender === selectedChat?.username && data?.receiver === myUniqueId) {
        setIsTypingFriend(true);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsTypingFriend(false), 1500);
      }
    });
    socket.on("username-updated", (data) => {
      const { oldUsername, newUsername } = data || {};
      if (!oldUsername || !newUsername) return;
      setChatList((prev) =>
        prev.map((c) => (c.username === oldUsername ? { ...c, username: newUsername } : c))
      );
      setIncomingRequests((prev) =>
        prev.map((r) => (r.username === oldUsername ? { ...r, username: newUsername } : r))
      );
      setUnreadCounts((prev) => {
        if (!prev[oldUsername]) return prev;
        const next = { ...prev };
        next[newUsername] = (next[newUsername] || 0) + next[oldUsername];
        delete next[oldUsername];
        return next;
      });
      setSelectedChat((prev: any) => {
        if (!prev) return prev;
        if (prev.username !== oldUsername) return prev;
        return { ...prev, username: newUsername };
      });
    });
    socket.on("profile-updated", (data) => {
      if (!data?.username) return;
      setChatList((prev) =>
        prev.map((c) => (c.username === data.username ? { ...c, image: data.image || "" } : c))
      );
      setIncomingRequests((prev) =>
        prev.map((r) => (r.username === data.username ? { ...r, image: data.image || "" } : r))
      );
      setSelectedChat((prev: any) => {
        if (!prev) return prev;
        if (prev.username !== data.username) return prev;
        return { ...prev, image: data.image || "" };
      });
    });
    socket.on("call:offer", async (data) => {
      if (data?.to !== myUniqueId) return;
      const peer = (resolveCallPeer(data.from) || { username: data.from }) as {
        username: string;
        nickname?: string;
        image?: string;
      };
      callPeerRef.current = peer.username;
      setCallPeer(peer);
      const incomingKind = data.kind || "video";
      setCallKind(incomingKind);
      setIncomingCall({ from: data.from, offer: data.offer || null, kind: incomingKind });
      setCallOpen(false);
      setCallMinimized(false);
      setCallStatus("ringing");
      startRingtone("incoming");
      logCall({ user: peer.username, kind: data.kind || "video", direction: "incoming", status: "ringing" });
      if (!peer.image) {
        const fetched = await fetchUserProfile(peer.username);
        if (fetched) {
          setCallPeer((prev: any) => ({ ...prev, ...fetched }));
          setChatList((prev) =>
            prev.map((c) => (c.username === fetched.username ? { ...c, image: fetched.image || c.image } : c))
          );
        }
      }
      if (!selectedChat || selectedChat.username !== data.from) {
        setSelectedChat(peer);
      }
    });
    socket.on("call:answer", async (data) => {
      if (data?.to !== myUniqueId || !data.answer) return;
      const pc = getPeerConnection();
      await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
      setCallStatus("active");
      callStartedAtRef.current = Date.now();
      stopRingtone();
      logCall({ user: data.from || "", kind: callKind, direction: "outgoing", status: "answered" });
    });
    socket.on("call:ice", async (data) => {
      if (data?.to !== myUniqueId || !data.candidate) return;
      const pc = getPeerConnection();
      try {
        await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
      } catch {}
    });
    socket.on("call:end", (data) => {
      if (data?.to !== myUniqueId) return;
      const durationSec = callStartedAtRef.current
        ? Math.max(0, Math.round((Date.now() - callStartedAtRef.current) / 1000))
        : undefined;
      closeZegoCall();
      endCall();
      if (data?.from) {
        logCall({ user: data.from, kind: callKind, direction: "incoming", status: "ended", durationSec });
      }
    });
    socket.on("call:reject", (data) => {
      if (data?.to !== myUniqueId) return;
      closeZegoCall();
      endCall();
      if (data?.from) logCall({ user: data.from, kind: callKind, direction: "incoming", status: "rejected" });
    });
    return () => {
      socket.off("receive-message");
      socket.off("receive-request");
      socket.off("request-updated");
      socket.off("typing");
      socket.off("username-updated");
      socket.off("profile-updated");
      socket.off("call:offer");
      socket.off("call:answer");
      socket.off("call:ice");
      socket.off("call:end");
      socket.off("call:reject");
    };
  }, [selectedChat, myUniqueId, parseJsonSafe, fetchUserProfile]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (!selectedChat?.username || !myUniqueId || isGroupChat(selectedChat.username)) {
        setRequestStatus(null);
        return;
      }
      try {
        const res = await fetch(`/api/requests?userA=${encodeURIComponent(myUniqueId)}&userB=${encodeURIComponent(selectedChat.username)}`);
        const data = await parseJsonSafe(res, "request-status");
        if (!res.ok || !data) return;
        setRequestStatus(data);
      } catch (err) {
        console.error("Request status error", err);
      }
    };
    fetchStatus();
  }, [selectedChat, myUniqueId, startRingtone, stopRingtone, logCall, callKind]);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?.username || !myUniqueId) {
        setAllMessages([]);
        return;
      }
      try {
        const res = await fetch(
          `/api/messages?chatWith=${encodeURIComponent(selectedChat.username)}&me=${encodeURIComponent(myUniqueId)}`
        );
        const data = await res.json();
        if (data?.success) {
          const formatted = data.data.map((m: any) => ({
            id: m._id || m.id,
            bubble: m.text,
            text: m.text,
            mediaUrl: m.mediaUrl,
            mediaType: m.mediaType,
            time: new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            type: m.sender === myUniqueId ? "sent" : "received",
          }));
          setAllMessages(formatted);
          if (data?.resolved?.chatWith && data.resolved.chatWith !== selectedChat.username) {
            setSelectedChat((prev: any) => (prev ? { ...prev, username: data.resolved.chatWith } : prev));
          }
        }
      } catch (err) {
        console.error("Messages load error", err);
      }
    };
    fetchMessages();
  }, [selectedChat, myUniqueId]);

  useEffect(() => {
    if (!messagesEndRef.current) return;
    messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length, selectedChat]);

  useEffect(() => {
    if (!selectedChat?.username) return;
    setUnreadCounts((prev) => {
      if (!prev[selectedChat.username]) return prev;
      const next = { ...prev };
      delete next[selectedChat.username];
      return next;
    });
  }, [selectedChat]);

  useEffect(() => {
    loadInbox();
    const interval = setInterval(loadInbox, 5000);
    const onFocus = () => loadInbox();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [loadInbox]);

  useEffect(() => {
    loadChats();
  }, [loadChats, allMessages.length]);

  const handleSendMessage = async (e: any) => {
    e.preventDefault();
    if (!message.trim() || !selectedChat) return;
    await sendMessagePayload({ text: message });
  };

  const handleRequestAction = async (action: "accept" | "reject" | "block" | "unblock") => {
    if (!requestSender || !requestReceiver) return;
    try {
      const res = await fetch("/api/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: requestSender,
          receiver: requestReceiver,
          action,
          actor: myUniqueId,
        }),
      });
      const data = await res.json();
      if (data?.success) {
        const statusRes = await fetch(`/api/requests?userA=${encodeURIComponent(myUniqueId)}&userB=${encodeURIComponent(selectedChat.username)}`);
        setRequestStatus(await statusRes.json());
        const inboxRes = await fetch(`/api/requests?inbox=1&user=${encodeURIComponent(myUniqueId)}`);
        const inboxData = await inboxRes.json();
        setIncomingRequests(Array.isArray(inboxData?.items) ? inboxData.items : []);
        socket.emit("request-updated", {
          sender: requestSender,
          receiver: requestReceiver,
          action,
        });
      }
    } catch (err) {
      console.error("Request action error", err);
    }
  };

  const emitTyping = () => {
    if (!selectedChat?.username || !myUniqueId) return;
    socket.emit("typing", {
      sender: myUniqueId,
      receiver: selectedChat.username,
    });
  };

  const handleUpload = async (file: File) => {
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("resourceType", "image");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.success && data.url) {
        setProfileImage(data.url);
        if (userEmail) {
          await fetch("/api/users/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: userEmail,
              uniqueUsername: currentUsername || myUniqueId,
              image: data.url,
              status: statusText,
            }),
          });
          socket.emit("profile-updated", {
            username: currentUsername || myUniqueId,
            image: data.url,
          });
        }
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };
  
  const handleDeleteAvatar = async () => {
    const previousImage = profileImage;
    setProfileImage("");
    try {
      setUploading(true);
      if (!userEmail) return;
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          uniqueUsername: currentUsername || myUniqueId,
          image: "",
          status: statusText,
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        setProfileImage(previousImage);
        alert(data?.message || "Delete failed");
        return;
      }
      socket.emit("profile-updated", {
        username: currentUsername || myUniqueId,
        image: "",
      });
    } catch (err) {
      console.error("Delete avatar error", err);
      setProfileImage(previousImage);
      alert("Delete error");
    } finally {
      setUploading(false);
    }
  };

  const sendMessagePayload = async (payload: { text?: string; mediaUrl?: string; mediaType?: string }) => {
    if (!selectedChat) return;
    const isGroup = isGroupChat(selectedChat.username);
    if (!isGroup) {
      if (requestStatus?.status === "blocked" && requestStatus?.blockedBy === selectedChat.username) {
        alert("You have been blocked.");
        return;
      }
      if (requestStatus?.status === "blocked" && requestStatus?.blockedBy === myUniqueId) {
        alert("You have blocked this user.");
        return;
      }
      if (requestStatus?.status === "pending" && requestStatus?.direction === "incoming") {
        alert("Please accept request first.");
        return;
      }
    }

    const msgData = {
      id: Date.now(),
      text: payload.text || "",
      mediaUrl: payload.mediaUrl || "",
      mediaType: payload.mediaType || "",
      sender: myUniqueId,
      receiver: selectedChat.username,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "sent",
    };

    setAllMessages((prev) => [
      ...prev,
      { ...msgData, bubble: payload.text || "" },
    ]);
    if (payload.text) setMessage("");

    try {
      if (!isGroup && (!requestStatus || requestStatus?.status === "none" || requestStatus?.status === "rejected")) {
        await fetch("/api/requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sender: myUniqueId, receiver: selectedChat.username }),
        });
        socket.emit("send-request", {
          sender: myUniqueId,
          receiver: selectedChat.username,
          nickname: myNickname,
        });
        const resStatus = await fetch(`/api/requests?userA=${encodeURIComponent(myUniqueId)}&userB=${encodeURIComponent(selectedChat.username)}`);
        setRequestStatus(await resStatus.json());
      }
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgData),
      });
      if (res.ok) socket.emit("send-message", msgData);
    } catch (error) {
      console.error("DB Error:", error);
    }
  };

  const handleMediaSelect = async (file: File, kind: "image" | "video" | "raw") => {
    const blockedExts = [".exe", ".bat", ".cmd", ".scr", ".js", ".vbs", ".msi",  ".jar", ".ps1"];
    const name = (file.name || "").toLowerCase();
    if (kind === "raw" && blockedExts.some((ext) => name.endsWith(ext))) {
      alert("Security warning: This file type is blocked.");
      return;
    }
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("resourceType", kind === "image" ? "image" : kind === "video" ? "video" : "raw");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (data?.success && data.url) {
        const mediaType = kind === "image" ? "image" : kind === "video" ? "video" : "document";
        await sendMessagePayload({ mediaUrl: data.url, mediaType });
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error("Upload error", err);
      alert("Upload error");
    }
  };

  const sendSystemMessage = async (toUser: string, text: string) => {
    if (!toUser || !myUniqueId) return;
    if (requestStatus?.status === "blocked" && requestStatus?.blockedBy === toUser) return;
    if (requestStatus?.status === "blocked" && requestStatus?.blockedBy === myUniqueId) return;
    const msgData = {
      id: Date.now(),
      text,
      mediaUrl: "",
      mediaType: "",
      sender: myUniqueId,
      receiver: toUser,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "system",
    };
    if (selectedChat?.username === toUser) {
      setAllMessages((prev) => [...prev, { ...msgData, bubble: text }]);
    }
    setChatList((prev) => {
      const filtered = prev.filter((c) => c.username !== toUser);
      return [{ username: toUser, nickname: "", lastMessage: text, lastTimestamp: new Date() }, ...filtered];
    });
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgData),
      });
      if (res.ok) socket.emit("send-message", msgData);
    } catch (error) {
      console.error("System message error:", error);
    }
  };

  const sendDirectMessage = async (toUser: string, text: string, mediaUrl: string, mediaType: string) => {
    if (!toUser || !myUniqueId) return;
    const msgData = {
      id: Date.now(),
      text: text || "",
      mediaUrl: mediaUrl || "",
      mediaType: mediaType || "",
      sender: myUniqueId,
      receiver: toUser,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: "sent",
    };
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(msgData),
      });
      if (res.ok) socket.emit("send-message", msgData);
      setChatList((prev) => {
        const filtered = prev.filter((c) => c.username !== toUser);
        return [
          { username: toUser, nickname: "", lastMessage: text || "[Attachment]", lastTimestamp: new Date() },
          ...filtered,
        ];
      });
    } catch (error) {
      console.error("Forward error", error);
    }
  };

  const toggleGroupMember = (username: string) => {
    setGroupMembers((prev) =>
      prev.includes(username) ? prev.filter((u) => u !== username) : [...prev, username]
    );
  };

  const handleCreateGroup = async () => {
    const name = groupName.trim();
    const description = groupDesc.trim();
    if (!name || !description) {
      alert("Group name and description are required.");
      return;
    }
    if (groupMembers.length < 1) {
      alert("Select at least one member.");
      return;
    }
    try {
      setCreatingGroup(true);
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          members: [myUniqueId, ...groupMembers],
          createdBy: myUniqueId,
        }),
      });
      const data = await parseJsonSafe(res, "groups:create");
      if (!res.ok || !data?.group) {
        alert("Group create failed.");
        return;
      }
      const g = data.group;
      setChatList((prev) => [
        {
          username: g.id,
          nickname: g.name,
          image: "",
          lastMessage: "Group created",
          lastTimestamp: g.updatedAt || new Date(),
          isGroup: true,
          description: g.description || "",
        },
        ...prev.filter((c) => c.username !== g.id),
      ]);
      setSelectedChat({
        username: g.id,
        nickname: g.name,
        image: "",
        isGroup: true,
        description: g.description || "",
      });
      setShowGroupModal(false);
      setGroupName("");
      setGroupDesc("");
      setGroupMembers([]);
      sendSystemMessage(g.id, `${myUniqueId} created the group "${g.name}".`);
    } catch (err) {
      console.error("Group create error", err);
      alert("Group create error");
    } finally {
      setCreatingGroup(false);
    }
  };

  const getPeerConnection = () => {
    if (pcRef.current) return pcRef.current;
    const defaultIceServers: RTCIceServer[] = [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUser = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCred = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;
    const envTurnServers: RTCIceServer[] = [];
    if (turnUrl && turnUser && turnCred) {
      const turnUrls = turnUrl
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      envTurnServers.push({
        urls: turnUrls.length > 0 ? turnUrls : turnUrl,
        username: turnUser,
        credential: turnCred,
      });
    }
    const rawServers = iceServersRef.current?.length
      ? iceServersRef.current
      : [...defaultIceServers, ...envTurnServers];
    const hasTurn = rawServers.some((s) => {
      const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
      return urls.some((u) => typeof u === "string" && (u.startsWith("turn:") || u.startsWith("turns:")));
    });
    const turnOnlyServers = rawServers
      .map((s): RTCIceServer | null => {
        const urls = Array.isArray(s.urls) ? s.urls : [s.urls];
        const turnOnly = urls.filter((u) => typeof u === "string" && (u.startsWith("turn:") || u.startsWith("turns:")));
        if (!turnOnly.length) return null;
        const preferTcp = turnOnly.filter(
          (u) => u.includes("transport=tcp") || u.startsWith("turns:") || u.includes(":443")
        );
        const finalUrls = preferTcp.length ? preferTcp : turnOnly;
        return { ...s, urls: finalUrls };
      })
      .filter((v): v is RTCIceServer => v !== null);
    const iceServers = hasTurn && turnOnlyServers.length ? turnOnlyServers : rawServers;
    const pc = new RTCPeerConnection({
      iceServers,
      iceTransportPolicy: hasTurn ? "relay" : "all",
      bundlePolicy: "max-bundle",
    });
    pc.onicecandidate = (event) => {
      const target = callPeerRef.current || selectedChat?.username;
      if (!event.candidate || !target) return;
      socket.emit("call:ice", {
        to: target,
        from: myUniqueId,
        candidate: event.candidate,
      });
    };
    pc.ontrack = (event) => {
      const stream = event.streams?.[0];
      if (stream) {
        remoteStreamRef.current = stream;
      } else {
        if (!remoteStreamRef.current) remoteStreamRef.current = new MediaStream();
        remoteStreamRef.current.addTrack(event.track);
      }
      const activeStream = remoteStreamRef.current;
      if (activeStream && remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = activeStream;
        remoteVideoRef.current.muted = true;
        remoteVideoRef.current.playsInline = true;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (activeStream && remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = activeStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1;
        remoteAudioRef.current.play().catch(() => {});
      }
      setRemoteStreamTick((v) => v + 1);
    };
    pc.onicecandidateerror = (event: any) => {
      console.warn("[webrtc] icecandidateerror", event?.errorText || event);
    };
    pc.oniceconnectionstatechange = () => {
      console.log("[webrtc] ice", pc.iceConnectionState);
      if (pc.iceConnectionState === "failed") {
        console.warn("[webrtc] ICE failed — TURN may be required");
      }
    };
    pc.onconnectionstatechange = () => {
      console.log("[webrtc] connection", pc.connectionState);
    };
    pc.addEventListener("iceconnectionstatechange", () => {
      if (pc.iceConnectionState !== "failed") return;
      console.warn("[webrtc] ICE failed -- retry with fresh TURN");
      ensureIceServers(true).then(() => {
        try {
          const refreshed = iceServersRef.current;
          if (refreshed?.length) {
            pc.setConfiguration({ iceServers: refreshed, iceTransportPolicy: "relay", bundlePolicy: "max-bundle" });
          }
          if (pc.restartIce) pc.restartIce();
        } catch {}
      });
    });
    pcRef.current = pc;
    return pc;
  };

  const startLocalStream = async (kind: "video" | "audio") => {
    if (localStreamRef.current) return localStreamRef.current;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: kind === "video",
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    } catch (err: any) {
      const name = err?.name || "MediaError";
      const message =
        name === "NotFoundError"
          ? "No microphone/camera device found. Please connect one and try again."
          : name === "NotAllowedError"
          ? "Permission denied. Please allow microphone/camera access."
          : "Unable to access media devices.";
      alert(message);
      throw err;
    }
    localStreamRef.current = stream;
    if (kind === "video" && localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
      localVideoRef.current.play().catch(() => {});
    }
    return stream;
  };

  const endCall = () => {
    stopRingtone();
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    setCallStatus("idle");
    setCallOpen(false);
    setCallMinimized(false);
    setIncomingCall(null);
    setCallPeer(null);
    callPeerRef.current = null;
    callStartedAtRef.current = null;
    if (pcRef.current) {
      pcRef.current.onicecandidate = null;
      pcRef.current.ontrack = null;
      pcRef.current.close();
      pcRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((t) => t.stop());
      remoteStreamRef.current = null;
    }
    iceServersRef.current = null;
    turnFetchedAtRef.current = null;
  };

  const startCallTo = async (kind: "video" | "audio", targetUser?: string) => {
    const target = targetUser || selectedChat?.username;
    if (!target) return;
    setCallKind(kind);
    setCallOpen(false);
    setCallMinimized(false);
    setCallStatus("calling");
    let peer = resolveCallPeer(target) || (selectedChat?.username === target ? selectedChat : null) || { username: target };
    setCallPeer(peer);
    callPeerRef.current = peer.username;
    if (!peer?.image) {
      fetchUserProfile(peer.username).then((fetched) => {
        if (!fetched) return;
        setCallPeer((prev: any) => ({ ...prev, ...fetched }));
        setChatList((prev) =>
          prev.map((c) => (c.username === fetched.username ? { ...c, image: fetched.image || c.image } : c))
        );
        setSelectedChat((prev: any) => {
          if (!prev || prev.username !== fetched.username) return prev;
          if (prev.image && prev.image.length > 0) return prev;
          return { ...prev, image: fetched.image || prev.image };
        });
      });
    }
    socket.emit("call:offer", {
      to: peer.username,
      from: myUniqueId,
      offer: null,
      kind,
    });
    startRingtone("outgoing");
    logCall({ user: peer.username, kind, direction: "outgoing", status: "calling" });
    sendSystemMessage(peer.username, `${myUniqueId} is calling (${kind}).`);
    await openZegoCall(kind, peer.username);
  };

  const acceptCall = async () => {
    if (!incomingCall?.from) return;
    const currentCall = incomingCall;
    const kind: "video" | "audio" = currentCall?.kind || "video";
    setCallKind(kind);
    setCallOpen(false);
    setCallMinimized(false);
    setCallStatus("active");
    setIncomingCall(null);
    callStartedAtRef.current = Date.now();
    stopRingtone();
    socket.emit("call:answer", {
      to: currentCall.from,
      from: myUniqueId,
      answer: "ok",
      kind,
    });
    sendSystemMessage(currentCall.from, `${myUniqueId} answered the call.`);
    logCall({ user: currentCall.from, kind, direction: "incoming", status: "answered" });
    await openZegoCall(kind, currentCall.from);
  };

  const rejectCall = () => {
    if (incomingCall?.from) {
      socket.emit("call:reject", { to: incomingCall.from, from: myUniqueId });
      sendSystemMessage(incomingCall.from, `${myUniqueId} rejected the call.`);
      logCall({ user: incomingCall.from, kind: incomingCall.kind || "audio", direction: "incoming", status: "rejected" });
    }
    endCall();
  };

  const handleSystemClick = (text: string) => {
    if (!text) return;
    const match = text.match(/\((audio|video)\)/i);
    if (!match) return;
    const kind = match[1].toLowerCase() as "audio" | "video";
    const target = selectedChat?.username;
    if (target) startCallTo(kind, target);
  };

  const endCallAndNotify = () => {
    const target = callPeerRef.current || selectedChat?.username;
    if (target) {
      const durationSec = callStartedAtRef.current
        ? Math.max(0, Math.round((Date.now() - callStartedAtRef.current) / 1000))
        : undefined;
      socket.emit("call:end", { to: target, from: myUniqueId });
      sendSystemMessage(target, `${myUniqueId} ended the call.`);
      logCall({ user: target, kind: callKind, direction: "outgoing", status: "ended", durationSec });
    }
    endCall();
  };

  useEffect(() => {
    if (!callOpen) return;
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    // Stop ringtone after 30 seconds
    callTimeoutRef.current = window.setTimeout(() => {
      stopRingtone();
    }, 30000);
    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
        callTimeoutRef.current = null;
      }
    };
  }, [callOpen, callStatus, stopRingtone]);

  const handleSaveSettings = async () => {
    if (!userEmail) return;
    try {
      setSavingSettings(true);
      const oldUsername = currentUsername || myUniqueId;
      const usernameToSave = draftUsername.trim().toLowerCase();
      if (!usernameToSave) {
        alert("Username required");
        return;
      }
      const res = await fetch("/api/users/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          uniqueUsername: usernameToSave,
          image: profileImage,
          status: statusText,
        }),
      });
      const data = await res.json();
      if (!data?.success) {
        alert(data?.message || "Save failed");
        return;
      }
      if (data?.user?.uniqueUsername) {
        setCurrentUsername(data.user.uniqueUsername);
        setDraftUsername(data.user.uniqueUsername);
        setResolvedUserId(data.user.uniqueUsername);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("msgly_uid", data.user.uniqueUsername);
        }
        if (oldUsername && oldUsername !== data.user.uniqueUsername) {
          socket.emit("username-updated", { oldUsername, newUsername: data.user.uniqueUsername });
        }
      }
      if (data?.user?.image !== undefined) setProfileImage(data.user.image || "");
      if (data?.user?.status !== undefined) setStatusText(data.user.status || "");
      setActiveTab("chats");
      socket.emit("profile-updated", {
        username: data.user.uniqueUsername || myUniqueId,
        image: data.user.image || "",
      });
      try {
        const resChats = await fetch(`/api/chats?me=${encodeURIComponent(data.user.uniqueUsername || myUniqueId)}`);
        const chatsData = await resChats.json();
        setChatList(Array.isArray(chatsData?.items) ? chatsData.items : []);
      } catch {}
    } catch (err) {
      console.error("Save settings error", err);
      alert("Save error");
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <main
      className="h-[100dvh] text-white overflow-hidden flex items-center justify-center md:p-6 transition-all duration-300"
      style={{ background: activeTheme.bg, fontFamily: activeFont.stack }}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1200px_500px_at_20%_10%,rgba(0,168,255,0.15),transparent_60%)]" />

      <div
        className="relative w-full h-full max-w-[1400px] max-h-[900px] backdrop-blur-2xl md:border border-white/10 md:rounded-[2.5rem] shadow-2xl flex overflow-hidden z-10 transition-all duration-300 min-h-0"
        style={{ background: activeTheme.panel }}
      >
        
        {/* Sidebar */}
        <aside className="hidden lg:flex w-20 border-r border-white/5 flex-col items-center py-8 gap-8 bg-black/20">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 italic font-bold text-blue-400">M</div>
          <button
            className={activeTab === "chats" ? "text-blue-400" : "text-white/40"}
            onClick={() => {
              setActiveTab((prev) => (prev === "chats" ? "none" : "chats"));
              setSelectedChat(null);
            }}
          >
            <MessageSquare size={24} />
          </button>
          <button
            className={activeTab === "calls" ? "text-blue-400" : "text-white/40"}
            onClick={() => {
              setActiveTab((prev) => (prev === "calls" ? "none" : "calls"));
              setSelectedChat(null);
            }}
            aria-label="Calls"
          >
            <Phone size={22} />
          </button>
          <button
            className={activeTab === "settings" ? "text-blue-400" : "text-white/40"}
            onClick={() => {
              setActiveTab((prev) => (prev === "settings" ? "none" : "settings"));
              setSelectedChat(null);
            }}
          >
            <Settings size={24} />
          </button>
          <div className="mt-auto mb-4 flex flex-col items-center gap-4 text-center">
             <span className="text-[10px] text-blue-400 font-bold uppercase tracking-widest px-2">{myUniqueId}</span>
             <button className="text-white/40" onClick={() => signOut()}><LogOut size={20}/></button>
          </div>
        </aside>

        {/* Left Panel */}
        <section
          className={`w-full lg:w-96 border-r border-white/5 flex flex-col bg-black/10 transition-all duration-300 min-h-0 ${
            activeTab === "none" ? "hidden lg:flex" : "flex"
          } ${activeTab === "chats" && selectedChat ? "hidden lg:flex" : ""}`}
        >
          <AnimatePresence mode="wait">
          {activeTab === "chats" && (
          <motion.div
            key="panel-chats"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
          >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold tracking-tighter">Msgly</h2>
              <button
                onClick={() => {
                  setActiveTab("settings");
                  setSelectedChat(null);
                }}
                className="lg:hidden text-white/50 hover:text-white transition-colors"
                aria-label="Open settings"
              >
                <Settings size={20} />
              </button>
            </div>
              <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                <input 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  type="text" 
                  placeholder={`Your unique username is ${myUniqueId}`} 
                  className="w-full bg-white/5 border border-white/5 rounded-2xl py-2.5 pl-11 text-sm focus:outline-none focus:border-white/10" 
                />
              </div>
              <button
                onClick={() => setShowGroupModal(true)}
                className="bg-blue-600 p-2.5 rounded-2xl hover:bg-blue-500 transition-all shadow-lg"
                aria-label="Create group"
              >
                <UserPlus size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 min-h-0">
            {incomingRequests.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest ml-4 mb-2">Requests</p>
                {incomingRequests.map((req) => (
                  <div
                    key={req.username}
                    onClick={() => {
                      setSelectedChat({ username: req.username, nickname: req.nickname });
                      setUnreadCounts((prev) => {
                        const next = { ...prev };
                        delete next[req.username];
                        return next;
                      });
                    }}
                    className="p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all border border-white/10 bg-white/5 hover:bg-white/10 mb-3"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 flex items-center justify-center font-bold text-lg">
                      {(req.nickname || req.username || "U")[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm">{req.nickname || req.username}</h4>
                      <p className="text-[10px] text-white/40 truncate">@{req.username}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {chatList.length > 0 && (
              <div className="mb-4">
                <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest ml-4 mb-2">Chats</p>
                {chatList.map((chat) => (
                  <div
                    key={chat.username}
                    onClick={() => {
                      if (lockedChats[chat.username]) {
                        openLockModal(chat.username, "unlock");
                        return;
                      }
                      setSelectedChat({
                        username: chat.username,
                        nickname: chat.nickname,
                        image: chat.image,
                        isGroup: chat.isGroup,
                        description: chat.description || "",
                      });
                      setUnreadCounts((prev) => {
                        const next = { ...prev };
                        delete next[chat.username];
                        return next;
                      });
                    }}
                    className={`group relative p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all border border-transparent ${
                      selectedChat?.username === chat.username
                        ? "bg-white/10 border-white/10"
                        : unreadCounts[chat.username]
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "hover:bg-white/5"
                    }`}
                  >
                    {chat.image ? (
                      <img
                        src={chat.image}
                        alt="Profile"
                        className="w-12 h-12 rounded-2xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 flex items-center justify-center font-bold text-lg">
                        {(chat.nickname || chat.username || "U")[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={`text-sm truncate flex items-center gap-2 ${
                          unreadCounts[chat.username] ? "font-extrabold text-white" : "font-bold"
                        }`}
                      >
                        {chat.nickname || chat.username}
                        {lockedChats[chat.username] && <Lock size={12} className="text-white/60" />}
                      </h4>
                      <p
                        className={`text-[10px] truncate ${
                          unreadCounts[chat.username] ? "text-white/80 font-semibold" : "text-white/40"
                        }`}
                      >
                        {lockedChats[chat.username] ? "Locked chat" : chat.lastMessage || "Start conversation"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (lockedChats[chat.username]) {
                            openLockModal(chat.username, "unlock");
                          } else {
                            openLockModal(chat.username, "set");
                          }
                        }}
                        className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                        aria-label={lockedChats[chat.username] ? "Unlock chat" : "Chat options"}
                      >
                        {lockedChats[chat.username] ? <Unlock size={14} /> : <MoreHorizontal size={14} />}
                      </button>
                      {!lockedChats[chat.username] && (
                        <div
                          className="absolute right-4 top-14 w-40 rounded-2xl border border-white/10 backdrop-blur-2xl p-2 shadow-2xl z-20 hidden lg:block lg:group-hover:block"
                          style={{ background: activeTheme.panel }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openLockModal(chat.username, "set");
                            }}
                            className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10"
                          >
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-blue-500/20 text-blue-200">
                              <Lock size={12} />
                            </span>
                            Hide / Lock Chat
                          </button>
                        </div>
                      )}
                    </div>
                    {unreadCounts[chat.username] ? (
                      <div className="min-w-[20px] h-5 px-1.5 rounded-full bg-blue-500 text-[10px] font-bold text-white flex items-center justify-center">
                        {unreadCounts[chat.username]}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
            {searchResult && (
              <div 
                onClick={() => { setSelectedChat(searchResult); setSearchResult(null); }}
                className="p-4 rounded-[2rem] flex items-center gap-4 cursor-pointer transition-all border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 mb-4"
              >
                <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-xl">{searchResult.username[0].toUpperCase()}</div>
                <div className="flex-1">
                  <h4 className="font-bold text-sm">@{searchResult.username}</h4>
                  {searchResult.nickname && (
                    <p className="text-[10px] text-white/40">Nickname: {searchResult.nickname}</p>
                  )}
                  <p className="text-[10px] text-blue-400">User Verified 🛡️</p>
                </div>
              </div>
            )}
            
            <p className="text-[10px] text-white/20 uppercase font-bold tracking-widest ml-4 mb-2">Private Session</p>
            <div className="text-center py-10 opacity-20 italic text-sm">Enter a unique ID to establish link.</div>
          </div>
          </motion.div>
          )}

          {activeTab === "calls" && (
            <motion.div
              key="panel-calls"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col min-h-0"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-[0.3em]">History</p>
                    <h2 className="text-2xl font-bold tracking-tighter">Calls</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {callSelectionMode && (
                      <button
                        onClick={deleteSelectedCalls}
                        disabled={!selectedCallIds.length}
                        className="px-3 py-1.5 rounded-full text-[11px] bg-red-500/80 hover:bg-red-500 text-white disabled:opacity-50"
                      >
                        Delete {selectedCallIds.length || ""}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        if (callSelectionMode) {
                          clearCallSelection();
                        } else {
                          setCallSelectionMode(true);
                        }
                      }}
                      className="px-3 py-1.5 rounded-full text-[11px] bg-white/10 hover:bg-white/20 text-white"
                    >
                      {callSelectionMode ? "Cancel" : "Select"}
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-3 min-h-0">
                {callLog.length === 0 && (
                  <div className="text-center py-10 text-xs text-white/40">
                    No calls yet.
                  </div>
                )}
                {callLog.map((c, i) => {
                  const peer = resolveCallPeer(c.user);
                  const displayName = peer?.nickname || c.user || "Unknown";
                  const displayAvatar = peer?.image || "";
                  const callTime = formatCallTime(c.ts);
                  const callDuration = formatDuration(c.durationSec);
                  const KindIcon = c.kind === "audio" ? Phone : VideoCall;
                  const callId = String(c.id ?? `${c.user}-${i}`);
                  const isSelected = selectedCallIds.includes(callId);
                  return (
                    <div
                      key={callId}
                      onClick={() => {
                        if (callSelectionMode) toggleCallSelect(callId);
                      }}
                      className={`p-4 rounded-[2rem] flex items-center gap-4 transition-all border mb-3 ${
                        isSelected
                          ? "border-blue-400 bg-blue-500/10"
                          : "border-white/10 bg-white/5 hover:bg-white/10"
                      } ${callSelectionMode ? "cursor-pointer" : ""}`}
                    >
                      {callSelectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleCallSelect(callId)}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 accent-blue-500"
                        />
                      )}
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 shadow-lg shadow-blue-500/20 flex items-center justify-center font-bold text-lg overflow-hidden">
                        {displayAvatar ? (
                          <img src={displayAvatar} alt={displayName} className="h-full w-full object-cover" />
                        ) : (
                          <span>{(displayName || "U")[0]?.toUpperCase()}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm truncate">{displayName}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-white/40">
                          <KindIcon size={12} />
                          <span className="capitalize">{c.kind}</span>
                          <span>|</span>
                          <span className="capitalize">{c.direction}</span>
                          <span>|</span>
                          <span className="capitalize">{c.status}</span>
                          {callTime ? (
                            <>
                              <span>|</span>
                              <span>{callTime}</span>
                            </>
                          ) : null}
                          {callDuration ? (
                            <>
                              <span>|</span>
                              <span>{callDuration}</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startCallTo("audio", c.user)}
                          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                          aria-label="Audio call"
                        >
                          <Phone size={14} />
                        </button>
                        <button
                          onClick={() => startCallTo("video", c.user)}
                          className="h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                          aria-label="Video call"
                        >
                          <VideoCall size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSingleCall(callId);
                          }}
                          className="h-9 w-9 rounded-full bg-white/10 hover:bg-red-500/20 text-red-300 flex items-center justify-center"
                          aria-label="Delete call"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

            {activeTab === "settings" && (
              <motion.div
                key="panel-settings"
                className="flex h-full min-h-0 flex-col"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
            >
              <header className="p-4 md:p-6 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-bold text-sm md:text-base">Settings</h3>
                    <p className="text-[10px] text-white/40">Manage your profile</p>
                  </div>
                </div>
                <MoreVertical size={20} className="text-white/30 cursor-pointer" />
              </header>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 min-h-0">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-sm font-semibold mb-3">Profile Photo</h4>
                  <div className="flex items-center gap-4">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="h-16 w-16 rounded-2xl object-cover border border-white/10"
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold text-lg">
                        {myUniqueId[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-white/50 mb-2">Update your avatar</p>
                      <button
                        onClick={() => profileInputRef.current?.click()}
                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full"
                      >
                        Upload
                      </button>
                      <button
                        onClick={handleDeleteAvatar}
                        disabled={!profileImage || uploading}
                        className="ml-2 text-xs bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded-full disabled:opacity-50"
                      >
                        Delete
                      </button>
                      <input
                        ref={profileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleUpload(f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-sm font-semibold mb-3">Unique Username</h4>
                  <input
                    type="text"
                    value={draftUsername}
                    onChange={(e) => setDraftUsername(e.target.value)}
                    placeholder="Unique ID"
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm text-white focus:border-white/30 outline-none transition-all"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-sm font-semibold mb-3">Status</h4>
                  <input
                    type="text"
                    value={statusText}
                    onChange={(e) => setStatusText(e.target.value)}
                    placeholder="Busy, available, in class..."
                    className="w-full rounded-2xl border border-white/10 bg-black/40 px-5 py-3 text-sm text-white focus:border-white/30 outline-none transition-all"
                  />
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-sm font-semibold mb-3">Theme</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {themes.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => setThemeId(t.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          themeId === t.id ? "border-blue-400" : "border-white/10"
                        }`}
                        style={{ background: t.bg }}
                      >
                        <div className="text-xs font-semibold text-white/90">{t.name}</div>
                        <div className="mt-2 h-6 w-full rounded-lg" style={{ background: t.sent }} />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-sm font-semibold mb-3">Font</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {fonts.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontId(f.id)}
                        className={`rounded-2xl border p-3 text-left transition ${
                          fontId === f.id ? "border-blue-400" : "border-white/10"
                        }`}
                        style={{ fontFamily: f.stack }}
                      >
                        <div className="text-xs font-semibold text-white/90">{f.name}</div>
                        <div className="mt-1 text-[10px] text-white/60">Aa Bb 123</div>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="w-full rounded-2xl bg-white/90 py-3 text-sm font-bold text-black hover:bg-white transition disabled:opacity-60"
                >
                  {savingSettings ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>
        </section>

        {/* Chat Window */}
        <section className={`flex-1 flex flex-col bg-black/5 ${!selectedChat || activeTab !== "chats" ? 'hidden lg:flex' : 'flex'} relative overflow-hidden min-h-0`}>
          <div
            className="absolute inset-0 pointer-events-none opacity-10"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='220' height='220'%3E%3Ctext x='10' y='40' font-size='28'%3E%F0%9F%92%AC%3C/text%3E%3Ctext x='90' y='80' font-size='24'%3E%F0%9F%92%99%3C/text%3E%3Ctext x='30' y='140' font-size='26'%3E%F0%9F%94%92%3C/text%3E%3Ctext x='140' y='160' font-size='24'%3E%F0%9F%8E%A7%3C/text%3E%3Ctext x='170' y='50' font-size='22'%3E%F0%9F%92%A1%3C/text%3E%3C/svg%3E\")",
              backgroundSize: "220px 220px",
              backgroundRepeat: "repeat",
            }}
          />
          {selectedChat ? (
            <>
              <header className="p-3 md:p-4 border-b border-white/5 flex items-center justify-between backdrop-blur-md">
                  <div
                    onClick={() => setShowMediaPanel(true)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setShowMediaPanel(true);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    className="flex items-center gap-2 text-left"
                    aria-label="Open media panel"
                  >
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedChat(null);
                        }}
                        className="lg:hidden p-2 text-white/60"
                      >
                        <ArrowLeft size={20} />
                      </button>
                      {selectedChat?.image ? (
                        <img
                          src={selectedChat.image}
                          alt="Profile"
                          className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border border-white/10"
                        />
                      ) : (
                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-gradient-to-tr from-blue-500 to-cyan-500 shadow-lg flex items-center justify-center font-bold text-lg">
                          {selectedDisplayName ? selectedDisplayName[0].toUpperCase() : ""}
                        </div>
                      )}
                      <div>
                        <h3 className="font-bold text-sm md:text-base">
                          {selectedChat?.nickname || selectedChat?.username || "User"}
                        </h3>
                        {isGroupChat(selectedChat?.username) ? (
                          <p className="text-[10px] text-blue-300">Group: {selectedChat?.username}</p>
                        ) : (
                          <p className="text-[10px] text-green-400 animate-pulse">ID: {selectedChat?.username || ""}</p>
                        )}
                      </div>
                    </div>
                  </div>
                <div className="flex items-center gap-3">
                  {isMobile && selectionMode && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={deleteSelected}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-red-500/80 hover:bg-red-500 transition"
                        aria-label="Delete selected"
                      >
                        <Trash2 size={16} className="text-white" />
                      </button>
                      <button
                        onClick={forwardSelected}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition"
                        aria-label="Forward selected"
                      >
                        <Forward size={16} className="text-white/80" />
                      </button>
                      <button
                        onClick={downloadSelected}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition"
                        aria-label="Download selected"
                      >
                        <Download size={16} className="text-white/80" />
                      </button>
                      <button
                        onClick={clearSelection}
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition"
                        aria-label="Close selection"
                      >
                        <X size={16} className="text-white/80" />
                      </button>
                    </div>
                  )}
                  {!selectionMode && (
                    <button
                      onClick={() => setSelectionMode(true)}
                      className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition lg:hidden"
                      aria-label="Select messages"
                    >
                      <MoreHorizontal size={16} className="text-white/80" />
                    </button>
                  )}
                    <button
                      onClick={() => startCallTo("audio")}
                      className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition"
                      aria-label="Start audio call"
                    >
                    <Phone size={16} className="text-white/80" />
                  </button>
                    <button
                      onClick={() => startCallTo("video")}
                      className="flex items-center justify-center h-9 w-9 rounded-full bg-white/10 hover:bg-white/20 transition"
                      aria-label="Start video call"
                    >
                    <VideoCall size={16} className="text-white/80" />
                  </button>
                  <button
                    onClick={() => {
                      setActiveTab("settings");
                      setSelectedChat(null);
                    }}
                    className="lg:hidden text-white/50 hover:text-white transition-colors"
                    aria-label="Open settings"
                  >
                    <Settings size={18} />
                  </button>
                  <MoreVertical size={20} className="text-white/30 cursor-pointer" />
                </div>
              </header>

              {requestStatus?.status === "pending" && requestStatus?.direction === "incoming" && (
                <div className="mx-4 md:mx-6 mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex flex-wrap items-center gap-3">
                  <span className="text-xs text-white/70">Friend request from {selectedDisplayName || "user"}.</span>
                  <button onClick={() => handleRequestAction("accept")} className="text-xs bg-green-500/80 hover:bg-green-500 text-black px-3 py-1 rounded-full">Accept</button>
                  <button onClick={() => handleRequestAction("reject")} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full">Reject</button>
                  <button onClick={() => handleRequestAction("block")} className="text-xs bg-red-500/80 hover:bg-red-500 text-white px-3 py-1 rounded-full">Block</button>
                </div>
              )}

              {requestStatus?.status === "pending" && requestStatus?.direction === "outgoing" && (
                <div className="mx-4 md:mx-6 mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-white/70">
                  Request sent. Waiting for acceptance.
                </div>
              )}

              {requestStatus?.status === "blocked" && requestStatus?.blockedBy === selectedChat?.username && (
                <div className="mx-4 md:mx-6 mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
                  You have been blocked by this user.
                </div>
              )}

              {requestStatus?.status === "blocked" && requestStatus?.blockedBy === myUniqueId && (
                <div className="mx-4 md:mx-6 mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                  <span className="text-xs text-white/70">You blocked this user.</span>
                  <button onClick={() => handleRequestAction("unblock")} className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-full">Unblock</button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto overflow-x-visible p-3 md:p-4 space-y-2 scrollbar-hide">
                <AnimatePresence>
                  {allMessages.map((msg) => (
                    <Message
                      key={msg.id}
                      id={String(msg.id)}
                      bubble={msg.bubble ?? msg.text}
                      time={msg.time}
                      type={msg.type}
                      mediaUrl={msg.mediaUrl}
                      mediaType={msg.mediaType}
                      onDelete={deleteMessage}
                      onForward={forwardMessage}
                      onDownload={downloadSingle}
                      selectionMode={selectionMode}
                      selected={selectedMessageIds.includes(String(msg.id))}
                      onToggleSelect={toggleSelectMessage}
                      sentBg={activeTheme.sent}
                      recvBg={activeTheme.recv}
                      onSystemClick={handleSystemClick}
                    />
                  ))}
                </AnimatePresence>
                {isTypingFriend && (
                  <div className="flex items-center gap-2 pl-2">
                    <div className="flex items-center gap-1 rounded-full bg-white/5 border border-white/10 px-3 py-1.5">
                      <span className="text-[10px] text-white/50 italic">typing</span>
                      <span className="inline-flex gap-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.2s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce [animation-delay:-0.1s]" />
                        <span className="h-1.5 w-1.5 rounded-full bg-white/60 animate-bounce" />
                      </span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <footer className="p-3 md:p-4">
                <form onSubmit={handleSendMessage} className="relative bg-white/5 border border-white/10 rounded-[2rem] p-1 flex items-center gap-1.5 backdrop-blur-3xl shadow-2xl">
                  <button
                    type="button"
                    onClick={() => setShowAttachMenu((v) => !v)}
                    className="p-2.5 text-white/30 hover:text-white"
                    id="attach-toggle"
                  >
                    <Paperclip size={20} />
                  </button>
                  {showAttachMenu && (
                    <div
                      id="attach-menu"
                      className="absolute bottom-14 left-3 z-20 w-44 rounded-2xl border border-white/15 bg-white/10 backdrop-blur-2xl p-2 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                    >
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10 transition"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
                          <Camera size={14} className="text-amber-300" />
                        </span>
                        Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10 transition"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
                          <ImageIcon size={14} className="text-blue-300" />
                        </span>
                        Images
                      </button>
                      <button
                        type="button"
                        onClick={() => videoInputRef.current?.click()}
                        className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10 transition"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
                          <VideoIcon size={14} className="text-cyan-300" />
                        </span>
                        Video
                      </button>
                      <button
                        type="button"
                        onClick={() => docInputRef.current?.click()}
                        className="w-full flex items-center gap-2 text-left text-xs text-white/90 px-3 py-2 rounded-xl hover:bg-white/10 transition"
                      >
                        <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/10">
                          <FileText size={14} className="text-emerald-300" />
                        </span>
                        Document
                      </button>
                    </div>
                  )}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMediaSelect(f, "image");
                      e.currentTarget.value = "";
                      setShowAttachMenu(false);
                    }}
                  />
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMediaSelect(f, "image");
                      e.currentTarget.value = "";
                      setShowAttachMenu(false);
                    }}
                  />
                  <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMediaSelect(f, "video");
                      e.currentTarget.value = "";
                      setShowAttachMenu(false);
                    }}
                  />
                  <input
                    ref={docInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleMediaSelect(f, "raw");
                      e.currentTarget.value = "";
                      setShowAttachMenu(false);
                    }}
                  />
                  <input 
                    value={message} 
                    onChange={(e) => {
                      setMessage(e.target.value);
                      emitTyping();
                    }} 
                    placeholder="Type a secure message..." 
                    disabled={requestStatus?.status === "blocked" || (requestStatus?.status === "pending" && requestStatus?.direction === "incoming")}
                    className="flex-1 bg-transparent border-none outline-none text-sm py-2 px-2 disabled:opacity-40" 
                  />
                  <button type="submit" className="bg-white text-black p-3.5 rounded-[1.5rem] hover:scale-105 transition-all"><Send size={18} /></button>
                </form>
              </footer>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-white/20 gap-4">
              <div className="w-24 h-24 rounded-[2rem] bg-white/5 flex items-center justify-center border border-white/5">
                <User size={48} className="opacity-20" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-white/40">Your Unique ID: <span className="text-blue-400">{myUniqueId}</span></p>
                <p className="text-[10px] italic">Ready for secure transmission 🛰️</p>
              </div>
            </div>
          )}
        </section>

        {/* Incoming Call Popup */}
        <AnimatePresence>
          {incomingCall && callStatus === "ringing" && !callOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <motion.div
                initial={{ scale: 0.95, y: 10, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: 6, opacity: 0 }}
                className="relative w-[92%] max-w-md rounded-[2rem] border border-white/10 p-6 shadow-2xl"
                style={{ background: activeTheme.panel }}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                    Trying To Call
                  </p>
                  <span className="text-xs text-white/60">
                    {incomingCall.kind === "audio" ? "Audio" : "Video"}
                  </span>
                </div>

                <div className="mt-5 flex items-center gap-4">
                  {incomingAvatarUrl ? (
                    <img
                      src={incomingAvatarUrl}
                      alt={incomingName}
                      className="h-14 w-14 rounded-2xl object-cover border border-white/10"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-lg font-semibold">
                      {incomingInitial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-lg font-semibold truncate">{incomingName}</p>
                    <p className="text-[11px] text-white/50 truncate">{incomingId ? `@${incomingId}` : "Unknown ID"}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80">
                    {incomingCall.kind === "audio" ? <Phone size={16} /> : <VideoCall size={16} />}
                  </div>
                </div>

                <p className="mt-4 text-xs text-white/50">
                  Tap accept to start real-time audio/video, or reject to end the call.
                </p>

                <div className="mt-6 flex items-center gap-3">
                  <button
                    onClick={rejectCall}
                    className="flex-1 px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-lg"
                  >
                    Reject
                  </button>
                  <button
                    onClick={acceptCall}
                    className="flex-1 px-5 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-500 text-black text-xs font-semibold shadow-lg"
                  >
                    Accept
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Call Overlay */}
        <AnimatePresence>
          {callOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 pointer-events-none"
            >
              <div
                className={`absolute inset-0 flex ${
                  callMinimized
                    ? "items-end justify-end p-6 pointer-events-none"
                    : "items-center justify-center pointer-events-auto"
                }`}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.95, opacity: 0 }}
                  drag={callMinimized}
                  dragMomentum={false}
                  className={`relative rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl pointer-events-auto ${
                    callMinimized ? "w-72 h-40 md:w-80 md:h-44" : "w-full h-full md:w-[90%] md:h-[90%]"
                  }`}
                  onClick={(e) => {
                    if (!callMinimized) return;
                    const target = e.target as HTMLElement;
                    if (target.closest("button")) return;
                    setCallMinimized(false);
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#111827] to-[#0b1220]" />
                  <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
                  <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />

                  {!callMinimized && callKind === "video" && callStatus === "active" && (
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                  )}

                  <div className="relative z-10 h-full w-full flex flex-col items-center justify-between px-6 py-6 md:px-10 text-white">
                    <div className="w-full flex items-center justify-between text-[11px] uppercase tracking-[0.3em] text-white/60">
                      <span>{callKind === "audio" ? "Audio Call" : "Video Call"}</span>
                      <span>{callStatusLabel}</span>
                    </div>

                    <div className="flex flex-col items-center gap-3">
                      <div className="h-28 w-28 md:h-36 md:w-36 rounded-full border border-white/20 bg-white/10 shadow-2xl overflow-hidden flex items-center justify-center text-3xl font-semibold">
                        {callAvatarUrl ? (
                          <img src={callAvatarUrl} alt={activeCallName} className="h-full w-full object-cover" />
                        ) : (
                          <span>{callInitial}</span>
                        )}
                      </div>
                      <div className="text-center">
                        <p className="text-xl md:text-2xl font-semibold">{activeCallName}</p>
                        <p className="text-xs text-white/60">{activeCallId ? `@${activeCallId}` : "Unknown ID"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCallMinimized((v) => !v);
                        }}
                        className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold"
                      >
                        {callMinimized ? "Expand" : "Minimize"}
                      </button>
                      {callStatus === "ringing" ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectCall();
                            }}
                            className="px-5 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-lg"
                            aria-label="Reject call"
                          >
                            Reject
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              acceptCall();
                            }}
                            className="px-5 py-2.5 rounded-full bg-emerald-400 hover:bg-emerald-500 text-black text-xs font-semibold shadow-lg"
                            aria-label="Accept call"
                          >
                            Accept
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            endCallAndNotify();
                          }}
                          className="px-6 py-2.5 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-semibold shadow-lg"
                          aria-label="End call"
                        >
                          {callStatus === "calling" ? "Reject" : "End Call"}
                        </button>
                      )}
                    </div>
                  </div>

                  {callKind === "video" && callStatus === "active" && !callMinimized && (
                    <div className="absolute bottom-6 right-6 w-36 h-48 md:w-40 md:h-52 rounded-2xl overflow-hidden border border-white/10 bg-black/50">
                      <video
                        ref={localVideoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <audio ref={remoteAudioRef} autoPlay playsInline />
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Zego Call Overlay */}
        <AnimatePresence>
          {zegoOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] bg-black"
            >
              {!zegoMinimized && (
                <div className="absolute top-4 right-4 z-[10000] flex items-center gap-2">
                  <button
                    onClick={() => setZegoMinimized(true)}
                    className="px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold"
                  >
                    Minimize
                  </button>
                  <button
                    onClick={() => {
                      const target = callPeerRef.current || selectedChat?.username;
                      if (target) socket.emit("call:end", { to: target, from: myUniqueId });
                      closeZegoCall();
                    }}
                    className="px-4 py-2 rounded-full bg-red-500 text-white text-xs font-semibold"
                  >
                    End Call
                  </button>
                </div>
              )}
              <div ref={zegoContainerRef} className={`w-full h-full ${zegoMinimized ? "hidden" : ""}`} />
              {zegoMinimized && (
                <motion.div
                  drag
                  dragMomentum={false}
                  className="absolute bottom-6 right-6 z-[10000] w-48 h-28 rounded-2xl overflow-hidden bg-black/80 border border-white/10 flex flex-col"
                >
                  <div className="flex items-center justify-between px-3 py-2 text-[10px] text-white/70 border-b border-white/10">
                    <span>Call</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setZegoMinimized(false)} className="text-white/80">Open</button>
                      <button
                        onClick={() => {
                          const target = callPeerRef.current || selectedChat?.username;
                          if (target) socket.emit("call:end", { to: target, from: myUniqueId });
                          closeZegoCall();
                        }}
                        className="text-red-300"
                      >
                        End
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 grid place-items-center text-white/50 text-xs">In call</div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Group Create Modal */}
        <AnimatePresence>
          {showGroupModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={modalVars}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full h-full md:w-[70%] md:h-[80%] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col bg-[var(--modal-panel)]"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Create Group</p>
                    <h3 className="text-xl font-semibold">New Group</h3>
                  </div>
                  <button
                    onClick={() => setShowGroupModal(false)}
                    className="h-10 w-10 rounded-full bg-[var(--modal-panel)] hover:bg-[var(--modal-panel-strong)] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-5">
                  <div>
                    <label className="text-xs text-white/60">Group Name</label>
                      <input
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                        placeholder="e.g. Project Alpha"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[var(--modal-panel)] px-4 py-3 text-sm outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-white/60">Description</label>
                      <textarea
                        value={groupDesc}
                        onChange={(e) => setGroupDesc(e.target.value)}
                        placeholder="Write a short description"
                        rows={3}
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[var(--modal-panel)] px-4 py-3 text-sm outline-none focus:border-white/30"
                      />
                    </div>
                  <div>
                    <label className="text-xs text-white/60">Select Members</label>
                    <div className="mt-3 grid gap-3">
                      {contactOptions.length === 0 && (
                        <p className="text-xs text-white/40">No contacts yet.</p>
                      )}
                      {contactOptions.map((c) => (
                        <button
                          key={c.username}
                          onClick={() => toggleGroupMember(c.username)}
                          className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition ${
                            groupMembers.includes(c.username)
                              ? "border-white/30 bg-[var(--modal-panel-strong)]"
                              : "border-white/10 bg-[var(--modal-panel)] hover:bg-[var(--modal-panel-strong)]"
                          }`}
                        >
                          {c.image ? (
                            <img src={c.image} alt="" className="h-10 w-10 rounded-2xl object-cover border border-white/10" />
                          ) : (
                            <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold">
                              {(c.nickname || c.username || "U")[0]?.toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate">{c.nickname || c.username}</p>
                            <p className="text-[10px] text-white/50 truncate">@{c.username}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border ${groupMembers.includes(c.username) ? "bg-[var(--modal-accent)] border-white/50" : "border-white/30"}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t border-white/10 flex items-center justify-between">
                  <p className="text-xs text-white/50">{groupMembers.length} selected</p>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowGroupModal(false)}
                      className="px-4 py-2 rounded-full bg-[var(--modal-panel)] hover:bg-[var(--modal-panel-strong)] text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateGroup}
                      disabled={creatingGroup}
                      className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {creatingGroup ? "Creating..." : "Create Group"}
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Forward Modal */}
        <AnimatePresence>
          {showForwardModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-50 backdrop-blur-xl flex items-center justify-center"
                style={{ background: `rgba(0,0,0,0.55), ${activeTheme.bg}` }}
              >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full h-full md:w-[60%] md:h-[70%] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
                style={{ background: activeTheme.panel }}
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Forward Message</p>
                    <h3 className="text-xl font-semibold">Choose Contact</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowForwardModal(false);
                      setForwardMessageId(null);
                    }}
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid gap-3">
                    {contactOptions.length === 0 && (
                      <p className="text-xs text-white/40">No contacts yet.</p>
                    )}
                    {contactOptions.map((c) => (
                      <button
                        key={`fwd-${c.username}`}
                        onClick={() => forwardToUser(c.username)}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-left"
                      >
                        {c.image ? (
                          <img src={c.image} alt="" className="h-10 w-10 rounded-2xl object-cover border border-white/10" />
                        ) : (
                          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-bold">
                            {(c.nickname || c.username || "U")[0]?.toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{c.nickname || c.username}</p>
                          <p className="text-[10px] text-white/50 truncate">@{c.username}</p>
                        </div>
                        <span className="text-[10px] text-white/40">Tap to forward</span>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Media Panel */}
        <AnimatePresence>
          {showMediaPanel && selectedChat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 backdrop-blur-xl flex items-center justify-center"
              style={{ background: "rgba(0,0,0,0.6)" }}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full h-full md:w-[70%] md:h-[80%] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
                style={{ background: activeTheme.panel }}
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">Shared</p>
                    <h3 className="text-xl font-semibold">Media, Videos & Docs</h3>
                  </div>
                  <button
                    onClick={() => setShowMediaPanel(false)}
                    className="h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid gap-6">
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Images</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {allMessages.filter((m: any) => m.mediaType?.startsWith("image")).map((m: any) => (
                        <button
                          key={`img-${m.id}`}
                          onClick={() => window.open(m.mediaUrl, "_blank")}
                          className="relative rounded-2xl overflow-hidden border border-white/10 bg-white/5"
                        >
                          <img src={m.mediaUrl} alt="" className="h-28 w-full object-cover" />
                        </button>
                      ))}
                      {allMessages.filter((m: any) => m.mediaType?.startsWith("image")).length === 0 && (
                        <p className="text-xs text-white/40">No images yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Videos</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {allMessages.filter((m: any) => m.mediaType?.startsWith("video")).map((m: any) => (
                        <video key={`vid-${m.id}`} src={m.mediaUrl} controls className="w-full rounded-2xl border border-white/10" />
                      ))}
                      {allMessages.filter((m: any) => m.mediaType?.startsWith("video")).length === 0 && (
                        <p className="text-xs text-white/40">No videos yet.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-xs uppercase tracking-[0.3em] text-white/40 mb-3">Documents</h4>
                    <div className="grid gap-2">
                      {allMessages.filter((m: any) => m.mediaType === "document").map((m: any) => (
                        <a
                          key={`doc-${m.id}`}
                          href={m.mediaUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm hover:bg-white/10"
                        >
                          <FileText size={16} className="text-emerald-300" />
                          <span className="truncate">{m.mediaUrl?.split("/").pop() || "Document"}</span>
                        </a>
                      ))}
                      {allMessages.filter((m: any) => m.mediaType === "document").length === 0 && (
                        <p className="text-xs text-white/40">No documents yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lock Modal */}
        <AnimatePresence>
          {showLockModal && lockTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex items-center justify-center"
              style={modalVars}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full h-full md:w-[55%] md:h-[60%] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col bg-[var(--modal-panel)]"
              >
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-white/50">
                      {lockMode === "set" ? "Hide / Lock Chat" : "Unlock Chat"}
                    </p>
                    <h3 className="text-xl font-semibold">{lockTarget}</h3>
                  </div>
                  <button
                    onClick={() => setShowLockModal(false)}
                    className="h-10 w-10 rounded-full bg-[var(--modal-panel)] hover:bg-[var(--modal-panel-strong)] flex items-center justify-center"
                    aria-label="Close"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {lockMode === "set" ? (
                    <div className="rounded-2xl border border-white/10 bg-[var(--modal-panel-strong)] p-5 text-xs text-white/70">
                      Please note down the password. It is required to unlock this chat later.
                    </div>
                  ) : null}
                  <div>
                    <label className="text-xs text-white/60">6‑character password (letters + numbers)</label>
                      <input
                        value={lockInput}
                        onChange={(e) => setLockInput(e.target.value)}
                        placeholder="e.g. a1b2c3"
                        className="mt-2 w-full rounded-2xl border border-white/10 bg-[var(--modal-panel)] px-4 py-3 text-sm outline-none focus:border-white/30"
                      />
                  </div>
                  {lockMode === "set" && (
                    <label className="flex items-center gap-2 text-xs text-white/60">
                      <input
                        type="checkbox"
                        checked={lockNoteAck}
                        onChange={(e) => setLockNoteAck(e.target.checked)}
                      />
                      I have noted the password.
                    </label>
                  )}
                </div>

                <div className="p-6 border-t border-white/10 flex items-center justify-between">
                  <button
                    onClick={() => setShowLockModal(false)}
                    className="px-4 py-2 rounded-full bg-[var(--modal-panel)] hover:bg-[var(--modal-panel-strong)] text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitLock}
                    className="px-5 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-sm font-semibold text-white"
                  >
                    {lockMode === "set" ? "Lock Chat" : "Unlock Chat"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Bottom Nav */}
      <div className={`lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 ${selectedChat && activeTab === "chats" ? "hidden" : ""}`}>
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-gradient-to-r from-[#0ea5e9]/20 via-[#2563eb]/25 to-[#0f172a]/70 backdrop-blur-xl px-4 py-2 shadow-2xl">
          <button
            onClick={() => setActiveTab((prev) => (prev === "chats" ? "none" : "chats"))}
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              activeTab === "chats" ? "bg-white/15 text-white" : "text-white/50"
            }`}
            aria-label="Chats"
          >
            <MessageSquare size={18} />
          </button>
          <button
            onClick={() => setActiveTab((prev) => (prev === "calls" ? "none" : "calls"))}
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              activeTab === "calls" ? "bg-white/15 text-white" : "text-white/50"
            }`}
            aria-label="Calls"
          >
            <Phone size={18} />
          </button>
          <button
            onClick={() => setActiveTab((prev) => (prev === "settings" ? "none" : "settings"))}
            className={`h-10 w-10 rounded-full flex items-center justify-center ${
              activeTab === "settings" ? "bg-white/15 text-white" : "text-white/50"
            }`}
            aria-label="Settings"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => signOut()}
            className="h-10 w-10 rounded-full flex items-center justify-center text-white/50 hover:text-white bg-white/5"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </main>
  );
}
