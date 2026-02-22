import React, { useState, useEffect } from "react";
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
} from "firebase/firestore";
import {
  Users,
  Search,
  ShieldCheck,
  CreditCard,
  Send,
  Lock,
  X,
  LogOut,
  Clock,
  Database,
  FileText,
  Map,
  MessageSquare,
  ChevronRight,
  Activity,
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
  if (!ts) return "00:00:00";
  if (typeof ts.toDate === "function") return ts.toDate().toLocaleTimeString();
  if (ts.seconds) return new Date(ts.seconds * 1000).toLocaleTimeString();
  try {
    return new Date(ts).toLocaleTimeString();
  } catch (e) {
    return "00:00:00";
  }
};

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Track Admin Login Session
  const [sessionStartTime] = useState(new Date().toLocaleTimeString());

  // Layout States
  const [activeTab, setActiveTab] = useState("users"); // 'users' or 'transactions'
  const [usersList, setUsersList] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Details States
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

    const unsub = onSnapshot(
      query(collection(db, "transactions"), orderBy("createdAt", "desc")),
      (snap) => {
        setTransactions(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );
    return () => unsub();
  }, []);

  // Fetch complete details for a specific user
  const handleSelectUser = async (u) => {
    setSelectedUser(u);
    setSelectedChat(null);
    setChatMessages([]);
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

  // --- Transaction Management ---
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

  // --- Manual Plan Override (Master Password) ---
  const handlePlanChangeRequest = (newPlan) => {
    setPendingPlan(newPlan);
    setShowPasswordModal(true);
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
        console.error(e);
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

  return (
    <div className="flex flex-col w-screen h-screen m-0 p-0 bg-slate-100 font-sans text-sm text-slate-800 overflow-hidden">
      {/* MODAL: Master Password Override */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
          <div className="bg-white border border-slate-400 shadow-sm w-full max-w-sm p-0 rounded-sm">
            <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center rounded-t-sm">
              <span className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                <Lock className="w-3 h-3" /> Security Override
              </span>
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setMasterPasswordInput("");
                }}
              >
                <X className="w-4 h-4 hover:text-red-400" />
              </button>
            </div>
            <div className="p-6">
              <p className="mb-4 text-xs font-medium">
                Authorization required to elevate UID{" "}
                <span className="font-mono bg-slate-100 px-1 border border-slate-200">
                  {selectedUser?.id?.substring(0, 8)}
                </span>{" "}
                to{" "}
                <span className="font-bold text-slate-900 uppercase">
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
                className="w-full p-2 mb-4 border border-slate-300 font-mono text-center tracking-widest outline-none focus:border-slate-800 focus:bg-slate-50 rounded-sm"
              />
              <button
                onClick={confirmPlanUpgrade}
                className="w-full bg-slate-800 text-white font-bold text-xs py-2 rounded-sm hover:bg-slate-900 border border-slate-900"
              >
                EXECUTE OVERRIDE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVIGATION BAR */}
      <div className="bg-slate-900 text-slate-200 h-12 flex items-center justify-between px-4 shrink-0 border-b-2 border-slate-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-white font-bold tracking-wide">
            <Database className="w-5 h-5 text-blue-400" />
            <span>LenAi Data Management Console</span>
          </div>
          <div className="h-4 w-px bg-slate-600"></div>
          <span className="text-xs font-mono text-slate-400">v3.0.1 LTS</span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>
              Session Started:{" "}
              <span className="text-white font-mono">{sessionStartTime}</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="font-medium text-white">
              {user?.email || "SuperAdmin"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 px-3 py-1 rounded text-xs font-bold text-white transition-colors"
          >
            <LogOut className="w-3 h-3" /> Logout
          </button>
        </div>
      </div>

      {/* MAIN WORKSPACE SPLIT */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT SIDEBAR NAVIGATION */}
        <div className="w-48 bg-slate-200 border-r border-slate-300 flex flex-col shrink-0">
          <div className="p-2 border-b border-slate-300 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-100">
            System Tables
          </div>
          <div className="flex flex-col p-2 gap-1">
            <button
              onClick={() => {
                setActiveTab("users");
                setSelectedUser(null);
              }}
              className={`flex items-center gap-2 p-2 rounded-sm text-sm font-medium transition-colors ${activeTab === "users" ? "bg-slate-800 text-white" : "text-slate-700 hover:bg-slate-300"}`}
            >
              <Users className="w-4 h-4" /> User Directory
            </button>
            <button
              onClick={() => {
                setActiveTab("transactions");
                setSelectedUser(null);
              }}
              className={`flex items-center gap-2 p-2 rounded-sm text-sm font-medium transition-colors ${activeTab === "transactions" ? "bg-slate-800 text-white" : "text-slate-700 hover:bg-slate-300"}`}
            >
              <CreditCard className="w-4 h-4" /> Ledger / Payments
            </button>
          </div>
        </div>

        {/* CENTER CONTENT: TABLES */}
        <div
          className={`${selectedUser ? "w-1/3" : "flex-1"} flex flex-col bg-white border-r border-slate-300 shrink-0`}
        >
          {/* USERS TABLE VIEW */}
          {activeTab === "users" && (
            <>
              <div className="bg-slate-100 p-2 border-b border-slate-300 flex items-center gap-2 shrink-0">
                <Search className="w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by name, email, or UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white border border-slate-300 rounded-sm text-xs px-2 py-1 w-full outline-none focus:border-slate-500"
                />
              </div>
              <div className="flex-1 overflow-auto custom-scroll">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 sticky top-0 border-b border-slate-300 z-10 shadow-sm">
                    <tr>
                      <th className="p-2 font-bold text-slate-600 w-10 text-center">
                        ID
                      </th>
                      <th className="p-2 font-bold text-slate-600">
                        Full Name
                      </th>
                      <th className="p-2 font-bold text-slate-600">
                        Email Address
                      </th>
                      <th className="p-2 font-bold text-slate-600">Plan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((u, index) => (
                      <tr
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`border-b border-slate-200 cursor-pointer transition-colors ${selectedUser?.id === u.id ? "bg-blue-50" : "hover:bg-slate-50"} ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                      >
                        <td className="p-2 text-slate-400 font-mono text-[10px] text-center">
                          {u.id.substring(0, 5)}
                        </td>
                        <td className="p-2 font-medium text-slate-900 whitespace-nowrap">
                          {u.name || "N/A"}
                        </td>
                        <td className="p-2 text-slate-600 whitespace-nowrap">
                          {u.email}
                        </td>
                        <td className="p-2">
                          <span
                            className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${u.plan === "pro" ? "bg-slate-800 text-white border-slate-900" : u.plan === "essential" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-500 border-slate-300"}`}
                          >
                            {u.plan || "basic"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* TRANSACTIONS TABLE VIEW */}
          {activeTab === "transactions" && (
            <div className="flex-1 overflow-auto custom-scroll">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-100 sticky top-0 border-b border-slate-300 z-10 shadow-sm">
                  <tr>
                    <th className="p-2 font-bold text-slate-600">Date</th>
                    <th className="p-2 font-bold text-slate-600">User Email</th>
                    <th className="p-2 font-bold text-slate-600">Req. Plan</th>
                    <th className="p-2 font-bold text-slate-600">
                      Transaction ID (UTR)
                    </th>
                    <th className="p-2 font-bold text-slate-600">Status</th>
                    <th className="p-2 font-bold text-slate-600 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx, index) => (
                    <tr
                      key={tx.id}
                      className={`border-b border-slate-200 ${index % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                    >
                      <td className="p-2 whitespace-nowrap text-slate-500">
                        {safeDate(tx.createdAt)}
                      </td>
                      <td className="p-2 font-medium text-slate-900">
                        {tx.userEmail}
                      </td>
                      <td className="p-2 font-bold text-slate-700 uppercase">
                        {tx.requestedPlan}
                      </td>
                      <td className="p-2 font-mono text-slate-600">
                        {tx.transactionId}
                      </td>
                      <td className="p-2">
                        <span
                          className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-sm border ${tx.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : tx.status === "approved" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}
                        >
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-2 text-right">
                        {tx.status === "pending" ? (
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => handleApproveTransaction(tx)}
                              className="bg-emerald-600 text-white px-2 py-1 rounded-sm text-[10px] font-bold hover:bg-emerald-700 border border-emerald-800"
                            >
                              APPROVE
                            </button>
                            <button
                              onClick={() => handleRejectTransaction(tx)}
                              className="bg-red-600 text-white px-2 py-1 rounded-sm text-[10px] font-bold hover:bg-red-700 border border-red-800"
                            >
                              REJECT
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] uppercase">
                            Processed
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: DETAILS VIEWER */}
        <div className="flex-1 flex flex-col bg-slate-50 overflow-hidden relative">
          {!selectedUser ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white">
              <Database className="w-16 h-16 mb-4 opacity-10" />
              <p className="font-medium text-sm">
                No record selected. Select a row from the dataset to view
                details.
              </p>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Profile Header Block */}
              <div className="bg-white border-b border-slate-300 p-4 shrink-0 flex items-start justify-between shadow-sm z-10">
                <div className="flex items-center gap-4">
                  {/* Profile Image Area */}
                  <div className="w-16 h-16 border border-slate-300 rounded-sm overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-sm">
                    <img
                      src={`https://api.dicebear.com/9.x/initials/svg?seed=${selectedUser.name || "User"}&backgroundColor=e2e8f0&textColor=0f172a`}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900 leading-tight">
                      {selectedUser.name || "Unregistered User"}
                    </h2>
                    <p className="text-xs font-mono text-slate-500 mb-1">
                      {selectedUser.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-1 border border-slate-200 rounded-sm">
                        UID: {selectedUser.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="flex items-center gap-2 bg-slate-100 border border-slate-300 p-1.5 rounded-sm shadow-inner">
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-1">
                      Subscription Level
                    </span>
                    <select
                      value={selectedUser.plan || "basic"}
                      onChange={(e) => handlePlanChangeRequest(e.target.value)}
                      className="bg-white border border-slate-300 text-xs font-bold text-slate-800 rounded-sm px-2 py-1 outline-none cursor-pointer focus:border-slate-500 shadow-sm"
                    >
                      <option value="basic">BASIC</option>
                      <option value="essential">ESSENTIAL</option>
                      <option value="pro">PRO (Premium)</option>
                    </select>
                  </div>

                  <div className="flex gap-1 mt-1">
                    <input
                      type="text"
                      placeholder="Dispatch system notice..."
                      value={adminMessage}
                      onChange={(e) => setAdminMessage(e.target.value)}
                      className="text-xs px-2 py-1 border border-slate-300 rounded-sm outline-none w-56 focus:border-slate-500 shadow-inner"
                    />
                    <button
                      onClick={handleSendNotification}
                      className="bg-slate-800 text-white px-2 py-1 rounded-sm text-[10px] font-bold hover:bg-slate-700 border border-slate-900 shadow-sm"
                    >
                      SEND
                    </button>
                  </div>
                </div>
              </div>

              {/* Data Split View */}
              <div className="flex-1 flex overflow-hidden bg-slate-200 p-2 gap-2">
                {/* Mid Column: Lists (Roadmaps & Chats) */}
                <div className="w-1/3 flex flex-col gap-2 shrink-0">
                  {/* Roadmaps Panel */}
                  <div className="flex-1 bg-white border border-slate-300 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
                      <Map className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Career Roadmaps
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <tbody>
                          {userRoadmaps.length === 0 ? (
                            <tr>
                              <td className="p-2 text-slate-400 italic">
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            userRoadmaps.map((r) => (
                              <tr
                                key={r.id}
                                className="border-b border-slate-100 hover:bg-slate-50"
                              >
                                <td className="p-1.5 font-medium text-slate-800">
                                  {r.role}
                                </td>
                                <td className="p-1.5 text-slate-400 text-right whitespace-nowrap">
                                  {safeDate(r.createdAt)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Chat Sessions Panel */}
                  <div className="flex-1 bg-white border border-slate-300 rounded-sm flex flex-col overflow-hidden shadow-sm">
                    <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Chat Sessions
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                      <table className="w-full text-left border-collapse text-[11px]">
                        <tbody>
                          {userChats.length === 0 ? (
                            <tr>
                              <td className="p-2 text-slate-400 italic">
                                No records found.
                              </td>
                            </tr>
                          ) : (
                            userChats.map((c) => (
                              <tr
                                key={c.id}
                                onClick={() => handleSelectChat(c.id)}
                                className={`border-b border-slate-100 cursor-pointer ${selectedChat === c.id ? "bg-slate-800 text-white" : "hover:bg-slate-50 text-slate-700"}`}
                              >
                                <td className="p-1.5 font-medium truncate max-w-[150px]">
                                  {c.title}
                                </td>
                                <td
                                  className={`p-1.5 text-right whitespace-nowrap ${selectedChat === c.id ? "text-slate-300" : "text-slate-400"}`}
                                >
                                  {safeDate(c.createdAt)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Right Column: Active Chat Log Display (System Text Style) */}
                <div className="flex-1 bg-white border border-slate-300 rounded-sm shadow-sm flex flex-col overflow-hidden">
                  <div className="bg-slate-100 border-b border-slate-300 px-3 py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-slate-500" />
                      <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Session Transcript Log
                      </span>
                    </div>
                    {selectedChat && (
                      <span className="text-[10px] font-mono text-slate-400 border border-slate-300 px-1 bg-white">
                        ID: {selectedChat}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto custom-scroll p-4 font-mono text-[11px] leading-relaxed bg-[#fafafa]">
                    {!selectedChat ? (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        Please select a chat session from the list to view the
                        transcript.
                      </div>
                    ) : chatMessages.length === 0 ? (
                      <div className="text-slate-400 italic">
                        No message data found for this session.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className="border-b border-slate-200 pb-2"
                          >
                            <span
                              className={`font-bold mr-2 ${msg.sender === "user" ? "text-blue-700" : "text-emerald-700"}`}
                            >
                              [{safeTime(msg.createdAt)}]{" "}
                              {msg.sender === "user"
                                ? "USER_REQ :"
                                : "SYS_RESP :"}
                            </span>
                            <span className="text-slate-800 whitespace-pre-wrap">
                              {msg.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
