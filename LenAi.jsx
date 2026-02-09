import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAuth } from "./context/AuthContext";
import { db } from "./firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  updateDoc,
} from "firebase/firestore";

// Initialize Gemini safely
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// --- SUGGESTION CHIPS ---
const SUGGESTIONS = [
  {
    label: "Draft a Resume",
    prompt: "Help me write a professional resume for a Software Engineer role.",
  },
  {
    label: "Explain React",
    prompt: "Explain React hooks to me like I'm 5 years old.",
  },
  {
    label: "Debug Code",
    prompt: "I have a bug in my JavaScript code. Can you help me find it?",
  },
  {
    label: "Career Advice",
    prompt: "What are the best steps to become a Full Stack Developer in 2025?",
  },
];

export const LenAi = () => {
  const { user } = useAuth();

  // --- UI STATES ---
  // Now supports: 'chat' | 'roadmap' | 'store' | 'feedback'
  const [activeTab, setActiveTab] = useState("chat");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // --- CHAT STATES ---
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // --- ROADMAP STATES ---
  const [roadmapInput, setRoadmapInput] = useState("");
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  // =========================================================================================
  // 1. FIRESTORE LISTENERS
  // =========================================================================================

  // Load CHATS Sidebar
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "chats"),
        orderBy("createdAt", "desc"),
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const fetchedChats = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChats(fetchedChats);
        if (!activeChatId && fetchedChats.length > 0)
          setActiveChatId(fetchedChats[0].id);
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // Load MESSAGES for Active Chat
  useEffect(() => {
    if (!user || !activeChatId) {
      setMessages([]);
      return;
    }
    try {
      const q = query(
        collection(db, "users", user.uid, "chats", activeChatId, "messages"),
        orderBy("createdAt", "asc"),
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
        scrollToBottom();
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user, activeChatId]);

  // Load SAVED ROADMAPS
  useEffect(() => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "roadmaps"),
        orderBy("createdAt", "desc"),
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        setRoadmaps(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        );
      });
      return () => unsubscribe();
    } catch (e) {
      console.error(e);
    }
  }, [user]);

  // =========================================================================================
  // 2. ACTIONS: CHAT (WITH MEMORY)
  // =========================================================================================
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const createNewChat = async () => {
    if (!user) return;
    setActiveTab("chat");
    try {
      const docRef = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: "New Chat",
        createdAt: serverTimestamp(),
      });
      setActiveChatId(docRef.id);
      setMessages([]);
      if (window.innerWidth < 768) setIsSidebarOpen(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendChat = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || !user || !genAI) return;

    setInput("");
    setChatLoading(true);

    let currentChatId = activeChatId;

    try {
      // 1. Ensure Chat Exists
      if (!currentChatId) {
        const docRef = await addDoc(
          collection(db, "users", user.uid, "chats"),
          {
            title: textToSend.slice(0, 30) + "...",
            createdAt: serverTimestamp(),
          },
        );
        currentChatId = docRef.id;
        setActiveChatId(currentChatId);
      } else {
        const currentChat = chats.find((c) => c.id === currentChatId);
        if (currentChat?.title === "New Chat" && messages.length === 0) {
          await updateDoc(doc(db, "users", user.uid, "chats", currentChatId), {
            title: textToSend.slice(0, 30) + "...",
          });
        }
      }

      // 2. Save User Message
      await addDoc(
        collection(db, "users", user.uid, "chats", currentChatId, "messages"),
        {
          text: textToSend,
          sender: "user",
          createdAt: serverTimestamp(),
        },
      );

      // 3. CONTEXT INJECTION (The Memory Trick)
      // We send the previous messages as "history" so Gemini knows who you are.
      const history = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });
      const chat = model.startChat({
        history: history, // <--- This is the key!
        generationConfig: {
          maxOutputTokens: 1000,
        },
      });

      const result = await chat.sendMessage(textToSend);
      const response = await result.response;
      const aiText = response.text();

      // 4. Save AI Response
      await addDoc(
        collection(db, "users", user.uid, "chats", currentChatId, "messages"),
        {
          text: aiText,
          sender: "Ai",
          createdAt: serverTimestamp(),
        },
      );
    } catch (error) {
      console.error(error);
      // Fallback
      try {
        const model = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
        });
        const result = await model.generateContent(textToSend);
        const response = await result.response;
        await addDoc(
          collection(db, "users", user.uid, "chats", currentChatId, "messages"),
          {
            text: response.text(),
            sender: "ai",
            createdAt: serverTimestamp(),
          },
        );
      } catch (fallbackError) {
        console.error("Fallback failed", fallbackError);
      }
    } finally {
      setChatLoading(false);
    }
  };

  const deleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this chat?")) return;
    await deleteDoc(doc(db, "users", user.uid, "chats", chatId));
    if (activeChatId === chatId) setActiveChatId(null);
  };

  // =========================================================================================
  // 3. ACTIONS: ROADMAP GENERATION
  // =========================================================================================
  const generateRoadmap = async () => {
    if (!roadmapInput.trim() || !user || !genAI) return;
    setRoadmapLoading(true);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });

      const prompt = `
        Create a detailed, step-by-step career roadmap for a "${roadmapInput}".
        Break it down into 5 to 7 distinct phases/steps.
        For each step, provide:
        1. "title": Short title of the phase.
        2. "duration": Estimated time (e.g. "2-3 weeks").
        3. "description": Brief advice.
        4. "resources": An array of 2 or 3 specific, free search terms for YouTube/Google (e.g. "Traversy Media React Crash Course").
        
        RETURN ONLY RAW JSON. Do not use Markdown formatting.
        Format:
        [
          {
            "step": 1,
            "title": "...",
            "duration": "...",
            "description": "...",
            "resources": ["...", "..."]
          }
        ]
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let roadmapData;
      try {
        roadmapData = JSON.parse(text);
      } catch (e) {
        console.error("JSON Parse Error", text);
        alert("AI response was not valid JSON. Please try again.");
        setRoadmapLoading(false);
        return;
      }

      const newRoadmap = {
        role: roadmapInput,
        steps: roadmapData,
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(
        collection(db, "users", user.uid, "roadmaps"),
        newRoadmap,
      );
      setRoadmapInput("");
      setActiveRoadmap({
        id: docRef.id,
        ...newRoadmap,
        createdAt: { toDate: () => new Date() },
      });
    } catch (error) {
      console.error("Roadmap Error:", error);
      alert("Failed to generate roadmap. Please check connection.");
    } finally {
      setRoadmapLoading(false);
    }
  };

  const deleteRoadmap = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm("Delete this roadmap?")) return;
    await deleteDoc(doc(db, "users", user.uid, "roadmaps", id));
    if (activeRoadmap?.id === id) setActiveRoadmap(null);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "Just now";
    if (timestamp.toDate) return timestamp.toDate().toLocaleDateString();
    return "Just now";
  };

  // =========================================================================================
  // 4. RENDER
  // =========================================================================================
  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* --- SIDEBAR --- */}
      <div
        className={`${
          isSidebarOpen
            ? "w-[260px] translate-x-0"
            : "w-0 -translate-x-full opacity-0"
        } bg-[#0f172a] text-[#e2e8f0] flex flex-col transition-all duration-300 relative z-20 h-full shrink-0 shadow-xl`}
      >
        <div className="p-4 pt-6">
          <button
            onClick={
              activeTab === "chat"
                ? createNewChat
                : () => setActiveRoadmap(null)
            }
            className="w-full flex items-center gap-3 px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all shadow-lg shadow-blue-900/20 group font-semibold text-white"
          >
            <div className="bg-white/20 w-6 h-6 rounded-full flex items-center justify-center text-sm group-hover:scale-110 transition-transform">
              +
            </div>
            <span>{activeTab === "chat" ? "New Chat" : "New Roadmap"}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1 custom-scrollbar">
          <div className="px-3 pb-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            {activeTab === "chat" ? "Chat History" : "Saved Roadmaps"}
          </div>

          {activeTab === "chat"
            ? chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    if (window.innerWidth < 768) setIsSidebarOpen(false);
                  }}
                  className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer text-sm transition-all border border-transparent ${
                    activeChatId === chat.id
                      ? "bg-slate-800 text-white border-slate-700 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <span className="truncate flex-1">{chat.title}</span>
                  {activeChatId === chat.id && (
                    <button
                      onClick={(e) => deleteChat(e, chat.id)}
                      className="ml-2 text-slate-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))
            : roadmaps.map((map) => (
                <div
                  key={map.id}
                  onClick={() => setActiveRoadmap(map)}
                  className={`group flex items-center justify-between px-3 py-3 rounded-lg cursor-pointer text-sm transition-all border border-transparent ${
                    activeRoadmap?.id === map.id
                      ? "bg-purple-900/30 text-purple-100 border-purple-500/30 shadow-sm"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <span className="truncate flex-1 font-medium">
                    {map.role}
                  </span>
                  <button
                    onClick={(e) => deleteRoadmap(e, map.id)}
                    className="ml-2 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </div>
              ))}
        </div>

        <div className="p-4 border-t border-slate-800 bg-[#0f172a]">
          <div className="flex items-center gap-3 hover:bg-slate-800 p-2 rounded-xl cursor-pointer transition-colors">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt="User"
                className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-700"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {user?.displayName?.[0] || "U"}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-white truncate">
                {user?.displayName || "User"}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {user?.email}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 flex flex-col h-full relative min-w-0 bg-white">
        {/* HEADER & TABS */}
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
          <div className="h-16 flex items-center justify-between px-4 md:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>

              {/* NAV TABS */}
              <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto no-scrollbar">
                <button
                  onClick={() => setActiveTab("chat")}
                  className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "chat"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  AI Chat
                </button>
                <button
                  onClick={() => setActiveTab("roadmap")}
                  className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "roadmap"
                      ? "bg-white text-purple-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Roadmap
                </button>
                <button
                  onClick={() => setActiveTab("resume")}
                  className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "resume"
                      ? "bg-white text-slate-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Deep Resume Analysis
                </button>
                <button
                  onClick={() => setActiveTab("store")}
                  className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "store"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  E-Learning Store
                </button>
                <button
                  onClick={() => setActiveTab("feedback")}
                  className={`px-3 py-1.5 rounded-md text-sm font-bold transition-all whitespace-nowrap ${
                    activeTab === "feedback"
                      ? "bg-white text-red-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  Feedback
                </button>
              </div>
            </div>
            <div className="font-bold text-slate-800 tracking-tight hidden md:block">
              Len<span className="text-blue-600">Ai</span>
            </div>
          </div>
        </header>

        {/* --- BODY CONTENT SWITCHER --- */}

        {/* 1. CHAT VIEW */}
        {activeTab === "chat" && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 md:px-0">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center max-w-3xl mx-auto px-4 animate-fade-in-up">
                  <div className="bg-blue-50 p-6 rounded-3xl mb-6 shadow-sm">
                    <span className="text-4xl">👋</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2 text-center">
                    Hello, {user?.displayName?.split(" ")[0]}
                  </h1>
                  <p className="text-slate-500 mb-10 text-center">
                    Ready to engineer your next career move?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendChat(s.prompt)}
                        className="text-left p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-all group bg-white shadow-sm"
                      >
                        <div className="font-bold text-slate-700 text-sm mb-1 group-hover:text-blue-600">
                          {s.label}
                        </div>
                        <div className="text-xs text-slate-400">{s.prompt}</div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-3xl mx-auto py-8 space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-4 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {msg.sender === "ai" && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex-shrink-0 flex items-center justify-center text-black text-[10px] font-bold shadow-md">
                          AI
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] px-6 py-4 rounded-2xl text-[15px] leading-relaxed shadow-sm whitespace-pre-wrap ${
                          msg.sender === "user"
                            ? "bg-slate-900 text-white rounded-br-none"
                            : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      {msg.sender === "user" && (
                        <img
                          src={user?.photoURL}
                          className="w-8 h-8 rounded-full border border-slate-200"
                          alt=""
                        />
                      )}
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="ml-12 text-slate-400 text-sm animate-pulse">
                      LenAi is thinking...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
            <div className="p-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
              <div className="max-w-3xl mx-auto relative">
                <input
                  className="w-full bg-slate-100 hover:bg-slate-50 border-none focus:bg-white focus:ring-2 focus:ring-blue-100 text-slate-900 rounded-2xl px-6 py-4 pr-14 transition-all font-medium placeholder:text-slate-400 shadow-inner"
                  placeholder="Message LenAi..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                  disabled={chatLoading}
                />
                <button
                  onClick={() => handleSendChat()}
                  disabled={!input.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-slate-900 hover:bg-slate-700 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-all disabled:opacity-0 disabled:scale-75"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. ROADMAP VIEW */}
        {activeTab === "roadmap" && (
          <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-10">
            <div className="max-w-4xl mx-auto">
              {!activeRoadmap && (
                <div className="flex flex-col items-center justify-center py-20 animate-fade-in-up">
                  <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm">
                    🗺️
                  </div>
                  <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4 text-center">
                    Build Your Career Roadmap
                  </h2>
                  <p className="text-slate-500 mb-8 text-center max-w-lg text-lg">
                    Enter your dream role (e.g. "DevOps Engineer", "Data
                    Scientist") and AI will engineer a step-by-step path for
                    you.
                  </p>

                  <div className="w-full max-w-xl relative flex items-center">
                    <input
                      type="text"
                      placeholder="I want to become a..."
                      className="w-full text-lg px-6 py-5 rounded-2xl border-2 border-slate-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all shadow-xl shadow-purple-500/5 bg-white"
                      value={roadmapInput}
                      onChange={(e) => setRoadmapInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && generateRoadmap()}
                      disabled={roadmapLoading}
                    />
                    <button
                      onClick={generateRoadmap}
                      disabled={roadmapLoading || !roadmapInput.trim()}
                      className="absolute right-3 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                    >
                      {roadmapLoading ? "Generating..." : "Generate Path"}
                    </button>
                  </div>

                  {roadmaps.length > 0 && (
                    <p className="mt-12 text-sm font-bold text-slate-400 uppercase tracking-widest">
                      Or select a saved roadmap from the sidebar
                    </p>
                  )}
                </div>
              )}

              {activeRoadmap && (
                <div className="animate-fade-in-up">
                  <div className="flex justify-between items-start mb-10">
                    <div>
                      <div className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                        Generated Path
                      </div>
                      <h1 className="text-3xl font-black text-slate-900 capitalize">
                        {activeRoadmap.role}
                      </h1>
                      <p className="text-slate-500 mt-1">
                        Created on {formatDate(activeRoadmap.createdAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveRoadmap(null)}
                      className="text-sm font-bold text-slate-400 hover:text-slate-600 underline"
                    >
                      Create New
                    </button>
                  </div>

                  <div className="relative border-l-2 border-slate-200 ml-4 md:ml-6 space-y-10 pb-10">
                    {activeRoadmap.steps.map((step, index) => (
                      <div key={index} className="relative pl-8 md:pl-12 group">
                        <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-4 border-slate-300 group-hover:border-purple-500 transition-colors"></div>

                        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-purple-100 transition-all duration-300">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
                            <h3 className="text-xl font-bold text-slate-800">
                              {step.title}
                            </h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full whitespace-nowrap">
                              ⏱ {step.duration}
                            </span>
                          </div>

                          <p className="text-slate-600 leading-relaxed mb-5">
                            {step.description}
                          </p>

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                              <span>📺</span> Recommended Search Terms
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {step.resources.map((res, rIndex) => (
                                <a
                                  key={rIndex}
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(res)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-sm text-blue-600 bg-white border border-slate-200 px-3 py-1.5 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all flex items-center gap-1"
                                >
                                  {res} <span className="opacity-50">↗</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. RESUME VIEW */}
        {activeTab === "resume" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm mx-auto">
                🚧
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
                Deep Resume Analysis
              </h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
                This feature is coming soon! Get AI-powered insights to optimize
                your resume for ATS and recruiters.
              </p>
            </div>
          </div>
        )}

        {/* 4. STORE VIEW */}
        {activeTab === "store" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm mx-auto">
                🚧
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
                E-Learning Store
              </h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
                This feature is coming soon! Explore curated courses, books, and
                resources recommended by AI to supercharge your learning
                journey.
              </p>
            </div>
          </div>
        )}

        {/* 5. FEEDBACK VIEW */}
        {activeTab === "feedback" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-sm mx-auto">
                🚧
              </div>
              <h2 className="text-3xl md:text-4xl font-black text-slate-800 mb-4">
                Feedback & Support
              </h2>
              <p className="text-slate-500 mb-8 max-w-md mx-auto text-lg">
                This feature is coming soon! We value your feedback to make
                LenAi better.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
