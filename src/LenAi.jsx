import React, { useState, useEffect, useRef } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useAuth } from "./context/AuthContext";
import { db } from "./firebase";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import {
  Play,
  Search,
  Clock,
  Sparkles,
  TrendingUp,
  MoreHorizontal,
  BookOpen,
  Filter,
  ArrowRight,
} from "lucide-react";
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

// --- CONFIGURATION ---
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// --- LEGACY ICONS (Kept for Sidebar Consistency) ---
const Icon = {
  Message: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  Map: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  ),
  FileText: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  Mail: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Heart: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  ),
  Video: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  Send: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  ),
  Plus: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Upload: () => (
    <svg
      className="w-6 h-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  ChevronLeft: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="15 18 9 12 15 6"></polyline>
    </svg>
  ),
  ChevronRight: () => (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <polyline points="9 18 15 12 9 6"></polyline>
    </svg>
  ),
  Magic: () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
    </svg>
  ),
};

// --- CHAT SUGGESTIONS ---
const SUGGESTIONS = [
  {
    label: "Draft Resume",
    prompt: "Help me write a professional resume for a Software Engineer.",
  },
  { label: "Explain React", prompt: "Explain React hooks like I'm 5." },
  { label: "Debug Code", prompt: "I have a bug in my code. Can you help?" },
  { label: "Career Path", prompt: "Steps to become a Full Stack Dev in 2025?" },
];

// =========================================================================================
// SUB-COMPONENT: E-LEARNING STORE (REDESIGNED)
// =========================================================================================
const ELearningStore = ({ recommendedTopic = "", isAnalyzing = false }) => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");

  const POPULAR_CHANNELS = [
    "All",
    "FreeCodeCamp",
    "Fireship",
    "Web Dev Simplified",
    "Traversy Media",
    "Beyond Fire",
  ];

  const timeAgo = (dateString) => {
    const now = new Date();
    const past = new Date(dateString);
    const seconds = Math.floor((now - past) / 1000);
    if (seconds / 31536000 > 1) return Math.floor(seconds / 31536000) + "y ago";
    if (seconds / 2592000 > 1) return Math.floor(seconds / 2592000) + "mo ago";
    if (seconds / 86400 > 1) return Math.floor(seconds / 86400) + "d ago";
    return Math.floor(seconds / 3600) + "h ago";
  };

  const fetchVideos = async (query) => {
    if (!YOUTUBE_API_KEY || !query) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=13&q=${encodeURIComponent(query + " course tutorial")}&type=video&key=${YOUTUBE_API_KEY}`,
      );
      const data = await response.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error("YouTube Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const topic = recommendedTopic || "Full Stack Development";
    setSearchQuery(topic);
    fetchVideos(topic);
  }, [recommendedTopic]);

  const handleSearch = (e) => {
    if (e.key === "Enter") fetchVideos(searchQuery);
  };

  return (
    <div className="h-full flex flex-col bg-[#FDFDFD] relative overflow-hidden font-sans">
      {/* 1. HERO HEADER */}
      <div className="bg-white border-b border-slate-100 px-8 py-6 sticky top-0 z-20 shadow-sm/50">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <BookOpen
                  className="w-8 h-8 text-slate-900"
                  strokeWidth={2.5}
                />
                Knowledge Hub
              </h2>
              <div className="flex items-center gap-2 mt-2">
                {isAnalyzing ? (
                  <span className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider bg-blue-50 px-3 py-1 rounded-full animate-pulse">
                    <Sparkles className="w-3 h-3" /> Analyzing Context...
                  </span>
                ) : (
                  <span className="text-slate-500 text-sm font-medium">
                    Curated technical masterclasses & resources.
                  </span>
                )}
              </div>
            </div>

            {/* Modern Search */}
            <div className="relative w-full md:w-[420px] group">
              <input
                type="text"
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3.5 pl-12 text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 transition-all placeholder:text-slate-400"
                placeholder="What do you want to master?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {POPULAR_CHANNELS.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setActiveFilter(name);
                  fetchVideos(
                    name === "All" ? searchQuery : `${name} ${searchQuery}`,
                  );
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  activeFilter === name
                    ? "bg-slate-900 text-white border-slate-900 shadow-lg shadow-slate-900/20"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. CONTENT AREA */}
      <div className="flex-1 overflow-y-auto custom-scroll p-8">
        <div className="max-w-7xl mx-auto">
          {loading ? (
            // SKELETON LOADER
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-1 md:col-span-3 h-[400px] bg-slate-100 rounded-3xl animate-pulse"></div>
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-48 bg-slate-100 rounded-2xl animate-pulse"></div>
                  <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* FEATURED SPOTLIGHT (First Item) */}
              {videos.length > 0 && (
                <div className="mb-12">
                  <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Top Recommendation
                  </h3>
                  <a
                    href={`https://www.youtube.com/watch?v=${videos[0].id.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative block w-full h-[400px] rounded-3xl overflow-hidden shadow-xl shadow-slate-200 cursor-pointer"
                  >
                    <img
                      src={videos[0].snippet.thumbnails.high.url}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt="Featured"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>

                    <div className="absolute bottom-0 left-0 p-8 md:p-12 w-full md:w-2/3">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">
                        <Sparkles className="w-3 h-3 text-yellow-300" />{" "}
                        Featured Masterclass
                      </div>
                      <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-4 line-clamp-2">
                        {videos[0].snippet.title}
                      </h1>
                      <div className="flex items-center gap-4 text-slate-200 text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://api.dicebear.com/9.x/initials/svg?seed=${videos[0].snippet.channelTitle}`}
                            className="w-6 h-6 rounded-full bg-white/10"
                            alt=""
                          />
                          {videos[0].snippet.channelTitle}
                        </div>
                        <span>•</span>
                        <span>{timeAgo(videos[0].snippet.publishedAt)}</span>
                      </div>
                    </div>

                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100">
                      <Play className="w-8 h-8 text-white fill-white" />
                    </div>
                  </a>
                </div>
              )}

              {/* STANDARD GRID */}
              <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Filter className="w-4 h-4" /> Quick Picks
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {videos.slice(1).map((video) => (
                  <a
                    key={video.id.videoId}
                    href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                    target="_blank"
                    rel="noreferrer"
                    className="group flex flex-col cursor-pointer"
                  >
                    {/* Thumbnail Card */}
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-sm bg-slate-100 mb-4 ring-1 ring-slate-900/5 group-hover:ring-slate-900/10 transition-all">
                      <img
                        src={video.snippet.thumbnails.high.url}
                        alt=""
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                        <Play className="text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all duration-300 w-10 h-10 fill-white/20" />
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {timeAgo(video.snippet.publishedAt)}
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="space-y-1 px-1">
                      <h3 className="text-[15px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {video.snippet.title}
                      </h3>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 hover:text-slate-800 transition">
                          <div className="w-5 h-5 rounded-full bg-slate-200 overflow-hidden">
                            <img
                              src={`https://api.dicebear.com/9.x/initials/svg?seed=${video.snippet.channelTitle}`}
                              alt=""
                            />
                          </div>
                          {video.snippet.channelTitle}
                        </div>
                        <button className="text-slate-300 hover:text-slate-900 transition">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: FEEDBACK VIEW
// =========================================================================================
const FeedbackView = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    suggestion: "",
  });
  const [status, setStatus] = useState("idle");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");
    try {
      await addDoc(collection(db, "feedback"), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      setStatus("success");
    } catch {
      setStatus("idle");
      alert("Error submitting feedback");
    }
  };

  if (status === "success") {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-enter">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-6 shadow-sm">
          <svg
            className="w-10 h-10"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            viewBox="0 0 24 24"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        <h2 className="text-3xl font-black text-slate-800">Feedback Sent</h2>
        <p className="text-slate-500 mt-3 mb-10 text-lg">
          We appreciate your contribution.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setFormData({ name: "", email: "", phone: "", suggestion: "" });
          }}
          className="text-sm font-bold text-slate-900 border-b-2 border-slate-900 pb-1 hover:text-blue-600 hover:border-blue-600 transition"
        >
          Send Another
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto custom-scroll">
      <div className="max-w-2xl mx-auto w-full">
        <div className="mb-10">
          <h2 className="text-3xl font-black text-slate-900 mb-2">Feedback</h2>
          <p className="text-slate-500 text-lg">
            Help us engineer a better experience.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Name
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input-minimal w-full p-4 rounded-xl text-slate-900 bg-white border border-slate-200 focus:border-slate-400 transition"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Email
              </label>
              <input
                required
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input-minimal w-full p-4 rounded-xl text-slate-900 bg-white border border-slate-200 focus:border-slate-400 transition"
                placeholder="john@example.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Phone
            </label>
            <input
              required
              type="tel"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="input-minimal w-full p-4 rounded-xl text-slate-900 bg-white border border-slate-200 focus:border-slate-400 transition"
              placeholder="+1 234 567 890"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Message
            </label>
            <textarea
              required
              rows="5"
              value={formData.suggestion}
              onChange={(e) =>
                setFormData({ ...formData, suggestion: e.target.value })
              }
              className="input-minimal w-full p-4 rounded-xl text-slate-900 bg-white border border-slate-200 focus:border-slate-400 transition resize-none"
              placeholder="Your thoughts..."
            />
          </div>
          <button
            disabled={status === "loading"}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50 shadow-lg shadow-slate-900/10"
          >
            {status === "loading" ? "Sending..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: RESUME ARCHITECT
// =========================================================================================
const ResumeAnalyzer = () => {
  const [file, setFile] = useState(null);
  const [score, setScore] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [loading, setLoading] = useState(false);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (
      f &&
      (f.type === "application/pdf" ||
        f.type.includes("word") ||
        f.type.includes("officedocument"))
    )
      setFile(f);
    else alert("Please upload a PDF or DOCX file.");
  };

  const extractText = async (file) => {
    try {
      if (file.type === "application/pdf") {
        const buffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
        let text = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          text += content.items.map((item) => item.str).join(" ");
        }
        return text;
      } else {
        const buffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buffer });
        return result.value;
      }
    } catch {
      return null;
    }
  };

  const analyze = async () => {
    if (!file || !genAI) return;
    setLoading(true);
    try {
      const resumeText = await extractText(file);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });
      const prompt = `
        You are a Senior Technical Recruiter at a top FAANG company. 
        Conduct a ruthless, deep-dive review of this resume.
        Resume Text: "${resumeText}"
        Output STRICTLY in this format:
        Score: <number 0-100>
        Critical Flaws:
        - <Point 1>
        Technical Gaps:
        - <Point 1>
        Impact & Metrics Improvements:
        - <Point 1>
        Formatting & ATS Check:
        - <Point 1>
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const scoreMatch = text.match(/Score:\s*(\d+)/);
      setScore(scoreMatch ? Number(scoreMatch[1]) : 0);

      const sections = {};
      let currentSection = "";
      text.split("\n").forEach((line) => {
        const trim = line.trim();
        if (
          trim.endsWith(":") &&
          !trim.startsWith("-") &&
          !trim.startsWith("Score")
        ) {
          currentSection = trim.replace(":", "");
          sections[currentSection] = [];
        } else if (trim.startsWith("-") && currentSection) {
          sections[currentSection].push(trim.replace("-", "").trim());
        }
      });
      setSuggestions(sections);
    } catch {
      alert("Analysis failed.");
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-8 md:p-12 overflow-y-auto custom-scroll">
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="text-3xl font-black text-slate-900 mb-2">
          Resume Architect
        </h2>
        <p className="text-slate-500 mb-8 text-lg">
          Senior-level audit for your career documents.
        </p>

        <div className="border-2 border-dashed border-slate-300 rounded-2xl p-10 bg-slate-50 hover:bg-slate-100 hover:border-slate-400 transition-all text-center mb-8">
          <div className="w-16 h-16 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-900 mx-auto mb-4">
            <Icon.Upload />
          </div>
          <input
            type="file"
            onChange={handleFile}
            className="hidden"
            id="resume-upload"
            accept=".pdf,.docx"
          />
          <label
            htmlFor="resume-upload"
            className="block text-lg font-bold text-slate-900 cursor-pointer hover:underline mb-1"
          >
            {file ? file.name : "Upload Resume (PDF/DOCX)"}
          </label>
          <p className="text-sm text-slate-400">
            AI Analysis powered by Gemini 2.5
          </p>
        </div>

        <button
          onClick={analyze}
          disabled={!file || loading}
          className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 disabled:opacity-50 transition shadow-lg"
        >
          {loading ? "Auditing Profile..." : "Run Career Audit"}
        </button>

        {score !== null && (
          <div className="mt-12 animate-enter">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                Hiring Probability
              </span>
              <span
                className={`text-5xl font-black ${score > 75 ? "text-emerald-600" : "text-amber-500"}`}
              >
                {score}%
              </span>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden mb-10">
              <div
                className={`h-full ${score > 75 ? "bg-emerald-500" : "bg-amber-500"}`}
                style={{ width: `${score}%` }}
              ></div>
            </div>

            <div className="grid gap-6">
              {Object.entries(suggestions).map(([k, v]) => (
                <div
                  key={k}
                  className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm"
                >
                  <h3 className="text-md font-bold text-slate-900 mb-4 uppercase tracking-wide border-b border-slate-100 pb-2">
                    {k}
                  </h3>
                  <ul className="space-y-3">
                    {v.map((item, i) => (
                      <li
                        key={i}
                        className="text-slate-700 leading-relaxed flex items-start gap-3"
                      >
                        <span className="text-red-500 font-bold mt-1">×</span>{" "}
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================================
// MAIN COMPONENT: LENAI (FULL SCREEN CONSOLE)
// =========================================================================================
export const LenAi = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);

  // --- SPLASH SCREEN STATE ---
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

  // Data States
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // --- INTELLIGENT STORE CONTEXT ---
  const [storeTopic, setStoreTopic] = useState("");
  const [analyzingProfile, setAnalyzingProfile] = useState(false);

  const [roadmapInput, setRoadmapInput] = useState("");
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [emailImage, setEmailImage] = useState(null);
  const [emailResult, setEmailResult] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // --- SPLASH SCREEN EFFECT ---
  useEffect(() => {
    // 1. Wait 2.5 seconds before starting to fade
    const timerStartFade = setTimeout(() => {
      setIsFading(true);
    }, 2500);

    // 2. Remove from DOM after fade completes (2.5s wait + 1.5s fade = 4.0s total)
    const timerUnmount = setTimeout(() => {
      setShowSplash(false);
    }, 4000);

    return () => {
      clearTimeout(timerStartFade);
      clearTimeout(timerUnmount);
    };
  }, []);

  // --- FIRESTORE LISTENERS ---
  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(
        collection(db, "users", user.uid, "chats"),
        orderBy("createdAt", "desc"),
      ),
      (s) => {
        const data = s.docs.map((d) => ({ id: d.id, ...d.data() }));
        setChats(data);
        if (!activeChatId && data.length > 0) setActiveChatId(data[0].id);
      },
    );
  }, [user]);

  useEffect(() => {
    if (!user || !activeChatId) {
      setMessages([]);
      return;
    }
    return onSnapshot(
      query(
        collection(db, "users", user.uid, "chats", activeChatId, "messages"),
        orderBy("createdAt", "asc"),
      ),
      (s) => {
        setMessages(s.docs.map((d) => ({ id: d.id, ...d.data() })));
        setTimeout(
          () => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }),
          100,
        );
      },
    );
  }, [user, activeChatId]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(
      query(
        collection(db, "users", user.uid, "roadmaps"),
        orderBy("createdAt", "desc"),
      ),
      (s) => {
        setRoadmaps(s.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
    );
  }, [user]);

  // --- SMART ANALYSIS FUNCTION ---
  const analyzeUserInterests = async () => {
    // 1. Gather recent history
    const recentChats = chats
      .slice(0, 5)
      .map((c) => c.title)
      .join(", ");
    const recentRoadmaps = roadmaps
      .slice(0, 3)
      .map((r) => r.role)
      .join(", ");

    // If no history, default to popular stuff
    if (!recentChats && !recentRoadmaps) return;

    setAnalyzingProfile(true);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });
      const prompt = `
        User Context:
        - Recent Chat Topics: ${recentChats}
        - Career Roadmaps Created: ${recentRoadmaps}
        
        Task: Analyze this history and determine the SINGLE most relevant technical topic/skill this user is currently focusing on.
        Output: Just the topic name (e.g., "Advanced React Patterns" or "DevOps Fundamentals"). No punctuation.
      `;

      const result = await model.generateContent(prompt);
      const topic = result.response.text().trim();
      setStoreTopic(topic);
    } catch (e) {
      console.error("Profile analysis failed", e);
    }
    setAnalyzingProfile(false);
  };

  useEffect(() => {
    if (activeTab === "store") {
      analyzeUserInterests();
    }
  }, [activeTab]);

  // --- ACTIONS ---
  const sendChat = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if (!textToSend.trim() || !user || !genAI) return;

    setInput("");
    setChatLoading(true);

    let cid = activeChatId;
    if (!cid) {
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: textToSend.slice(0, 25) + "...",
        createdAt: serverTimestamp(),
      });
      cid = ref.id;
      setActiveChatId(ref.id);
    } else {
      const currentChat = chats.find((c) => c.id === cid);
      if (currentChat?.title === "New Session" && messages.length === 0) {
        await updateDoc(doc(db, "users", user.uid, "chats", cid), {
          title: textToSend.slice(0, 30) + "...",
        });
      }
    }

    await addDoc(collection(db, "users", user.uid, "chats", cid, "messages"), {
      text: textToSend,
      sender: "user",
      createdAt: serverTimestamp(),
    });

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
        systemInstruction:
          "You are a Principal Software Architect. Be concise, expert, and direct.",
      });
      const history = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));
      const result = await model.startChat({ history }).sendMessage(textToSend);
      await addDoc(
        collection(db, "users", user.uid, "chats", cid, "messages"),
        {
          text: result.response.text(),
          sender: "ai",
          createdAt: serverTimestamp(),
        },
      );
    } catch (e) {
      console.error(e);
    }
    setChatLoading(false);
  };

  const createChat = async () => {
    setActiveTab("chat");
    if (user) {
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: "New Session",
        createdAt: serverTimestamp(),
      });
      setActiveChatId(ref.id);
    }
  };

  const generateRoadmap = async () => {
    if (!roadmapInput || !genAI) return;
    setRoadmapLoading(true);

    // Immediate Update: If user generates a roadmap, the store should focus on that
    setStoreTopic(roadmapInput);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });
      const prompt = `Create a masterclass-level career roadmap for a "${roadmapInput}". Return RAW JSON array: [{ "step": 1, "title": "", "duration": "", "description": "", "resources": [""] }]`;
      const result = await model.generateContent(prompt);
      const data = JSON.parse(
        result.response
          .text()
          .replace(/```json|```/g, "")
          .trim(),
      );
      const ref = await addDoc(collection(db, "users", user.uid, "roadmaps"), {
        role: roadmapInput,
        steps: data,
        createdAt: serverTimestamp(),
      });
      setActiveRoadmap({ id: ref.id, role: roadmapInput, steps: data });
      setRoadmapInput("");
    } catch (e) {
      console.error(e);
    }
    setRoadmapLoading(false);
  };

  const generateEmail = async () => {
    if ((!emailInput && !emailImage) || !genAI) return;
    setEmailLoading(true);
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash-lite",
      });
      const prompt = `
            You are a professional email writer. 
            Task: Write a polished, professional email based on the user's notes below.
            STRICT RULES:
            1. Return ONLY the email text.
            2. Do NOT write "Here is your email" or "Sure".
            3. Do NOT use Markdown code blocks.
            4. Format clearly with "Subject:" at the top.
            User Notes: "${emailInput}"
          `;
      const parts = [prompt];
      if (emailImage) {
        const reader = new FileReader();
        reader.readAsDataURL(emailImage);
        await new Promise((r) => (reader.onload = r));
        parts.push({
          inlineData: {
            data: reader.result.split(",")[1],
            mimeType: emailImage.type,
          },
        });
      }
      const result = await model.generateContent(parts);
      setEmailResult(result.response.text().trim());
    } catch (e) {
      console.error(e);
    }
    setEmailLoading(false);
  };

  const deleteItem = async (col, id) => {
    if (!window.confirm("Delete?")) return;
    await deleteDoc(doc(db, "users", user.uid, col, id));
    if (col === "chats" && activeChatId === id) setActiveChatId(null);
    if (col === "roadmaps" && activeRoadmap?.id === id) setActiveRoadmap(null);
  };

  // --- RENDER ---
  return (
    <>
      {/* 0. SPLASH SCREEN */}
      {showSplash && (
        <div
          className={`fixed inset-0 z-50 bg-slate-950 flex items-center justify-center transition-opacity duration-[1500ms] ease-out ${
            isFading ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center text-slate-950 font-black text-5xl mb-6 shadow-2xl shadow-blue-500/20 animate-pulse">
              L
            </div>
            <div className="h-1 w-32 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-white w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN APP */}
      <div className="h-screen w-screen console-window flex relative bg-white overflow-hidden">
        {/* 1. ICON RAIL (Navigation) */}
        <div className="w-20 bg-white border-r border-slate-200 flex flex-col items-center py-8 shrink-0 z-30">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black mb-10 shadow-lg shadow-slate-900/20 text-lg">
            L
          </div>
          <nav className="flex flex-col gap-6 flex-1 w-full px-2 items-center">
            {[
              { id: "chat", icon: Icon.Message, label: "Chat" },
              { id: "roadmap", icon: Icon.Map, label: "Roadmap" },
              { id: "store", icon: Icon.Video, label: "Store" },
              { id: "resume", icon: Icon.FileText, label: "Resume" },
              { id: "email", icon: Icon.Mail, label: "Email" },
              { id: "feedback", icon: Icon.Heart, label: "Feedback" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`btn-icon w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${activeTab === t.id ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20 scale-105" : "text-slate-400 hover:bg-slate-50 hover:text-slate-600"}`}
                title={t.label}
              >
                <t.icon />
              </button>
            ))}
          </nav>

          {/* User Profile Trigger */}
          <div className="mt-auto mb-4 relative">
            <button
              onClick={() => setProfileOpen(!profileOpen)}
              className="outline-none"
            >
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 border border-slate-200 hover:ring-2 hover:ring-slate-300 transition select-none">
                {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
              </div>
            </button>

            {/* Profile Popover */}
            {profileOpen && (
              <div className="absolute bottom-12 left-14 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-enter">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500 shrink-0 select-none">
                    {user?.displayName
                      ? user.displayName[0].toUpperCase()
                      : "U"}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-bold text-slate-900 truncate">
                      {user?.displayName || "User"}
                    </div>
                    <div className="text-xs text-slate-500 truncate">
                      {user?.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 border-t border-slate-100 pt-2"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 2. SIDEBAR (History - Collapsible) */}
        <div
          className={`${sidebarVisible ? "w-72" : "w-0"} bg-slate-50/50 border-r border-slate-200 flex flex-col shrink-0 transition-all duration-300 overflow-hidden relative`}
        >
          <div className="p-6 border-b border-slate-200/50 flex justify-between items-center bg-white/50 backdrop-blur-sm min-w-[288px]">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
              {activeTab === "roadmap" ? "My Paths" : "History"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={
                  activeTab === "roadmap"
                    ? () => setActiveRoadmap(null)
                    : createChat
                }
                className="text-slate-400 hover:text-slate-900 transition"
              >
                <Icon.Plus />
              </button>
              <button
                onClick={() => setSidebarVisible(false)}
                className="text-slate-400 hover:text-slate-900 transition"
              >
                <Icon.ChevronLeft />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scroll p-3 space-y-1 min-w-[288px]">
            {activeTab === "roadmap"
              ? roadmaps.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => {
                      setActiveRoadmap(r);
                      setActiveTab("roadmap");
                    }}
                    className={`p-4 rounded-xl text-sm font-semibold cursor-pointer flex justify-between items-center group transition-all ${activeRoadmap?.id === r.id ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}
                  >
                    <span className="truncate">{r.role}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem("roadmaps", r.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 transition ${activeRoadmap?.id === r.id ? "text-slate-400 hover:text-white" : "text-slate-300 hover:text-red-500"}`}
                    >
                      <Icon.Trash />
                    </button>
                  </div>
                ))
              : chats.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveChatId(c.id);
                      setActiveTab("chat");
                    }}
                    className={`p-4 rounded-xl text-sm font-semibold cursor-pointer flex justify-between items-center group transition-all ${activeChatId === c.id ? "bg-slate-900 text-white shadow-md" : "text-slate-600 hover:bg-white hover:shadow-sm"}`}
                  >
                    <span className="truncate">{c.title}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteItem("chats", c.id);
                      }}
                      className={`opacity-0 group-hover:opacity-100 transition ${activeChatId === c.id ? "text-slate-400 hover:text-white" : "text-slate-300 hover:text-red-500"}`}
                    >
                      <Icon.Trash />
                    </button>
                  </div>
                ))}
          </div>
        </div>

        {/* 3. WORKSPACE */}
        <div className="flex-1 bg-white relative flex flex-col min-w-0">
          <header className="h-20 border-b border-slate-100 flex items-center px-10 justify-between shrink-0 bg-white">
            <div className="flex items-center gap-4">
              {!sidebarVisible && (
                <button
                  onClick={() => setSidebarVisible(true)}
                  className="text-slate-400 hover:text-slate-900 transition p-2 hover:bg-slate-50 rounded-lg"
                >
                  <Icon.ChevronRight />
                </button>
              )}
              <div>
                <h1 className="text-xl font-black text-slate-900 capitalize tracking-tight">
                  {activeTab} Console
                </h1>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  LenAi v2.3 • Online
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-hidden relative">
            {/* CHAT */}
            {activeTab === "chat" && (
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-y-auto custom-scroll p-10 space-y-8">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center">
                      <div className="w-20 h-20 bg-slate-100 rounded-3xl mb-6 flex items-center justify-center text-slate-400">
                        <Icon.Message />
                      </div>
                      <p className="font-bold text-slate-900 text-lg mb-8">
                        Start a new session
                      </p>
                      <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                        {SUGGESTIONS.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => sendChat(s.prompt)}
                            className="text-left p-4 rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50 transition-all group bg-white shadow-sm"
                          >
                            <div className="font-bold text-slate-700 text-sm mb-1 group-hover:text-slate-900">
                              {s.label}
                            </div>
                            <div className="text-xs text-slate-400 truncate">
                              {s.prompt}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-6 ${m.sender === "user" ? "flex-row-reverse" : ""}`}
                      >
                        {/* Chat Avatar */}
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 shadow-sm select-none ${m.sender === "user" ? "bg-slate-900 text-white" : "bg-white border border-slate-200 text-blue-600"}`}
                        >
                          {m.sender === "user"
                            ? user?.displayName
                              ? user.displayName[0].toUpperCase()
                              : "U"
                            : "AI"}
                        </div>
                        <div
                          className={`max-w-3xl p-6 rounded-2xl text-[15px] leading-relaxed shadow-sm ${m.sender === "user" ? "bg-slate-50 text-slate-800 border border-slate-200" : "bg-white text-slate-700 border border-slate-100"}`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="text-xs font-bold text-slate-400 ml-16 animate-pulse">
                      LenAi is thinking...
                    </div>
                  )}
                  <div ref={chatEndRef}></div>
                </div>
                <div className="p-8 border-t border-slate-100 bg-white">
                  <div className="relative shadow-xl shadow-slate-200/50 rounded-2xl max-w-5xl mx-auto">
                    <input
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-6 pr-16 py-5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 transition-all font-medium text-lg"
                      placeholder="Type a command..."
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendChat()}
                      disabled={chatLoading}
                    />
                    <button
                      onClick={() => sendChat()}
                      disabled={!input.trim()}
                      className="absolute right-3 top-3 bottom-3 w-12 bg-slate-900 rounded-xl flex items-center justify-center text-white hover:bg-slate-800 transition shadow-md"
                    >
                      <Icon.Send />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ROADMAP */}
            {activeTab === "roadmap" && (
              <div className="h-full overflow-y-auto custom-scroll p-10">
                {!activeRoadmap ? (
                  <div className="max-w-2xl mx-auto mt-24 text-center">
                    <h2 className="text-4xl font-black text-slate-900 mb-4">
                      Career Architect
                    </h2>
                    <p className="text-slate-500 mb-10 text-lg">
                      Design a masterclass-level learning path for any role.
                    </p>
                    <div className="flex gap-3 shadow-2xl shadow-slate-200/50 rounded-2xl p-2 bg-white border border-slate-200">
                      <input
                        className="flex-1 p-4 rounded-xl text-lg text-slate-900 placeholder:text-slate-400 outline-none"
                        placeholder="e.g. Senior Backend Engineer"
                        value={roadmapInput}
                        onChange={(e) => setRoadmapInput(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && generateRoadmap()
                        }
                      />
                      <button
                        onClick={generateRoadmap}
                        disabled={roadmapLoading}
                        className="px-8 bg-slate-900 text-white rounded-xl font-bold text-md hover:bg-slate-800 transition"
                      >
                        {roadmapLoading ? "..." : "Create"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-black text-slate-900 mb-2 capitalize">
                      {activeRoadmap.role}
                    </h1>
                    <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-12">
                      Generated Curriculum
                    </p>
                    <div className="space-y-10 relative before:absolute before:left-5 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
                      {activeRoadmap.steps.map((s, i) => (
                        <div key={i} className="relative pl-16">
                          <div className="absolute left-2.5 top-2 w-5 h-5 rounded-full bg-white border-4 border-slate-900 shadow-sm z-10"></div>
                          <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-xl font-bold text-slate-900">
                                {s.title}
                              </h3>
                              <span className="text-xs font-bold bg-slate-100 text-slate-600 px-3 py-1.5 rounded-lg">
                                {s.duration}
                              </span>
                            </div>
                            <p className="text-slate-600 text-base leading-relaxed mb-6">
                              {s.description}
                            </p>
                            <div className="flex gap-3 flex-wrap">
                              {s.resources.map((r, idx) => (
                                <a
                                  key={idx}
                                  href={`https://www.youtube.com/results?search_query=${r}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-bold border border-slate-200 px-3 py-2 rounded-lg text-slate-500 hover:bg-slate-900 hover:text-white transition flex items-center gap-2"
                                >
                                  <span>▶</span> {r}
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* NEW: STORE VIEW */}
            {activeTab === "store" && (
              <ELearningStore
                recommendedTopic={storeTopic}
                isAnalyzing={analyzingProfile}
              />
            )}

            {/* EMAIL STUDIO */}
            {activeTab === "email" && (
              <div className="h-full flex overflow-hidden">
                {/* Editor Side */}
                <div className="w-1/2 p-8 border-r border-slate-200 overflow-y-auto custom-scroll bg-slate-50/30">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
                    Drafting Board
                  </h3>
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <label className="block text-sm font-bold text-slate-900 mb-3">
                        Core Message / Rough Notes
                      </label>
                      <textarea
                        className="w-full h-48 bg-slate-50 rounded-xl p-4 text-slate-900 text-base border-none focus:ring-2 focus:ring-slate-200 resize-none"
                        placeholder="e.g. Tell the client I need 2 more days because the API is broken..."
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                      />
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <label className="block text-sm font-bold text-slate-900 mb-1">
                          Attach Context
                        </label>
                        <p className="text-xs text-slate-500">
                          Upload screenshot of thread
                        </p>
                      </div>
                      <div className="relative">
                        <input
                          type="file"
                          onChange={(e) => setEmailImage(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <button className="px-4 py-2 bg-slate-100 text-slate-600 text-sm font-bold rounded-lg hover:bg-slate-200 transition">
                          {emailImage ? "Image Attached" : "Upload Image"}
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={generateEmail}
                      disabled={emailLoading}
                      className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-slate-800 transition disabled:opacity-50"
                    >
                      {emailLoading
                        ? "Polishing..."
                        : "Generate Professional Draft"}
                    </button>
                  </div>
                </div>

                {/* Preview Side */}
                <div className="w-1/2 p-8 overflow-y-auto custom-scroll bg-white">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-6">
                    Preview
                  </h3>
                  <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 min-h-[500px] shadow-inner">
                    {emailResult ? (
                      <div className="whitespace-pre-wrap text-slate-800 text-lg leading-loose font-medium font-serif">
                        {emailResult}
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <Icon.Magic />
                        <p className="mt-4 font-medium">
                          AI Draft will appear here
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* OTHERS */}
            {activeTab === "resume" && <ResumeAnalyzer />}
            {activeTab === "feedback" && <FeedbackView />}
          </main>
        </div>
      </div>
    </>
  );
};
