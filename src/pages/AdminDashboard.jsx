import React, { useState, useEffect, useMemo } from "react";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  addDoc,
  onSnapshot,
  collectionGroup,
} from "firebase/firestore";
import {
  Users,
  Search,
  CreditCard,
  Lock,
  X,
  LogOut,
  Database,
  Map,
  MessageSquare,
  Activity,
  BarChart,
  CheckCircle,
  Clock,
  Crown,
  Target,
  TrendingUp,
  ShieldCheck,
  Zap,
  PieChart,
} from "lucide-react";

// --- ROBUST DATE HELPERS ---
const safeDate = (ts) => {
  if (!ts) return "N/A";
  if (typeof ts.toDate === "function") return ts.toDate().toLocaleDateString();
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleDateString();
  try {
    return new Date(ts).toLocaleDateString();
  } catch (e) {
    return "N/A";
  }
};

const safeTime = (ts) => {
  if (!ts) return "00:00";
  if (typeof ts.toDate === "function")
    return ts
      .toDate()
      .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (ts.seconds)
    return new Date(ts.seconds * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  try {
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    return "00:00";
  }
};

// --- CUSTOM SVG SPARKLINE ---
const Sparkline = ({
  data,
  color,
  width = 100,
  height = 30,
  strokeWidth = 2,
}) => {
  if (!data || data.length === 0) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    })
    .join(" L ");

  return (
    <svg width={width} height={height} className="overflow-visible opacity-80">
      <path
        d={`M ${points}`}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {data.length > 0 && (
        <circle
          cx={width}
          cy={height - ((data[data.length - 1] - min) / range) * height}
          r="3"
          fill={color}
        />
      )}
    </svg>
  );
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation & Layout States
  const [activeTab, setActiveTab] = useState("analytics");
  const [activeUserTab, setActiveUserTab] = useState("overview");

  // Data States
  const [usersList, setUsersList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Global Analytics States
  const [globalRoadmaps, setGlobalRoadmaps] = useState([]);
  const [globalChats, setGlobalChats] = useState([]);

  // Deep Dive User States
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const [userRoadmaps, setUserRoadmaps] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [adminMessage, setAdminMessage] = useState("");

  // Master Password States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [masterPasswordInput, setMasterPasswordInput] = useState("");
  const [pendingPlan, setPendingPlan] = useState("");

  // Simulated activity ticks for sparklines
  const [activityData] = useState(
    Array.from({ length: 14 }, () => Math.floor(Math.random() * 50) + 10),
  );

  // Initial Data Fetching
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        setUsersList(
          querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      } catch (e) {
        console.error("Error fetching users:", e);
      }
    };
    fetchUsers();

    const unsubTx = onSnapshot(
      query(collection(db, "transactions"), orderBy("createdAt", "desc")),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );

    const fetchGlobalData = async () => {
      try {
        const rmSnap = await getDocs(collectionGroup(db, "roadmaps"));
        setGlobalRoadmaps(rmSnap.docs.map((d) => d.data()));

        const chatSnap = await getDocs(collectionGroup(db, "chats"));
        setGlobalChats(chatSnap.docs.map((d) => d.data()));
      } catch (e) {
        console.error("Error fetching global analytics data.", e);
      }
    };
    fetchGlobalData();

    return () => unsubTx();
  }, []);

  // Fetch complete deep-dive details for a specific user
  const handleSelectUser = async (u) => {
    setSelectedUser(u);
    setSelectedChat(null);
    setChatMessages([]);
    setActiveUserTab("overview");
    try {
      const chatsSnap = await getDocs(
        query(
          collection(db, "users", u.id, "chats"),
          orderBy("createdAt", "desc"),
        ),
      );
      setUserChats(chatsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      const roadmapsSnap = await getDocs(
        query(
          collection(db, "users", u.id, "roadmaps"),
          orderBy("createdAt", "desc"),
        ),
      );
      setUserRoadmaps(
        roadmapsSnap.docs.map((d) => ({ id: d.id, ...d.data() })),
      );
    } catch (e) {
      console.error("Error fetching user data:", e);
    }
  };

  const handleSelectChat = async (chatId) => {
    setSelectedChat(chatId);
    try {
      const msgsSnap = await getDocs(
        query(
          collection(db, "users", selectedUser.id, "chats", chatId, "messages"),
          orderBy("createdAt", "asc"),
        ),
      );
      setChatMessages(msgsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      console.error("Error fetching messages:", e);
    }
  };

  const handleSendNotification = async () => {
    if (!adminMessage.trim() || !selectedUser) return;
    try {
      await addDoc(collection(db, "users", selectedUser.id, "notifications"), {
        title: "Admin Notice",
        message: adminMessage,
        read: false,
        createdAt: serverTimestamp(),
      });
      alert("System notice dispatched successfully.");
      setAdminMessage("");
    } catch (e) {
      console.error(e);
    }
  };

  const handleApproveTransaction = async (tx) => {
    if (
      !window.confirm(
        `APPROVE transaction ${tx.transactionId} and grant ${tx.requestedPlan.toUpperCase()} access?`,
      )
    )
      return;
    try {
      await updateDoc(doc(db, "users", tx.uid), { plan: tx.requestedPlan });
      await updateDoc(doc(db, "transactions", tx.id), { status: "approved" });
      await addDoc(collection(db, "users", tx.uid, "notifications"), {
        title: "Payment Approved",
        message: `Your transaction (${tx.transactionId}) was successful. Plan updated to ${tx.requestedPlan.toUpperCase()}.`,
        read: false,
        createdAt: serverTimestamp(),
      });
      setUsersList(
        usersList.map((u) =>
          u.id === tx.uid ? { ...u, plan: tx.requestedPlan } : u,
        ),
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleRejectTransaction = async (tx) => {
    const msg = window.prompt(
      "Reason for rejection:",
      "Invalid Transaction ID verification failed.",
    );
    if (msg === null) return;
    try {
      await updateDoc(doc(db, "transactions", tx.id), { status: "rejected" });
      await addDoc(collection(db, "users", tx.uid, "notifications"), {
        title: "Transaction Rejected",
        message: msg,
        read: false,
        createdAt: serverTimestamp(),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const confirmPlanUpgrade = async () => {
    if (masterPasswordInput === "12345") {
      try {
        await updateDoc(doc(db, "users", selectedUser.id), {
          plan: pendingPlan,
        });
        setSelectedUser({ ...selectedUser, plan: pendingPlan });
        setUsersList(
          usersList.map((u) =>
            u.id === selectedUser.id ? { ...u, plan: pendingPlan } : u,
          ),
        );
        await addDoc(
          collection(db, "users", selectedUser.id, "notifications"),
          {
            title: "Plan Modified",
            message: `An administrator has manually altered your subscription to: ${pendingPlan.toUpperCase()}.`,
            read: false,
            createdAt: serverTimestamp(),
          },
        );
        setShowPasswordModal(false);
        setMasterPasswordInput("");
        setPendingPlan("");
      } catch (e) {
        alert("Database execution failed.");
      }
    } else {
      alert("AUTHORIZATION FAILED: Invalid Master Password.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.id?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // --- ANALYTICS PROCESSING DATA ---
  const totalUsers = usersList.length;
  const proUsers = usersList.filter((u) => u.plan === "pro").length;
  const essentialUsers = usersList.filter((u) => u.plan === "essential").length;
  const pendingTransactions = transactions.filter(
    (t) => t.status === "pending",
  ).length;
  const totalApprovedRevenue = transactions
    .filter((t) => t.status === "approved")
    .reduce(
      (acc, curr) =>
        acc +
        (curr.requestedPlan === "pro"
          ? 19
          : curr.requestedPlan === "essential"
            ? 9
            : 0),
      0,
    );

  // 1. Calculate Top Career Roles
  const topRoles = useMemo(() => {
    const counts = {};
    globalRoadmaps.forEach((r) => {
      if (r.role) {
        const cleanRole = r.role.trim().toLowerCase();
        counts[cleanRole] = (counts[cleanRole] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({
        name,
        count,
        percent: Math.round((count / globalRoadmaps.length) * 100) || 0,
      }));
  }, [globalRoadmaps]);

  // 2. Search Intent Quality Analysis
  const searchIntent = useMemo(() => {
    let deepResearch = 0;
    let casual = 0;
    let technical = 0;

    const techKeywords = [
      "react",
      "python",
      "node",
      "engineer",
      "developer",
      "architecture",
      "system",
      "api",
      "database",
      "ai",
      "ml",
    ];

    globalChats.forEach((c) => {
      if (c.title && c.title !== "New Session") {
        const titleLower = c.title.toLowerCase();
        const hasTech = techKeywords.some((kw) => titleLower.includes(kw));
        const isLong = titleLower.length > 20;

        if (hasTech && isLong) deepResearch++;
        else if (hasTech || isLong) technical++;
        else casual++;
      }
    });

    const total = deepResearch + casual + technical || 1;
    return {
      deep: Math.round((deepResearch / total) * 100),
      tech: Math.round((technical / total) * 100),
      casual: Math.round((casual / total) * 100),
    };
  }, [globalChats]);

  // 3. User Specific Analytics (Time on platform & Engagement)
  const calculateUserMetrics = () => {
    if (!selectedUser) return null;

    // Estimate Time on Platform based on chats
    let firstActivity = new Date();
    let lastActivity = new Date(0);

    [...userChats, ...userRoadmaps].forEach((item) => {
      const d = item.createdAt?.toDate ? item.createdAt.toDate() : new Date();
      if (d < firstActivity) firstActivity = d;
      if (d > lastActivity) lastActivity = d;
    });

    const daysActive = Math.max(
      1,
      Math.ceil((lastActivity - firstActivity) / (1000 * 60 * 60 * 24)),
    );
    const totalInteractions = userChats.length + userRoadmaps.length;
    const engagementVelocity = (totalInteractions / daysActive).toFixed(1);

    return { daysActive, engagementVelocity, totalInteractions };
  };

  const userMetrics = useMemo(
    () => calculateUserMetrics(),
    [userChats, userRoadmaps, selectedUser],
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Inter:wght@400;500;600&display=swap');
        .font-serif { font-family: 'Newsreader', serif; }
        .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="flex w-screen h-screen m-0 p-0 bg-[#FAF9F6] font-sans text-[#2D2D2D] overflow-hidden selection:bg-[#E8E6DF]">
        {/* MODAL: Master Password Override */}
        {showPasswordModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#2D2D2D]/30 backdrop-blur-sm"
              onClick={() => setShowPasswordModal(false)}
            ></div>
            <div className="relative w-full max-w-sm bg-[#FAF9F6] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-[#E8E6DF] p-10 animate-fade-in text-center">
              <div className="w-16 h-16 bg-[#F3F1EC] text-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-6">
                <Lock strokeWidth={1.5} className="w-8 h-8 text-[#D97D54]" />
              </div>
              <h3 className="font-serif text-3xl text-[#2D2D2D] mb-2 tracking-tight">
                Security Override
              </h3>
              <p className="text-[#7A756D] text-sm mb-8 leading-relaxed">
                Authorization required to elevate UID{" "}
                <span className="font-mono bg-[#E8E6DF] px-1 rounded text-[#2D2D2D]">
                  {selectedUser?.id?.substring(0, 8)}
                </span>{" "}
                to{" "}
                <span className="font-bold text-[#2D2D2D] uppercase">
                  {pendingPlan}
                </span>
                .
              </p>
              <input
                type="password"
                placeholder="Enter 5-digit pin..."
                value={masterPasswordInput}
                onChange={(e) => setMasterPasswordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmPlanUpgrade()}
                className="w-full p-4 mb-4 border border-[#E8E6DF] bg-white text-[#2D2D2D] font-mono text-center tracking-widest outline-none focus:border-[#D1CEC7] rounded-2xl shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              />
              <button
                onClick={confirmPlanUpgrade}
                className="w-full py-3.5 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] transition-colors"
              >
                Execute Override
              </button>
            </div>
          </div>
        )}

        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-64 bg-[#F3F1EC] border-r border-[#E8E6DF] flex flex-col shrink-0 relative z-10">
          <div className="p-6 border-b border-[#E8E6DF]">
            <div className="flex items-center gap-3 text-[#2D2D2D] mb-1">
              <Database strokeWidth={1.5} className="w-6 h-6 text-[#D97D54]" />
              <span className="font-serif text-xl font-medium tracking-tight">
                LenAi Admin
              </span>
            </div>
            <span className="text-xs font-mono text-[#A8A39D]">
              v3.0.2 LTS / SuperAdmin
            </span>
          </div>

          <div className="px-4 mt-6 space-y-1">
            <h3 className="text-[10px] font-semibold text-[#A8A39D] uppercase tracking-widest px-3 mb-3">
              Core Systems
            </h3>
            {[
              { id: "analytics", icon: Activity, label: "Analytics & Trends" },
              { id: "users", icon: Users, label: "User Directory" },
              {
                id: "transactions",
                icon: CreditCard,
                label: "Financial Ledger",
              },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  if (t.id !== "users") setSelectedUser(null);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${activeTab === t.id ? "bg-[#FAF9F6] text-[#2D2D2D] font-medium shadow-[0_1px_3px_rgb(0,0,0,0.02)] border border-[#E8E6DF]" : "text-[#7A756D] hover:bg-[#E8E6DF]/50"}`}
              >
                <t.icon strokeWidth={1.5} className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="mt-auto p-4 border-t border-[#E8E6DF]">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#7A756D] hover:bg-[#E8E6DF]/50 hover:text-[#2D2D2D] rounded-xl transition-colors font-medium"
            >
              <LogOut strokeWidth={1.5} className="w-4 h-4" /> Terminate Session
            </button>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6] overflow-y-auto no-scrollbar relative">
          {/* TOP HEADER */}
          <div className="sticky top-0 z-20 bg-[#FAF9F6]/80 backdrop-blur-md border-b border-[#E8E6DF] px-10 py-5 flex items-center justify-between">
            <h1 className="font-serif text-3xl text-[#2D2D2D] capitalize">
              {activeTab === "analytics"
                ? "Platform Intelligence"
                : activeTab === "users"
                  ? "User Deep Dive"
                  : "Financial Ledger"}
            </h1>
            <div className="flex items-center gap-4">
              {activeTab === "users" && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8A39D]" />
                  <input
                    type="text"
                    placeholder="Search UID, Name, Email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-[#E8E6DF] rounded-full pl-10 pr-4 py-2 text-sm text-[#2D2D2D] focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)] w-64 transition-all focus:w-80"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="p-10">
            {/* ANALYTICS VIEW */}
            {activeTab === "analytics" && (
              <div className="max-w-6xl mx-auto animate-fade-in space-y-8">
                {/* Global Top Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.01)] flex flex-col justify-between relative overflow-hidden">
                    <div className="flex items-center gap-3 text-[#7A756D] mb-4">
                      <Users className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-sm font-medium">Total Network</span>
                    </div>
                    <div className="font-serif text-5xl text-[#2D2D2D]">
                      {totalUsers}
                    </div>
                    <div className="absolute -bottom-2 -right-4">
                      <Sparkline
                        data={activityData}
                        color="#D97D54"
                        width={120}
                        height={50}
                      />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-[#7A756D] mb-4">
                      <Crown
                        className="w-5 h-5 text-[#D97D54]"
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium">
                        Premium Members
                      </span>
                    </div>
                    <div className="font-serif text-5xl text-[#2D2D2D]">
                      {proUsers + essentialUsers}
                    </div>
                    <p className="text-xs text-[#A8A39D] mt-2 font-medium">
                      {proUsers} Pro / {essentialUsers} Essential
                    </p>
                  </div>
                  <div className="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.01)] flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-[#7A756D] mb-4">
                      <BarChart
                        className="w-5 h-5 text-emerald-600"
                        strokeWidth={1.5}
                      />
                      <span className="text-sm font-medium">Gross Revenue</span>
                    </div>
                    <div className="font-serif text-5xl text-[#2D2D2D]">
                      ${totalApprovedRevenue}
                    </div>
                  </div>
                  <div className="bg-[#2D2D2D] p-6 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.1)] text-[#FAF9F6] flex flex-col justify-between">
                    <div className="flex items-center gap-3 text-[#A8A39D] mb-4">
                      <Clock className="w-5 h-5" strokeWidth={1.5} />
                      <span className="text-sm font-medium">
                        Pending Approvals
                      </span>
                    </div>
                    <div className="font-serif text-5xl text-[#FAF9F6]">
                      {pendingTransactions}
                    </div>
                  </div>
                </div>

                {/* Deep Dive Graphical Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left: Search Intent Quality */}
                  <div className="bg-white rounded-3xl border border-[#E8E6DF] p-8 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                    <div className="flex items-center gap-3 mb-8">
                      <PieChart
                        className="w-6 h-6 text-[#D97D54]"
                        strokeWidth={1.5}
                      />
                      <h3 className="font-serif text-2xl text-[#2D2D2D]">
                        Search Intent Quality
                      </h3>
                    </div>
                    <p className="text-sm text-[#7A756D] mb-8">
                      Analysis of user chat queries to determine the depth of
                      research and interaction quality across the platform.
                    </p>

                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-[#2D2D2D] flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#2D2D2D]"></div>{" "}
                            Deep Research Intent
                          </span>
                          <span className="text-[#A8A39D] font-mono">
                            {searchIntent.deep}%
                          </span>
                        </div>
                        <div className="w-full bg-[#F3F1EC] rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#2D2D2D] h-3 rounded-full"
                            style={{ width: `${searchIntent.deep}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-[#4A4A4A] flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#D97D54]"></div>{" "}
                            Technical Queries
                          </span>
                          <span className="text-[#A8A39D] font-mono">
                            {searchIntent.tech}%
                          </span>
                        </div>
                        <div className="w-full bg-[#F3F1EC] rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#D97D54] h-3 rounded-full"
                            style={{ width: `${searchIntent.tech}%` }}
                          ></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-medium text-[#7A756D] flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#A8A39D]"></div>{" "}
                            Casual / Vague Interaction
                          </span>
                          <span className="text-[#A8A39D] font-mono">
                            {searchIntent.casual}%
                          </span>
                        </div>
                        <div className="w-full bg-[#F3F1EC] rounded-full h-3 overflow-hidden">
                          <div
                            className="bg-[#A8A39D] h-3 rounded-full"
                            style={{ width: `${searchIntent.casual}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Roadmap Distribution */}
                  <div className="bg-white rounded-3xl border border-[#E8E6DF] p-8 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                    <div className="flex items-center gap-3 mb-8">
                      <Target
                        className="w-6 h-6 text-[#D97D54]"
                        strokeWidth={1.5}
                      />
                      <h3 className="font-serif text-2xl text-[#2D2D2D]">
                        Top Target Architectures
                      </h3>
                    </div>
                    <div className="space-y-6">
                      {topRoles.length === 0 ? (
                        <p className="text-[#A8A39D] text-sm text-center py-10 border border-dashed rounded-2xl">
                          Awaiting roadmap generation data.
                        </p>
                      ) : (
                        topRoles.map((role, idx) => (
                          <div key={idx} className="flex items-center gap-4">
                            <div className="w-8 font-serif text-[#A8A39D] text-lg italic">
                              0{idx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between text-sm mb-1">
                                <span className="font-medium text-[#4A4A4A] capitalize">
                                  {role.name}
                                </span>
                                <span className="text-[#7A756D] text-xs font-mono">
                                  {role.count} paths
                                </span>
                              </div>
                              <div className="w-full bg-[#F3F1EC] rounded-full h-1.5 overflow-hidden">
                                <div
                                  className="bg-[#2D2D2D] h-1.5 rounded-full opacity-80"
                                  style={{ width: `${role.percent}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* USERS VIEW (SPLIT LAYOUT) */}
            {activeTab === "users" && (
              <div className="flex gap-8 max-w-[1400px] mx-auto h-[calc(100vh-160px)] animate-fade-in">
                {/* Left Side: Users List */}
                <div
                  className={`flex flex-col bg-white border border-[#E8E6DF] rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.01)] overflow-hidden transition-all duration-300 ${selectedUser ? "w-1/3" : "w-full"}`}
                >
                  <div className="flex-1 overflow-y-auto custom-scroll p-2">
                    {filteredUsers.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all mb-1 ${selectedUser?.id === u.id ? "bg-[#F3F1EC] border border-[#E8E6DF]" : "hover:bg-[#FAF9F6] border border-transparent"}`}
                      >
                        <div className="w-10 h-10 rounded-full bg-[#E8E6DF] flex items-center justify-center text-[#2D2D2D] font-serif shrink-0">
                          {u.name ? u.name[0].toUpperCase() : "U"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-[#2D2D2D] truncate text-sm">
                            {u.name || "Unregistered User"}
                          </h4>
                          <p className="text-xs text-[#7A756D] truncate">
                            {u.email}
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border shrink-0 ${u.plan === "pro" ? "bg-[#2D2D2D] text-[#FAF9F6] border-[#1A1A1A]" : u.plan === "essential" ? "bg-[#D97D54]/10 text-[#D97D54] border-[#D97D54]/20" : "bg-[#FAF9F6] text-[#A8A39D] border-[#E8E6DF]"}`}
                        >
                          {u.plan || "basic"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side: Deep Dive Profile */}
                {selectedUser && (
                  <div className="w-2/3 flex flex-col bg-white border border-[#E8E6DF] rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.01)] overflow-hidden animate-fade-in">
                    {/* Profile Header */}
                    <div className="p-8 border-b border-[#E8E6DF] bg-[#FAF9F6] flex items-start justify-between shrink-0">
                      <div className="flex items-center gap-6">
                        <div className="w-20 h-20 bg-white border border-[#E8E6DF] rounded-2xl flex items-center justify-center shadow-sm">
                          <img
                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${selectedUser.name || "User"}&backgroundColor=F3F1EC&textColor=2D2D2D`}
                            alt="Avatar"
                            className="w-full h-full rounded-2xl"
                          />
                        </div>
                        <div>
                          <h2 className="font-serif text-3xl text-[#2D2D2D] mb-1">
                            {selectedUser.name || "Unregistered"}
                          </h2>
                          <p className="text-sm font-mono text-[#7A756D] mb-3">
                            {selectedUser.email}{" "}
                            <span className="mx-2 text-[#E8E6DF]">|</span> UID:{" "}
                            {selectedUser.id.substring(0, 8)}
                          </p>
                          <div className="flex gap-2">
                            <select
                              value={selectedUser.plan || "basic"}
                              onChange={(e) =>
                                handlePlanChangeRequest(e.target.value)
                              }
                              className="bg-white border border-[#E8E6DF] text-xs font-semibold text-[#4A4A4A] rounded-lg px-3 py-1.5 outline-none cursor-pointer focus:border-[#D1CEC7] shadow-sm uppercase tracking-wider"
                            >
                              <option value="basic">Basic Plan</option>
                              <option value="essential">Essential Plan</option>
                              <option value="pro">Pro Plan</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="relative group">
                          <input
                            type="text"
                            placeholder="Dispatch notice to user..."
                            value={adminMessage}
                            onChange={(e) => setAdminMessage(e.target.value)}
                            className="text-xs px-4 py-2 bg-white border border-[#E8E6DF] rounded-lg outline-none w-64 focus:border-[#D1CEC7] shadow-sm placeholder:text-[#A8A39D]"
                          />
                          <button
                            onClick={handleSendNotification}
                            className="absolute right-1 top-1 bottom-1 bg-[#2D2D2D] text-[#FAF9F6] px-3 rounded text-[10px] font-medium hover:bg-[#1A1A1A] transition-colors"
                          >
                            Send
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Deep Dive Tabs */}
                    <div className="flex border-b border-[#E8E6DF] bg-white px-8 pt-4 gap-6 shrink-0">
                      {[
                        { id: "overview", label: "User Analytics" },
                        {
                          id: "roadmaps",
                          label: `Roadmaps (${userRoadmaps.length})`,
                        },
                        {
                          id: "chats",
                          label: `Chat History (${userChats.length})`,
                        },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveUserTab(tab.id)}
                          className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeUserTab === tab.id ? "border-[#2D2D2D] text-[#2D2D2D]" : "border-transparent text-[#A8A39D] hover:text-[#7A756D]"}`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {/* Deep Dive Content */}
                    <div className="flex-1 overflow-y-auto bg-white p-8">
                      {activeUserTab === "overview" && userMetrics && (
                        <div className="animate-fade-in space-y-6">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl p-5">
                              <div className="flex items-center gap-2 text-[#7A756D] mb-2">
                                <Clock className="w-4 h-4" />{" "}
                                <span className="text-xs font-semibold uppercase tracking-wider">
                                  Platform Time
                                </span>
                              </div>
                              <div className="font-serif text-3xl text-[#2D2D2D]">
                                {userMetrics.daysActive}{" "}
                                <span className="text-sm font-sans text-[#A8A39D]">
                                  days active
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl p-5">
                              <div className="flex items-center gap-2 text-[#7A756D] mb-2">
                                <Zap className="w-4 h-4" />{" "}
                                <span className="text-xs font-semibold uppercase tracking-wider">
                                  Velocity
                                </span>
                              </div>
                              <div className="font-serif text-3xl text-[#2D2D2D]">
                                {userMetrics.engagementVelocity}{" "}
                                <span className="text-sm font-sans text-[#A8A39D]">
                                  req/day
                                </span>
                              </div>
                            </div>
                            <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl p-5">
                              <div className="flex items-center gap-2 text-[#7A756D] mb-2">
                                <ShieldCheck className="w-4 h-4" />{" "}
                                <span className="text-xs font-semibold uppercase tracking-wider">
                                  Total Actions
                                </span>
                              </div>
                              <div className="font-serif text-3xl text-[#2D2D2D]">
                                {userMetrics.totalInteractions}
                              </div>
                            </div>
                          </div>

                          <div className="bg-white border border-[#E8E6DF] rounded-2xl p-6 shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                            <h4 className="text-sm font-semibold text-[#2D2D2D] mb-6">
                              User Specific Activity Analysis
                            </h4>
                            <p className="text-[#7A756D] text-sm leading-relaxed">
                              Based on the aggregated metrics, this user
                              averages{" "}
                              <strong>{userMetrics.engagementVelocity}</strong>{" "}
                              interactions per active day. They have generated{" "}
                              <strong>{userRoadmaps.length}</strong> masterclass
                              architectures and initiated{" "}
                              <strong>{userChats.length}</strong> AI chat
                              sessions since their first recorded activity.
                              Review specific interactions in the Chat and
                              Roadmap tabs to audit query quality.
                            </p>
                          </div>
                        </div>
                      )}

                      {activeUserTab === "roadmaps" && (
                        <div className="space-y-4 animate-fade-in">
                          {userRoadmaps.length === 0 ? (
                            <div className="text-center text-[#A8A39D] py-10 text-sm">
                              No roadmaps generated by this user.
                            </div>
                          ) : (
                            userRoadmaps.map((r) => (
                              <div
                                key={r.id}
                                className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl p-5 hover:border-[#D1CEC7] transition-colors"
                              >
                                <div className="flex justify-between items-start mb-3">
                                  <h3 className="font-serif text-xl text-[#2D2D2D] capitalize">
                                    {r.role}
                                  </h3>
                                  <span className="text-xs text-[#A8A39D]">
                                    {safeDate(r.createdAt)}
                                  </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-[#7A756D]">
                                  <span className="flex items-center gap-1">
                                    <Map className="w-3.5 h-3.5" />{" "}
                                    {r.steps?.length || 0} Steps
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <CheckCircle className="w-3.5 h-3.5" />{" "}
                                    {r.completedResources?.length || 0}{" "}
                                    Completed
                                  </span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {activeUserTab === "chats" && (
                        <div className="flex h-full gap-6 animate-fade-in">
                          {/* Chat Session List */}
                          <div className="w-1/3 border-r border-[#E8E6DF] pr-4 space-y-2 overflow-y-auto custom-scroll">
                            {userChats.length === 0 ? (
                              <div className="text-center text-[#A8A39D] py-4 text-sm">
                                No chats found.
                              </div>
                            ) : (
                              userChats.map((c) => (
                                <button
                                  key={c.id}
                                  onClick={() => handleSelectChat(c.id)}
                                  className={`w-full text-left p-3 rounded-xl text-sm transition-colors ${selectedChat === c.id ? "bg-[#2D2D2D] text-[#FAF9F6]" : "bg-[#FAF9F6] text-[#4A4A4A] hover:bg-[#E8E6DF] border border-[#E8E6DF]"}`}
                                >
                                  <div className="truncate font-medium mb-1">
                                    {c.title}
                                  </div>
                                  <div
                                    className={`text-[10px] ${selectedChat === c.id ? "text-[#A8A39D]" : "text-[#A8A39D]"}`}
                                  >
                                    {safeDate(c.createdAt)}
                                  </div>
                                </button>
                              ))
                            )}
                          </div>

                          {/* Chat Transcript Reader */}
                          <div className="flex-1 bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl overflow-hidden flex flex-col relative">
                            {!selectedChat ? (
                              <div className="flex-1 flex items-center justify-center text-[#A8A39D] text-sm">
                                Select a session to view transcript.
                              </div>
                            ) : (
                              <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scroll">
                                {chatMessages.length === 0 ? (
                                  <div className="text-center text-[#A8A39D] text-sm italic">
                                    Empty session.
                                  </div>
                                ) : (
                                  chatMessages.map((msg) => (
                                    <div
                                      key={msg.id}
                                      className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
                                    >
                                      <span className="text-[10px] font-semibold text-[#A8A39D] mb-1 px-1 uppercase tracking-widest">
                                        {msg.sender === "user"
                                          ? "User"
                                          : "LenAi"}{" "}
                                        • {safeTime(msg.createdAt)}
                                      </span>
                                      <div
                                        className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed max-w-[85%] whitespace-pre-wrap ${msg.sender === "user" ? "bg-white border border-[#E8E6DF] text-[#2D2D2D]" : "bg-[#2D2D2D] text-[#FAF9F6]"}`}
                                      >
                                        {msg.text}
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TRANSACTIONS VIEW */}
            {activeTab === "transactions" && (
              <div className="max-w-6xl mx-auto bg-white border border-[#E8E6DF] rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.01)] overflow-hidden animate-fade-in">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#FAF9F6] border-b border-[#E8E6DF]">
                      <tr>
                        <th className="p-4 text-xs font-semibold text-[#A8A39D] uppercase tracking-widest">
                          Date
                        </th>
                        <th className="p-4 text-xs font-semibold text-[#A8A39D] uppercase tracking-widest">
                          User Email
                        </th>
                        <th className="p-4 text-xs font-semibold text-[#A8A39D] uppercase tracking-widest">
                          Target Plan
                        </th>
                        <th className="p-4 text-xs font-semibold text-[#A8A39D] uppercase tracking-widest">
                          TXN ID
                        </th>
                        <th className="p-4 text-xs font-semibold text-[#A8A39D] uppercase tracking-widest">
                          Status
                        </th>
                        <th className="p-4 text-xs font-semibold text-[#A8A39D] uppercase tracking-widest text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr
                          key={tx.id}
                          className="border-b border-[#E8E6DF] hover:bg-[#FAF9F6] transition-colors"
                        >
                          <td className="p-4 text-sm text-[#7A756D]">
                            {safeDate(tx.createdAt)}
                          </td>
                          <td className="p-4 text-sm font-medium text-[#2D2D2D]">
                            {tx.userEmail}
                          </td>
                          <td className="p-4">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#D97D54] bg-[#D97D54]/10 px-2 py-1 rounded-md">
                              {tx.requestedPlan}
                            </span>
                          </td>
                          <td className="p-4 text-sm font-mono text-[#7A756D]">
                            {tx.transactionId}
                          </td>
                          <td className="p-4">
                            <span
                              className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full border ${tx.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : tx.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            {tx.status === "pending" ? (
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => handleApproveTransaction(tx)}
                                  className="bg-[#2D2D2D] text-[#FAF9F6] px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-[#1A1A1A] transition-colors"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleRejectTransaction(tx)}
                                  className="bg-white text-red-600 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[#A8A39D] text-xs font-medium bg-[#F3F1EC] px-3 py-1.5 rounded-lg">
                                Processed
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {transactions.length === 0 && (
                        <tr>
                          <td
                            colSpan="6"
                            className="p-8 text-center text-[#A8A39D] text-sm"
                          >
                            No transactions logged in the system.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminDashboard;
