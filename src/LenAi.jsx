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
  Lock,
  CreditCard,
  QrCode,
  ArrowLeft,
  CheckCircle,
  Bell,
  X,
  Crown,
  Rocket,
  BarChart,
  MapPin,
  Briefcase,
  DollarSign,
  Globe,
  Target,
  UserCheck,
  MessageSquare,
  Menu,
  Plus,
  Trash2,
  LayoutGrid,
  FileText,
  UploadCloud,
  Mail,
  Heart,
  Settings,
  LogOut,
  Mic,
  FileAudio,
  Loader2,
  Headphones,
  User,
  Check,
  Paperclip,
  Copy,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Brain,
  Info,
  Compass,
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
  where,
  getDoc,
  setDoc,
  getDocs,
  limit,
} from "firebase/firestore";

// --- CONFIGURATION & API KEY ROTATION ---
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

let rawGeminiKeys =
  localStorage.getItem("gemini_api_key") ||
  import.meta.env.VITE_GEMINI_KEYS ||
  import.meta.env.VITE_GEMINI_API_KEY ||
  "";
let GEMINI_KEYS = rawGeminiKeys
  .split(",")
  .map((k) => k.trim())
  .filter(Boolean);
let currentKeyIndex = 0;
let RAPIDAPI_KEY =
  localStorage.getItem("rapid_api_key") || import.meta.env.VITE_RAPIDAPI_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

let genAI =
  GEMINI_KEYS.length > 0
    ? new GoogleGenerativeAI(GEMINI_KEYS[currentKeyIndex])
    : null;

const updateAPIKeys = (gemini, rapid) => {
  if (gemini !== undefined) {
    localStorage.setItem("gemini_api_key", gemini);
    GEMINI_KEYS = gemini
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);
    currentKeyIndex = 0;
    genAI =
      GEMINI_KEYS.length > 0
        ? new GoogleGenerativeAI(GEMINI_KEYS[currentKeyIndex])
        : null;
  }
  if (rapid !== undefined) {
    localStorage.setItem("rapid_api_key", rapid);
    RAPIDAPI_KEY = rapid || import.meta.env.VITE_RAPIDAPI_KEY;
  }
};

const rotateKey = () => {
  if (GEMINI_KEYS.length <= 1) return false;
  currentKeyIndex = (currentKeyIndex + 1) % GEMINI_KEYS.length;
  genAI = new GoogleGenerativeAI(GEMINI_KEYS[currentKeyIndex]);
  console.warn(
    `Rate limit hit. Rotated to Gemini Key Index: ${currentKeyIndex}`,
  );
  return true;
};

export const safeGenerateContent = async (
  modelParams,
  promptData,
  retries = GEMINI_KEYS.length,
) => {
  if (!genAI) throw new Error("No Gemini API key configured.");
  try {
    const model = genAI.getGenerativeModel(modelParams);
    return await model.generateContent(promptData);
  } catch (error) {
    if (
      (error.status === 429 ||
        error.message?.includes("429") ||
        error.message?.includes("exhausted")) &&
      retries > 1 &&
      rotateKey()
    ) {
      return await safeGenerateContent(modelParams, promptData, retries - 1);
    }
    throw error;
  }
};

export const safeSendMessage = async (
  modelParams,
  history,
  message,
  retries = GEMINI_KEYS.length,
) => {
  if (!genAI) throw new Error("No Gemini API key configured.");
  try {
    const model = genAI.getGenerativeModel(modelParams);
    return await model.startChat({ history }).sendMessage(message);
  } catch (error) {
    if (
      (error.status === 429 ||
        error.message?.includes("429") ||
        error.message?.includes("exhausted")) &&
      retries > 1 &&
      rotateKey()
    ) {
      return await safeSendMessage(modelParams, history, message, retries - 1);
    }
    throw error;
  }
};

const ClaudeLogo = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2L14.4 9.6L22 12L14.4 14.4L12 22L9.6 14.4L2 12L9.6 9.6L12 2Z" />
  </svg>
);

const CustomSpeechBubbleIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    stroke="none"
  >
    <path d="M19.07,3H4.93C3.31,3,2,4.31,2,5.93v8.14c0,1.62,1.31,2.93,2.93,2.93h12.14l4.93,4V5.93C22,4.31,20.69,3,19.07,3z M7,11.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S7.83,11.5,7,11.5z M12,11.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5 s1.5,0.67,1.5,1.5S12.83,11.5,12,11.5z M17,11.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S17.83,11.5,17,11.5z" />
  </svg>
);

const PLAN_ACCESS = {
  chat: ["basic", "essential", "pro"],
  feedback: ["basic", "essential", "pro"],
  roadmap: ["essential", "pro"],
  store: ["essential", "pro"],
  market: ["essential", "pro"],
  jobs: ["essential", "pro"],
  resume: ["pro"],
  email: ["pro"],
  billing: ["basic", "essential", "pro"],
  about: ["basic", "essential", "pro"],
};

const SUGGESTIONS = [
  {
    label: "Draft Resume",
    prompt: "Help me write a professional resume for a Software Engineer.",
  },
  { label: "Explain React", prompt: "Explain React hooks like I'm 5." },
  { label: "Debug Code", prompt: "I have a bug in my code. Can you help?" },
  { label: "Career Path", prompt: "Steps to become a Full Stack Dev in 2026?" },
];

const TOUR_STEPS = [
  {
    title: "Welcome to LenAi",
    desc: "Your intelligent career architect. Let's take a quick tour.",
    icon: Sparkles,
  },
  {
    title: "AI Career Chat",
    desc: "Chat with a Principal Software Architect AI.",
    icon: MessageSquare,
  },
  {
    title: "Full-Duplex Voice",
    desc: "Engage in real-time, interruptible live conversation.",
    icon: Headphones,
  },
  {
    title: "Career Roadmaps",
    desc: "Generate masterclass-level learning paths for any tech role.",
    icon: BookOpen,
  },
];

const FeatureWrapper = ({
  isLocked,
  featureName,
  onUpgradeClick,
  children,
}) => {
  return (
    <div className="relative w-full h-full overflow-hidden bg-[#FAF9F6]">
      <div
        className={`w-full h-full transition-all duration-700 ${isLocked ? "blur-md opacity-40 pointer-events-none select-none scale-[0.99]" : ""}`}
      >
        {children}
      </div>
      {isLocked && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-[#FAF9F6]/40 backdrop-blur-sm">
          <div className="bg-[#FAF9F6] p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E6DF] max-w-md text-center mx-4">
            <div className="w-12 h-12 bg-[#F3F1EC] text-[#7A756D] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock strokeWidth={1.5} className="w-5 h-5" />
            </div>
            <h3 className="font-serif text-3xl text-[#2D2D2D] mb-4 tracking-tight">
              Unlock {featureName}
            </h3>
            <p className="text-[#7A756D] text-sm mb-8 leading-relaxed font-sans">
              This advanced capability is reserved for upgraded members. Elevate
              your workspace to access this feature.
            </p>
            <button
              onClick={onUpgradeClick}
              className="w-full py-3 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: ABOUT US PAGE
// =========================================================================================
const AboutUs = () => {
  const team = [
    {
      name: "Atharva Bhosale",
      role: "AI/ML & Strategy Lead",
      image:
        "https://images.unsplash.com/photo-1755140208191-ec5def51708d?q=80&w=721&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Systems thinker focusing on integrating systematic logic and AI intelligence.",
    },
    {
      name: "Shravani Ahire",
      role: "Frontend Architect",
      image:
        "https://images.unsplash.com/photo-1752486268240-0507bb1ebc7e?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Crafts the premium, glassy user experiences using React and Next.js.",
    },
    {
      name: "Satyajeet Kshirsagar",
      role: "Backend Engineer",
      image:
        "https://plus.unsplash.com/premium_photo-1689977968861-9c91dbb16049?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Builds the robust infrastructure handling secure data persistence.",
    },
    {
      name: "Vaishnavi Andhale",
      role: "Data Lead",
      image:
        "https://plus.unsplash.com/premium_photo-1770451208071-5bd495db6e9f?q=80&w=1128&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      bio: "Specializes in data structuring and optimizing semantic models.",
    },
  ];

  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FAF9F6]">
      <div className="max-w-5xl mx-auto w-full animate-fade-in">
        <h2 className="font-serif text-4xl text-[#111111] mb-4 tracking-tight">
          About LenAI
        </h2>
        <p className="text-[#7A756D] text-lg font-sans mb-10 leading-relaxed">
          Pioneering the future of structured, personalized career architecture.
        </p>
        <div className="bg-white p-8 md:p-12 rounded-3xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.02)] mb-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <Sparkles className="w-32 h-32 text-[#D97D54]" />
          </div>
          <h3 className="font-serif text-2xl text-[#111111] mb-4 relative z-10">
            Our Mission
          </h3>
          <p className="text-[#4A4A4A] text-[15px] leading-loose mb-6 relative z-10">
            LenAI is built on the belief that career growth shouldn't be a
            random guessing game. We have designed a cutting-edge, AI-powered
            ecosystem to provide professionals and students with structured,
            systematic pathways to success.
          </p>
        </div>
        <h3 className="font-serif text-3xl text-[#111111] mb-8">
          Meet the Team
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {team.map((member, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-3xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.01)] text-center group hover:shadow-md transition-all hover:-translate-y-1 duration-300"
            >
              <div className="w-24 h-24 mx-auto rounded-full overflow-hidden mb-5 border-4 border-[#F3F1EC] group-hover:border-[#D97D54] transition-colors duration-300">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h4 className="font-serif text-xl text-[#111111] mb-1">
                {member.name}
              </h4>
              <p className="text-[10px] font-bold text-[#D97D54] uppercase tracking-widest mb-4">
                {member.role}
              </p>
              <p className="text-sm text-[#7A756D] leading-relaxed">
                {member.bio}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: AI JOB MATCHER
// =========================================================================================
const AIJobMatcher = ({ activeItem, onSave }) => {
  const [userProfile, setUserProfile] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [location, setLocation] = useState("");
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  useEffect(() => {
    if (activeItem) {
      setUserProfile(activeItem.userProfile || "");
      setJobRole(activeItem.jobRole || "");
      setLocation(activeItem.location || "");
      setMatchedJobs(activeItem.matchedJobs || []);
    } else {
      setUserProfile("");
      setJobRole("");
      setLocation("");
      setMatchedJobs([]);
    }
  }, [activeItem]);

  const searchAndMatchJobs = async () => {
    if (!userProfile || !jobRole || GEMINI_KEYS.length === 0) return;
    setLoading(true);
    setMatchedJobs([]);
    try {
      setStatusText("Analyzing job boards...");
      let fetchedJobs = [];
      if (RAPIDAPI_KEY) {
        const response = await fetch(
          `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(jobRole + " in " + location)}&num_pages=1`,
          {
            method: "GET",
            headers: {
              "x-rapidapi-key": RAPIDAPI_KEY,
              "x-rapidapi-host": "jsearch.p.rapidapi.com",
            },
          },
        );
        const data = await response.json();
        fetchedJobs = data.data || [];
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        fetchedJobs = [
          {
            job_title: `${jobRole} Specialist`,
            employer_name: "TechNova Solutions",
            job_description: `Looking for a strong ${jobRole} with deep expertise.`,
            job_apply_link: "#",
          },
          {
            job_title: `Junior ${jobRole}`,
            employer_name: "Quantum Dynamics",
            job_description: `Entry level position. Must know basic principles.`,
            job_apply_link: "#",
          },
        ];
      }

      if (fetchedJobs.length === 0) {
        alert("No jobs found for this query.");
        setLoading(false);
        return;
      }

      setStatusText("Calculating semantic resonance...");
      const jobsPayload = fetchedJobs.slice(0, 6).map((j) => ({
        title: j.job_title,
        company: j.employer_name,
        description: (j.job_description || "").substring(0, 500),
        link: j.job_apply_link || "#",
      }));

      const prompt = `Act as an expert AI Recruiter utilizing semantic similarity embeddings. Evaluate the match between this User Profile and the provided Job Listings. USER PROFILE: "${userProfile}" JOB LISTINGS (JSON): ${JSON.stringify(jobsPayload)} Task: Rank these jobs strictly by how well they semantically match the User Profile. Output ONLY a valid JSON array of objects with the following exact structure: [{"title": "Job Title", "company": "Company Name", "matchScore": <Number 0-100>, "reason": "1 concise sentence explaining exactly why this is or isn't a good match.", "link": "The job link"}]`;

      const result = await safeGenerateContent(
        { model: "gemini-2.5-flash" },
        prompt,
      );
      const rawText = result.response
        .text()
        .replace(/```json|```/g, "")
        .trim();
      let matchedData = JSON.parse(rawText);
      matchedData.sort((a, b) => b.matchScore - a.matchScore);
      setMatchedJobs(matchedData);

      if (onSave) {
        onSave({
          title: `${jobRole} Matches`,
          userProfile,
          jobRole,
          location,
          matchedJobs: matchedData,
        });
      }
    } catch (error) {
      console.error("Job Match Error", error);
      alert("Error occurred while matching jobs. Check console.");
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FAF9F6]">
      <div className="max-w-6xl mx-auto w-full">
        <div className="mb-12">
          <h2 className="font-serif text-4xl text-[#111111] mb-4 tracking-tight">
            Semantic Job Matcher
          </h2>
          <p className="text-[#7A756D] text-lg font-sans max-w-2xl leading-relaxed">
            Describe your skills in natural language. Our AI evaluates live
            markets and scores positions based on deep semantic resonance.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 space-y-6 bg-[#FAF9F6] h-fit sticky top-0">
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#7A756D] flex items-center gap-2">
                <UserCheck strokeWidth={1.5} className="w-4 h-4" /> Your Profile
              </label>
              <textarea
                className="w-full h-48 bg-[#F3F1EC] border border-transparent rounded-2xl p-5 text-[#2D2D2D] text-sm focus:bg-white focus:border-[#E8E6DF] focus:ring-0 outline-none resize-none transition-all placeholder:text-[#A8A39D]"
                placeholder="I am a developer specializing in React and Node.js..."
                value={userProfile}
                onChange={(e) => setUserProfile(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#7A756D]">
                Target Role
              </label>
              <input
                className="w-full bg-[#F3F1EC] border border-transparent rounded-2xl p-4 text-[#2D2D2D] text-sm focus:bg-white focus:border-[#E8E6DF] outline-none transition-all placeholder:text-[#A8A39D]"
                placeholder="e.g. Frontend Engineer"
                value={jobRole}
                onChange={(e) => setJobRole(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs font-medium text-[#7A756D]">
                Location
              </label>
              <input
                className="w-full bg-[#F3F1EC] border border-transparent rounded-2xl p-4 text-[#2D2D2D] text-sm focus:bg-white focus:border-[#E8E6DF] outline-none transition-all placeholder:text-[#A8A39D]"
                placeholder="e.g. Remote, India"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
            <button
              onClick={searchAndMatchJobs}
              disabled={loading || !userProfile || !jobRole}
              className="w-full py-4 bg-[#111111] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#2D2D2D] transition-colors disabled:opacity-50"
            >
              {loading ? statusText : "Analyze & Match"}
            </button>
            {!RAPIDAPI_KEY && (
              <p className="text-[10px] text-[#D97D54] font-medium text-center mt-2 bg-[#FAF9F6] p-2 rounded-lg border border-[#E8E6DF]">
                Running in Simulation Mode (No RapidAPI Key).
              </p>
            )}
          </div>
          <div className="lg:col-span-2 space-y-6">
            {!loading && matchedJobs.length === 0 && (
              <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-[#A8A39D] border border-dashed border-[#E8E6DF] rounded-3xl">
                <Search strokeWidth={1} className="w-10 h-10 mb-4 opacity-50" />
                <p className="font-medium text-sm">Matches will appear here.</p>
              </div>
            )}
            {matchedJobs.map((job, idx) => (
              <div
                key={idx}
                className="bg-white p-8 rounded-3xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all animate-fade-in"
              >
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="font-serif text-2xl text-[#111111] mb-1">
                      {job.title}
                    </h3>
                    <p className="text-sm font-medium text-[#7A756D] flex items-center gap-2">
                      <Briefcase strokeWidth={1.5} className="w-4 h-4" />{" "}
                      {job.company}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold text-[#A8A39D] uppercase tracking-widest block mb-1">
                      Resonance
                    </span>
                    <span className="font-serif text-3xl text-[#111111]">
                      {job.matchScore}%
                    </span>
                  </div>
                </div>
                <div className="bg-[#FAF9F6] p-5 rounded-2xl mb-6">
                  <p className="text-sm text-[#4A4A4A] leading-relaxed flex items-start gap-3">
                    <Sparkles
                      strokeWidth={1.5}
                      className="w-4 h-4 text-[#D97D54] shrink-0 mt-0.5"
                    />
                    {job.reason}
                  </p>
                </div>
                <a
                  href={job.link}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium text-[#111111] hover:text-[#D97D54] transition-colors flex items-center gap-2"
                >
                  View Application{" "}
                  <ArrowRight strokeWidth={1.5} className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: MARKET ANALYZER
// =========================================================================================
const MarketAnalyzer = ({ activeItem, onSave }) => {
  const [role, setRole] = useState("");
  const [baseLocation, setBaseLocation] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeItem) {
      setRole(activeItem.role || "");
      setBaseLocation(activeItem.baseLocation || "");
      setTargetLocation(activeItem.targetLocation || "");
      setMarketData(activeItem.marketData || null);
    } else {
      setRole("");
      setBaseLocation("");
      setTargetLocation("");
      setMarketData(null);
    }
  }, [activeItem]);

  const analyzeMarket = async () => {
    if (!role || !baseLocation || GEMINI_KEYS.length === 0) return;
    setLoading(true);
    setMarketData(null);
    try {
      const prompt = `You are an advanced AI regression model trained on global job market data. Perform a comprehensive salary and market demand prediction for the role: "${role}". Base Location: "${baseLocation}". ${targetLocation ? `Target Comparison Location: "${targetLocation}".` : ""} Provide expected average salary range (USD), demand level, and projected growth rate (5 yrs). Return STRICTLY a JSON object with this exact structure: {"base": {"location": "${baseLocation}", "salaryUSD": "$X - $Y", "demand": "High/Medium/Low", "growthRate": "X%"}, "target": {"location": "${targetLocation}", "salaryUSD": "$X - $Y", "demand": "High/Medium/Low", "growthRate": "X%"}, "insights": ["Insight 1", "Insight 2", "Insight 3"], "verdict": "One sentence final recommendation."}`;

      const result = await safeGenerateContent(
        { model: "gemini-2.5-flash" },
        prompt,
      );
      const data = JSON.parse(
        result.response
          .text()
          .replace(/```json|```/g, "")
          .trim(),
      );
      setMarketData(data);

      if (onSave) {
        onSave({
          title: `${role} Forecast`,
          role,
          baseLocation,
          targetLocation,
          marketData: data,
        });
      }
    } catch (error) {
      console.error("Market Analysis Error", error);
      alert("Failed to analyze market data. Please try again.");
    }
    setLoading(false);
  };

  const LocationCard = ({ data, isTarget }) => (
    <div
      className={`p-8 rounded-3xl border ${isTarget ? "border-[#D97D54]/20 bg-[#FAF9F6]" : "border-[#E8E6DF] bg-white"} shadow-[0_2px_10px_rgb(0,0,0,0.02)]`}
    >
      <div className="flex justify-between items-start mb-8">
        <div>
          <h3 className="text-[10px] font-semibold text-[#A8A39D] uppercase tracking-widest mb-2">
            {isTarget ? "Target Market" : "Base Market"}
          </h3>
          <h2 className="font-serif text-3xl text-[#111111] flex items-center gap-2">
            <MapPin strokeWidth={1.5} className="w-5 h-5 text-[#A8A39D]" />{" "}
            {data.location}
          </h2>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-[#F3F1EC] text-[#4A4A4A] border border-[#E8E6DF]">
          {data.demand} Demand
        </span>
      </div>
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium text-[#7A756D] mb-1">
            Expected Salary (USD)
          </p>
          <p className="font-serif text-4xl text-[#111111]">{data.salaryUSD}</p>
        </div>
        <div>
          <p className="text-xs font-medium text-[#7A756D] mb-1">
            Projected Growth (5 Yrs)
          </p>
          <p className="font-sans text-xl font-medium text-[#4A4A4A]">
            {data.growthRate}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FAF9F6]">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-12">
          <h2 className="font-serif text-4xl text-[#111111] mb-4 tracking-tight">
            Market Forecaster
          </h2>
          <p className="text-[#7A756D] text-lg font-sans leading-relaxed">
            AI-driven regression models forecasting global salary ranges and
            industry trajectory.
          </p>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-[#E8E6DF] mb-12 flex flex-col md:flex-row gap-4">
          <input
            className="flex-1 bg-transparent border-none py-3 px-4 text-[#2D2D2D] focus:ring-0 outline-none placeholder:text-[#A8A39D] text-sm"
            placeholder="Job Role (e.g. Data Scientist)"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          />
          <div className="w-px bg-[#E8E6DF] hidden md:block my-2"></div>
          <input
            className="flex-1 bg-transparent border-none py-3 px-4 text-[#2D2D2D] focus:ring-0 outline-none placeholder:text-[#A8A39D] text-sm"
            placeholder="Base Location"
            value={baseLocation}
            onChange={(e) => setBaseLocation(e.target.value)}
          />
          <div className="w-px bg-[#E8E6DF] hidden md:block my-2"></div>
          <input
            className="flex-1 bg-transparent border-none py-3 px-4 text-[#2D2D2D] focus:ring-0 outline-none placeholder:text-[#A8A39D] text-sm"
            placeholder="Compare With (Optional)"
            value={targetLocation}
            onChange={(e) => setTargetLocation(e.target.value)}
          />
          <button
            onClick={analyzeMarket}
            disabled={loading || !role || !baseLocation}
            className="px-8 py-3 bg-[#111111] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#2D2D2D] transition disabled:opacity-50"
          >
            {loading ? "Forecasting..." : "Forecast"}
          </button>
        </div>
        {marketData && (
          <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {marketData.base && (
                <LocationCard data={marketData.base} isTarget={false} />
              )}
              {marketData.target && (
                <LocationCard data={marketData.target} isTarget={true} />
              )}
            </div>
            <div className="bg-white rounded-3xl p-10 border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
              <h3 className="font-serif text-2xl text-[#111111] mb-8">
                Strategic Intelligence
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                {marketData.insights.map((insight, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="text-[#A8A39D] font-serif text-xl italic">
                      0{idx + 1}
                    </span>
                    <p className="text-[#4A4A4A] text-sm leading-relaxed">
                      {insight}
                    </p>
                  </div>
                ))}
              </div>
              <div className="bg-[#F3F1EC] p-6 rounded-2xl border border-[#E8E6DF]">
                <h4 className="text-[10px] font-semibold text-[#A8A39D] uppercase tracking-widest mb-2">
                  Final Verdict
                </h4>
                <p className="font-serif text-lg text-[#111111]">
                  {marketData.verdict}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: BILLING DASHBOARD & E-LEARNING STORE & FEEDBACK
// =========================================================================================
const BillingDashboard = ({ currentPlan, user }) => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [transactionId, setTransactionId] = useState("");
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
  const [betaEmail, setBetaEmail] = useState("");
  const [betaSuccess, setBetaSuccess] = useState(false);

  const handleVerifyPayment = async () => {
    if (!transactionId.trim()) return;
    try {
      await addDoc(collection(db, "transactions"), {
        uid: user.uid,
        userName: user.displayName || "Unknown",
        userEmail: user.email,
        requestedPlan: selectedPlan,
        transactionId: transactionId.trim(),
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setPaymentSubmitted(true);
    } catch (e) {
      alert("Error submitting transaction.");
    }
  };

  const handleJoinBeta = (e) => {
    e.preventDefault();
    if (betaEmail.trim()) setBetaSuccess(true);
  };

  if (currentPlan === "pro") {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#FAF9F6] overflow-y-auto no-scrollbar">
        <div className="bg-white p-16 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E6DF] max-w-2xl w-full text-center animate-fade-in">
          <div className="w-16 h-16 bg-[#F3F1EC] text-[#111111] rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown strokeWidth={1.5} className="w-8 h-8 text-[#D97D54]" />
          </div>
          <h2 className="font-serif text-4xl text-[#111111] mb-4">
            You are a Pro User
          </h2>
          <p className="text-[#7A756D] text-lg leading-relaxed mb-12">
            Unrestricted access to all advanced models, resume architectures,
            job matching, and priority processing.
          </p>
          <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="font-serif text-xl text-[#111111] mb-2">
              Beta Testing Club
            </h3>
            <p className="text-sm text-[#7A756D] mb-6">
              Get early access to unreleased AI models.
            </p>
            {betaSuccess ? (
              <div className="text-[#4A4A4A] text-sm font-medium flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-[#D97D54]" /> Successfully
                applied!
              </div>
            ) : (
              <form onSubmit={handleJoinBeta} className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={betaEmail}
                  onChange={(e) => setBetaEmail(e.target.value)}
                  className="flex-1 p-3 rounded-xl border border-[#E8E6DF] bg-white text-sm focus:border-[#D1CEC7] outline-none"
                />
                <button
                  type="submit"
                  className="px-6 bg-[#111111] text-[#FAF9F6] rounded-xl text-sm font-medium"
                >
                  Apply
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (paymentSubmitted) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#FAF9F6] animate-fade-in">
        <div className="bg-white p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E6DF] max-w-md w-full text-center">
          <CheckCircle
            className="w-12 h-12 text-[#D97D54] mx-auto mb-6"
            strokeWidth={1.5}
          />
          <h2 className="font-serif text-3xl text-[#111111] mb-4">
            Verification Pending
          </h2>
          <p className="text-[#7A756D] text-sm leading-relaxed mb-8">
            Your transaction ID{" "}
            <span className="font-mono bg-[#F3F1EC] px-2 py-1 rounded text-[#111111]">
              {transactionId}
            </span>{" "}
            is under review. You'll be upgraded shortly.
          </p>
          <button
            onClick={() => {
              setSelectedPlan(null);
              setPaymentSubmitted(false);
            }}
            className="w-full py-3 bg-[#F3F1EC] text-[#4A4A4A] rounded-2xl font-medium text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[#FAF9F6] overflow-y-auto no-scrollbar animate-fade-in">
        <div className="max-w-md w-full bg-white p-12 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E6DF]">
          <button
            onClick={() => setSelectedPlan(null)}
            className="flex items-center gap-2 text-[#7A756D] hover:text-[#111111] text-sm mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Plans
          </button>
          <h2 className="font-serif text-3xl text-[#111111] mb-2">
            Complete Upgrade
          </h2>
          <p className="text-[#7A756D] text-sm mb-8">
            Total:{" "}
            <span className="text-[#111111] font-medium">
              {selectedPlan === "essential" ? "$9" : "$19"}
            </span>
          </p>
          <div className="bg-[#F3F1EC] p-6 rounded-2xl mb-8 text-center border border-[#E8E6DF]">
            <img
              src="https://via.placeholder.com/200?text=QR+CODE"
              alt="QR"
              className="mx-auto rounded-xl mb-4 grayscale opacity-80"
            />
            <p className="text-xs font-medium text-[#7A756D] uppercase tracking-widest">
              Scan with UPI
            </p>
          </div>
          <div className="space-y-4">
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="Enter Transaction ID"
              className="w-full p-4 bg-[#F3F1EC] border border-[#E8E6DF] rounded-2xl text-[#2D2D2D] text-sm focus:border-[#D1CEC7] outline-none"
            />
            <button
              onClick={handleVerifyPayment}
              disabled={!transactionId.trim()}
              className="w-full py-4 bg-[#111111] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#2D2D2D] disabled:opacity-50 transition"
            >
              Verify Payment
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[#FAF9F6] overflow-y-auto no-scrollbar">
      <div className="text-center mb-16 max-w-2xl">
        <h2 className="font-serif text-4xl text-[#111111] mb-4 tracking-tight">
          Select your workspace plan.
        </h2>
        <p className="text-[#7A756D] text-lg font-sans">
          Elevate your capabilities with advanced models and tools.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <div className="bg-white p-10 rounded-3xl border border-[#E8E6DF] flex flex-col items-center text-center">
          <h3 className="font-serif text-2xl text-[#111111] mb-2">Basic</h3>
          <p className="text-sm text-[#7A756D] mb-8">Standard access</p>
          <p className="font-sans text-4xl text-[#111111] mb-10 font-medium">
            Free
          </p>
          <button
            disabled
            className="w-full py-3 bg-[#F3F1EC] text-[#A8A39D] rounded-full text-sm font-medium"
          >
            Included
          </button>
        </div>
        <div className="bg-[#FAF9F6] p-10 rounded-3xl border border-[#D97D54] flex flex-col items-center text-center relative shadow-sm">
          <div className="absolute -top-3 bg-[#D97D54] text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
            Recommended
          </div>
          <h3 className="font-serif text-2xl text-[#111111] mb-2">Essential</h3>
          <p className="text-sm text-[#7A756D] mb-8">
            AI Roadmaps & Forecaster
          </p>
          <p className="font-sans text-4xl text-[#111111] mb-10 font-medium">
            $9<span className="text-sm text-[#7A756D]">/mo</span>
          </p>
          <button
            onClick={() => setSelectedPlan("essential")}
            className="w-full py-3 bg-[#D97D54] text-white rounded-full text-sm font-medium hover:bg-[#C26B45] transition"
          >
            Upgrade
          </button>
        </div>
        <div className="bg-[#111111] p-10 rounded-3xl border border-[#1A1A1A] flex flex-col items-center text-center">
          <h3 className="font-serif text-2xl text-[#FAF9F6] mb-2">Pro</h3>
          <p className="text-sm text-[#A8A39D] mb-8">Full access & Audits</p>
          <p className="font-sans text-4xl text-[#FAF9F6] mb-10 font-medium">
            $19<span className="text-sm text-[#A8A39D]">/mo</span>
          </p>
          <button
            onClick={() => setSelectedPlan("pro")}
            className="w-full py-3 bg-[#FAF9F6] text-[#111111] rounded-full text-sm font-medium hover:bg-white transition"
          >
            Get Pro
          </button>
        </div>
      </div>
    </div>
  );
};

const ELearningStore = ({ recommendedTopic = "" }) => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [playingVideo, setPlayingVideo] = useState(null);

  const fetchVideos = async (query) => {
    if (!YOUTUBE_API_KEY || !query) return;
    setLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=13&q=${encodeURIComponent(query + " course tutorial masterclass")}&type=video&key=${YOUTUBE_API_KEY}`,
      );
      const data = await response.json();
      setVideos(data.items || []);
    } catch (error) {
      console.error("YouTube Error", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    const topic = recommendedTopic || "Full Stack Architecture";
    setSearchQuery(topic);
    fetchVideos(topic);
  }, [recommendedTopic]);

  if (playingVideo) {
    return (
      <div className="h-full flex flex-col bg-[#FAF9F6] overflow-y-auto no-scrollbar p-8 md:p-16 animate-fade-in">
        <div className="max-w-6xl mx-auto w-full">
          <button
            onClick={() => setPlayingVideo(null)}
            className="flex items-center gap-2 text-[#7A756D] hover:text-[#111111] text-sm mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Library
          </button>
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#E8E6DF]">
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${playingVideo.id.videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allowFullScreen
            ></iframe>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl text-[#111111] mb-4">
            {playingVideo.snippet.title}
          </h1>
          <p className="text-[#7A756D] text-lg font-medium mb-6">
            {playingVideo.snippet.channelTitle}
          </p>
          <div className="bg-white p-6 rounded-2xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
            <p className="text-[#4A4A4A] text-sm leading-relaxed whitespace-pre-wrap">
              {playingVideo.snippet.description || "No description provided."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#FAF9F6] overflow-y-auto no-scrollbar p-8 md:p-16">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h2 className="font-serif text-4xl text-[#111111] mb-2">Library</h2>
            <p className="text-[#7A756D] text-sm">
              Curated technical masterclasses.
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-[#A8A39D]" />
            <input
              type="text"
              className="w-full bg-white border border-[#E8E6DF] rounded-2xl px-5 py-3 pl-12 text-[#2D2D2D] text-sm focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
              placeholder="Search concepts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchVideos(searchQuery)}
            />
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 opacity-50">
            <div className="col-span-1 md:col-span-3 h-80 bg-[#E8E6DF] rounded-3xl animate-pulse"></div>
          </div>
        ) : (
          <div className="space-y-12">
            {videos.length > 0 && (
              <div
                onClick={() => setPlayingVideo(videos[0])}
                className="block relative w-full h-[400px] rounded-3xl overflow-hidden group cursor-pointer"
              >
                <img
                  src={videos[0].snippet.thumbnails.high.url}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  alt="Featured"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/90 to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="w-16 h-16 bg-[#D97D54] rounded-full flex items-center justify-center pl-1 shadow-lg">
                    <Play strokeWidth={2} className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 p-10 w-full md:w-2/3 pointer-events-none">
                  <span className="text-[10px] font-bold text-[#FAF9F6] bg-[#2D2D2D]/50 backdrop-blur-md px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block border border-[#FAF9F6]/20">
                    Featured
                  </span>
                  <h1 className="font-serif text-3xl md:text-4xl text-[#FAF9F6] leading-tight mb-2">
                    {videos[0].snippet.title}
                  </h1>
                  <p className="text-[#D1CEC7] text-sm">
                    {videos[0].snippet.channelTitle}
                  </p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {videos.slice(1).map((video) => (
                <div
                  key={video.id.videoId}
                  onClick={() => setPlayingVideo(video)}
                  className="group flex flex-col cursor-pointer"
                >
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#F3F1EC] mb-4 border border-[#E8E6DF]">
                    <img
                      src={video.snippet.thumbnails.high.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-10 h-10 bg-[#D97D54] rounded-full flex items-center justify-center pl-1 shadow-lg">
                        <Play strokeWidth={2} className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-sans text-sm font-medium text-[#111111] leading-snug line-clamp-2 mb-1">
                    {video.snippet.title}
                  </h3>
                  <p className="text-xs text-[#7A756D]">
                    {video.snippet.channelTitle}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const FeedbackView = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
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
      <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-fade-in bg-[#FAF9F6]">
        <CheckCircle
          className="w-12 h-12 text-[#D97D54] mb-6"
          strokeWidth={1.5}
        />
        <h2 className="font-serif text-3xl text-[#111111] mb-2">
          Message Sent
        </h2>
        <p className="text-[#7A756D] mb-8">
          We appreciate your thoughtful input.
        </p>
        <button
          onClick={() => {
            setStatus("idle");
            setFormData({ name: "", email: "", suggestion: "" });
          }}
          className="text-sm font-medium text-[#4A4A4A] hover:text-[#111111] underline underline-offset-4 decoration-[#E8E6DF]"
        >
          Send another
        </button>
      </div>
    );
  }
  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto w-full">
        <h2 className="font-serif text-4xl text-[#111111] mb-4 tracking-tight">
          Feedback
        </h2>
        <p className="text-[#7A756D] text-lg mb-10 font-sans">
          Help us refine the experience.
        </p>
        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-4 rounded-2xl bg-white border border-[#E8E6DF] text-sm text-[#2D2D2D] focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
            placeholder="Name"
          />
          <input
            required
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-white border border-[#E8E6DF] text-sm text-[#2D2D2D] focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
            placeholder="Email Address"
          />
          <textarea
            required
            rows="5"
            value={formData.suggestion}
            onChange={(e) =>
              setFormData({ ...formData, suggestion: e.target.value })
            }
            className="w-full p-4 rounded-2xl bg-white border border-[#E8E6DF] text-sm text-[#2D2D2D] focus:border-[#D1CEC7] outline-none resize-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
            placeholder="Your thoughts..."
          />
          <button
            disabled={status === "loading"}
            className="w-full py-4 bg-[#111111] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#2D2D2D] transition disabled:opacity-50"
          >
            {status === "loading" ? "Sending..." : "Submit"}
          </button>
        </form>
      </div>
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: RESUME ARCHITECT
// =========================================================================================
const ResumeAnalyzer = ({ activeItem, onSave }) => {
  const [file, setFile] = useState(null);
  const [score, setScore] = useState(null);
  const [suggestions, setSuggestions] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeItem) {
      setScore(activeItem.score);
      setSuggestions(activeItem.suggestions);
      setFile({ name: activeItem.fileName || "Previous Audit" });
    } else {
      setScore(null);
      setSuggestions({});
      setFile(null);
    }
  }, [activeItem]);

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (
      f &&
      (f.type === "application/pdf" ||
        f.type.includes("word") ||
        f.type.includes("officedocument"))
    )
      setFile(f);
    else alert("Please upload a PDF or DOCX.");
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
    if (!file || GEMINI_KEYS.length === 0) return;
    setLoading(true);
    try {
      const resumeText = await extractText(file);
      const prompt = `You are a Senior Technical Recruiter at FAANG. Conduct a deep-dive review of this resume. Resume Text: "${resumeText}". Output STRICTLY in this format: Score: <number 0-100>\nCritical Flaws:\n- <Point 1>\nTechnical Gaps:\n- <Point 1>\nImpact Metrics:\n- <Point 1>\nFormatting:\n- <Point 1>`;

      const result = await safeGenerateContent(
        { model: "gemini-2.5-flash" },
        prompt,
      );
      const text = result.response.text();
      const scoreMatch = text.match(/Score:\s*(\d+)/);
      const finalScore = scoreMatch ? Number(scoreMatch[1]) : 0;
      setScore(finalScore);

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

      if (onSave) {
        onSave({
          title: `Resume Audit - ${finalScore}%`,
          fileName: file.name,
          score: finalScore,
          suggestions: sections,
        });
      }
    } catch {
      alert("Analysis failed.");
    }
    setLoading(false);
  };

  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FAF9F6]">
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="font-serif text-4xl text-[#111111] mb-4 tracking-tight">
          Resume Architect
        </h2>
        <p className="text-[#7A756D] mb-12 text-lg font-sans">
          Deep structural audit for career documents.
        </p>

        <div className="border border-dashed border-[#D1CEC7] rounded-3xl p-16 bg-white hover:bg-[#F3F1EC]/50 transition-all text-center mb-8 cursor-pointer relative shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
          <input
            type="file"
            onChange={handleFile}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            accept=".pdf,.docx"
          />
          <UploadCloud
            strokeWidth={1}
            className="w-10 h-10 text-[#7A756D] mx-auto mb-4"
          />
          <p className="text-lg font-medium text-[#111111] mb-2">
            {file ? file.name : "Select document (PDF/DOCX)"}
          </p>
          <p className="text-sm text-[#A8A39D]">Powered by Gemini 2.5</p>
        </div>

        <button
          onClick={analyze}
          disabled={!file || loading || activeItem}
          className="w-full py-4 bg-[#111111] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#2D2D2D] transition disabled:opacity-50"
        >
          {loading ? "Auditing Document..." : "Run Analysis"}
        </button>

        {score !== null && (
          <div className="mt-16 animate-fade-in">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#E8E6DF]">
              <span className="font-serif text-2xl text-[#111111]">
                Hiring Probability
              </span>
              <span className="font-serif text-5xl text-[#111111]">
                {score}%
              </span>
            </div>
            <div className="space-y-10">
              {Object.entries(suggestions).map(([k, v]) => (
                <div key={k}>
                  <h3 className="text-xs font-semibold text-[#A8A39D] uppercase tracking-widest mb-4">
                    {k}
                  </h3>
                  <ul className="space-y-4">
                    {v.map((item, i) => (
                      <li
                        key={i}
                        className="text-[#4A4A4A] text-sm leading-relaxed flex items-start gap-3 bg-white p-4 rounded-xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.01)]"
                      >
                        <span className="text-[#D97D54] mt-0.5">•</span> {item}
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
// MAIN COMPONENT: LENAI
// =========================================================================================
export const LenAi = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState("general");

  const [userMemory, setUserMemory] = useState("");
  const [showMemoryOnboarding, setShowMemoryOnboarding] = useState(false);
  const [memoryInput, setMemoryInput] = useState("");
  const [isSavingMemory, setIsSavingMemory] = useState(false);

  // Modal State for Explore Modules
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const exploreTabs = ["roadmap", "market", "jobs", "resume", "email", "store"];

  const [apiKeys, setApiKeys] = useState({
    gemini: localStorage.getItem("gemini_api_key") || "",
    rapid: localStorage.getItem("rapid_api_key") || "",
  });
  const [apiSaveStatus, setApiSaveStatus] = useState("");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  // History States
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chatImage, setChatImage] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [roadmapInput, setRoadmapInput] = useState("");
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [marketHistory, setMarketHistory] = useState([]);
  const [activeMarketData, setActiveMarketData] = useState(null);

  const [jobsHistory, setJobsHistory] = useState([]);
  const [activeJobsData, setActiveJobsData] = useState(null);

  const [resumeHistory, setResumeHistory] = useState([]);
  const [activeResumeData, setActiveResumeData] = useState(null);

  const [emailHistory, setEmailHistory] = useState([]);
  const [activeEmailData, setActiveEmailData] = useState(null);
  const [emailInput, setEmailInput] = useState("");
  const [emailImage, setEmailImage] = useState(null);
  const [emailResult, setEmailResult] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  const [storeTopic, setStoreTopic] = useState("");

  const [isDictating, setIsDictating] = useState(false);
  const dictationRecognitionRef = useRef(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [transcriptResult, setTranscriptResult] = useState("");

  // Three-dot menu states
  const [openMenuId, setOpenMenuId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editTitle, setEditTitle] = useState("");

  const isVoiceModeRef = useRef(false);
  const voiceStatusRef = useRef("idle");
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const interactiveRecognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  const [videoSidebarOpen, setVideoSidebarOpen] = useState(false);
  const [activeVideoQuery, setActiveVideoQuery] = useState("");
  const [activeVideoId, setActiveVideoId] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);

  const activeChatIdRef = useRef(activeChatId);
  const messagesRef = useRef(messages);
  const userPlan = user?.plan || "basic";
  const hasAccess = PLAN_ACCESS[activeTab]?.includes(userPlan);

  const totalResourcesCount =
    activeRoadmap?.steps?.reduce(
      (acc, step) => acc + (step.resources?.length || 0),
      0,
    ) || 0;
  const completedCount = activeRoadmap?.completedResources?.length || 0;
  const progressPercent =
    totalResourcesCount === 0
      ? 0
      : Math.round((completedCount / totalResourcesCount) * 100);

  useEffect(() => {
    isVoiceModeRef.current = isVoiceMode;
    voiceStatusRef.current = voiceStatus;
  }, [isVoiceMode, voiceStatus]);
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    messagesRef.current = messages;
  }, [activeChatId, messages]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleSaveApiKeys = () => {
    updateAPIKeys(apiKeys.gemini, apiKeys.rapid);
    setApiSaveStatus("Saved successfully!");
    setTimeout(() => setApiSaveStatus(""), 3000);
  };

  const generateMemoryFromHistory = async () => {
    if (!user || GEMINI_KEYS.length === 0) return;
    try {
      const chatsRef = collection(db, "users", user.uid, "chats");
      const chatSnaps = await getDocs(
        query(chatsRef, orderBy("createdAt", "desc"), limit(5)),
      );
      let allMessagesText = "";
      for (const chatDoc of chatSnaps.docs) {
        const messagesRef = collection(
          db,
          "users",
          user.uid,
          "chats",
          chatDoc.id,
          "messages",
        );
        const msgSnaps = await getDocs(
          query(messagesRef, orderBy("createdAt", "desc"), limit(20)),
        );
        const msgs = msgSnaps.docs.map((d) => d.data());
        msgs.reverse().forEach((m) => {
          allMessagesText += `${m.sender}: ${m.text}\n`;
        });
      }
      if (!allMessagesText.trim()) {
        setShowMemoryOnboarding(true);
        return;
      }
      const prompt = `Analyze the following chat history... Output ONLY the summary...\n\nChat History:\n${allMessagesText}`;
      const result = await safeGenerateContent(
        { model: "gemini-2.5-flash" },
        prompt,
      );
      const memoryText = result.response.text().trim();
      if (memoryText) {
        await setDoc(doc(db, "users", user.uid, "settings", "memory"), {
          content: memoryText,
          updatedAt: serverTimestamp(),
        });
        setUserMemory(memoryText);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (!user) return;
    const initMemory = async () => {
      try {
        const memRef = doc(db, "users", user.uid, "settings", "memory");
        const memSnap = await getDoc(memRef);
        if (memSnap.exists()) {
          setUserMemory(memSnap.data().content);
        } else {
          const skipped = localStorage.getItem(`memory_skipped_${user.uid}`);
          if (skipped) return;
          const chatsRef = collection(db, "users", user.uid, "chats");
          const chatSnaps = await getDocs(query(chatsRef, limit(1)));
          if (!chatSnaps.empty && GEMINI_KEYS.length > 0)
            await generateMemoryFromHistory();
          else setShowMemoryOnboarding(true);
        }
      } catch (e) {
        console.error(e);
      }
    };
    initMemory();
  }, [user]);

  const handleSaveManualMemory = async () => {
    setIsSavingMemory(true);
    try {
      await setDoc(doc(db, "users", user.uid, "settings", "memory"), {
        content: memoryInput,
        updatedAt: serverTimestamp(),
      });
      setUserMemory(memoryInput);
      setShowMemoryOnboarding(false);
    } catch (e) {
      alert("Failed to save memory.");
    }
    setIsSavingMemory(false);
  };

  const handleSkipMemory = () => {
    localStorage.setItem(`memory_skipped_${user.uid}`, "true");
    setShowMemoryOnboarding(false);
  };

  const handleOpenVideo = async (query) => {
    setVideoSidebarOpen(true);
    setActiveVideoQuery(query);
    setActiveVideoId("");
    if (!YOUTUBE_API_KEY) {
      alert("YouTube API Key missing.");
      setVideoSidebarOpen(false);
      return;
    }
    setVideoLoading(true);
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&q=${encodeURIComponent(query + " tutorial course")}&type=video&key=${YOUTUBE_API_KEY}`,
      );
      const data = await response.json();
      if (data.items && data.items.length > 0)
        setActiveVideoId(data.items[0].id.videoId);
      else {
        alert("No video found.");
        setVideoSidebarOpen(false);
      }
    } catch (error) {
      alert("Failed to load video.");
      setVideoSidebarOpen(false);
    }
    setVideoLoading(false);
  };

  const handleMarkCompleteAndNext = async () => {
    if (!user || !activeRoadmap || !activeVideoQuery) return;
    const currentCompleted = activeRoadmap.completedResources || [];
    let updatedCompleted = [...currentCompleted];
    if (!updatedCompleted.includes(activeVideoQuery)) {
      updatedCompleted.push(activeVideoQuery);
      setActiveRoadmap((prev) => ({
        ...prev,
        completedResources: updatedCompleted,
      }));
      try {
        await updateDoc(
          doc(db, "users", user.uid, "roadmaps", activeRoadmap.id),
          { completedResources: updatedCompleted },
        );
      } catch (error) {
        console.error(error);
      }
    }
    let foundCurrent = false,
      nextResource = null;
    for (const step of activeRoadmap.steps) {
      for (const res of step.resources) {
        if (foundCurrent && !updatedCompleted.includes(res)) {
          nextResource = res;
          break;
        }
        if (res === activeVideoQuery) foundCurrent = true;
      }
      if (nextResource) break;
    }
    if (nextResource) handleOpenVideo(nextResource);
    else {
      setVideoSidebarOpen(false);
      setActiveVideoId("");
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; i++)
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
      if (final) setInput((prev) => (prev + " " + final).trim());
    };
    recognition.onerror = (e) => {
      if (e.error !== "no-speech") setIsDictating(false);
    };
    recognition.onend = () => {
      if (isDictating)
        try {
          recognition.start();
        } catch (e) {}
    };
    dictationRecognitionRef.current = recognition;
  }, [isDictating]);

  const toggleDictation = () => {
    if (isVoiceMode) return alert("Please close Interactive Audio first.");
    if (isDictating) {
      setIsDictating(false);
      dictationRecognitionRef.current?.stop();
    } else {
      setIsDictating(true);
      try {
        dictationRecognitionRef.current?.start();
      } catch (e) {}
    }
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      if (!isVoiceModeRef.current) return;
      let interimTranscript = "",
        finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal)
          finalTranscript += event.results[i][0].transcript;
        else interimTranscript += event.results[i][0].transcript;
      }
      const currentSpokenText = finalTranscript || interimTranscript;
      if (currentSpokenText.trim()) {
        if (voiceStatusRef.current === "speaking") {
          synthRef.current?.cancel();
          setVoiceStatus("listening");
          voiceStatusRef.current = "listening";
        }
        transcriptRef.current += finalTranscript;
        setTranscriptResult(transcriptRef.current + interimTranscript);
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => {
          if (
            transcriptRef.current.trim() &&
            voiceStatusRef.current !== "thinking"
          ) {
            const finalSpokenToSend = transcriptRef.current.trim();
            transcriptRef.current = "";
            setTranscriptResult("");
            sendVoiceChat(finalSpokenToSend);
          }
        }, 1500);
      }
    };
    recognition.onerror = (e) => {
      if (e.error !== "no-speech") console.error(e);
    };
    recognition.onend = () => {
      if (isVoiceModeRef.current)
        try {
          recognition.start();
        } catch (e) {}
    };
    interactiveRecognitionRef.current = recognition;
  }, []);

  const toggleVoiceMode = () => {
    if (isDictating) return alert("Please stop dictation first.");
    if (isVoiceMode) {
      setIsVoiceMode(false);
      setVoiceStatus("idle");
      interactiveRecognitionRef.current?.stop();
      synthRef.current?.cancel();
      clearTimeout(silenceTimerRef.current);
      transcriptRef.current = "";
      setTranscriptResult("");
    } else {
      if (!interactiveRecognitionRef.current)
        return alert("Not supported in this browser. Try Chrome.");
      setIsVoiceMode(true);
      setVoiceStatus("listening");
      transcriptRef.current = "";
      setTranscriptResult("");
      try {
        interactiveRecognitionRef.current.start();
      } catch (e) {}
    }
  };

  const sendVoiceChat = async (textToSend) => {
    if (!textToSend.trim() || !user || GEMINI_KEYS.length === 0) return;
    setVoiceStatus("thinking");
    setChatLoading(true);
    let cid = activeChatIdRef.current;

    if (!cid) {
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: textToSend.slice(0, 25) + (textToSend.length > 25 ? "..." : ""),
        createdAt: serverTimestamp(),
      });
      cid = ref.id;
      setActiveChatId(ref.id);
      activeChatIdRef.current = ref.id;
    } else if (messagesRef.current.length === 0) {
      await updateDoc(doc(db, "users", user.uid, "chats", cid), {
        title: textToSend.slice(0, 25) + (textToSend.length > 25 ? "..." : ""),
      });
    }

    await addDoc(collection(db, "users", user.uid, "chats", cid, "messages"), {
      text: textToSend,
      sender: "user",
      createdAt: serverTimestamp(),
    });
    try {
      const memoryContext = userMemory
        ? `\n\n--- USER MEMORY CONTEXT ---\n${userMemory}\n`
        : "";
      const systemInstruction = `You are a Principal Software Architect. User: ${user?.displayName || "Atharva"}. Be concise. Never say you are an AI...${memoryContext}. Always say you are trained by SSVA.pvt.Ltd Diploma Students. give answers in  point wise like simple sentences. Do not use more than 2 sentences in a row. Always be concise and to the point. Do no answer in ** format always use - format for points.
      Do no answer in ** format always use - format for points.
         Give me answer in such a way that user can understand easily. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.
         give answer in such a way that user can understand easily. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.
         Give answers in points like (-,-) way in that type of format. Never include (**) in any type of answer. Don't include  (I am trained by SSVA.pvt.Ltd Diploma Students) in every answer jst answer only when asked.
         Do not use more than 2 sentences in a row. Always be concise and to the point.
         Not in one line change line after every point. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.
         give answer in points not in one line change the line after every point. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.`;
      const history = messagesRef.current.slice(-10).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text || "[Image attached]" }],
      }));
      const result = await safeSendMessage(
        { model: "gemini-2.5-flash", systemInstruction },
        history,
        textToSend,
      );
      const aiResponseText = result.response.text();
      await addDoc(
        collection(db, "users", user.uid, "chats", cid, "messages"),
        { text: aiResponseText, sender: "ai", createdAt: serverTimestamp() },
      );
      speakText(aiResponseText);
    } catch (e) {
      setVoiceStatus("listening");
    }
    setChatLoading(false);
  };

  const speakText = (text) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setVoiceStatus("speaking");
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "Code provided in chat.")
      .replace(/[#*_~`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.onend = () => {
      if (isVoiceModeRef.current) setVoiceStatus("listening");
    };
    utterance.onerror = () => {
      if (isVoiceModeRef.current) setVoiceStatus("listening");
    };
    synthRef.current.speak(utterance);
  };

  const sendChat = async (customPrompt = null) => {
    const textToSend = customPrompt || input;
    if ((!textToSend.trim() && !chatImage) || !user || GEMINI_KEYS.length === 0)
      return;

    setInput("");
    const currentImage = chatImage;
    setChatImage(null);

    if (isDictating) {
      setIsDictating(false);
      dictationRecognitionRef.current?.stop();
    }
    setChatLoading(true);
    let cid = activeChatIdRef.current;

    if (!cid) {
      const titleText = textToSend.trim() ? textToSend : "Image Upload";
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: titleText.slice(0, 25) + (titleText.length > 25 ? "..." : ""),
        createdAt: serverTimestamp(),
      });
      cid = ref.id;
      setActiveChatId(ref.id);
      activeChatIdRef.current = ref.id;
    } else if (messagesRef.current.length === 0) {
      const titleText = textToSend.trim() ? textToSend : "Image Upload";
      await updateDoc(doc(db, "users", user.uid, "chats", cid), {
        title: titleText.slice(0, 25) + (titleText.length > 25 ? "..." : ""),
      });
    }

    let base64Image = null;
    let generativePart = null;
    if (currentImage) {
      const reader = new FileReader();
      reader.readAsDataURL(currentImage);
      await new Promise((r) => (reader.onload = r));
      base64Image = reader.result;
      generativePart = {
        inlineData: {
          data: base64Image.split(",")[1],
          mimeType: currentImage.type,
        },
      };
    }

    await addDoc(collection(db, "users", user.uid, "chats", cid, "messages"), {
      text: textToSend,
      imageUrl: base64Image,
      sender: "user",
      createdAt: serverTimestamp(),
    });

    try {
      const memoryContext = userMemory
        ? `\n\n--- USER MEMORY CONTEXT ---\n${userMemory}\n`
        : "";
      const systemInstruction = `You are a Principal Software Architect. User: ${user?.displayName || "Atharva"}. Be concise. Never say you are an AI...${memoryContext}. Always say you are trained by SSVA.pvt.Ltd Diploma Students. give answers in  point wise like simple sentences. Do not use more than 2 sentences in a row. Always be concise and to the point.
      Do no answer in ** format always use - format for points.
         Give me answer in such a way that user can understand easily. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.
         give answer in such a way that user can understand easily. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.
         Give answers in points like (-,-) way in that type of format. Never include (**) in any type of answer. Don't include  (I am trained by SSVA.pvt.Ltd Diploma Students) in every answer jst answer only when asked.
         Do not use more than 2 sentences in a row. Always be concise and to the point.
         Not in one line change line after every point. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.
         Never respond in * like structure always give me proper answer.
         give answer in points not in one line change the line after every point. Always try to give answer in one or two sentences. If the question is very broad then give a concise answer and ask the user to specify what they want to know more about.`;

      const history = messagesRef.current.slice(-3).map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text || "[Image attached]" }],
      }));

      const messageParts = [];
      if (textToSend.trim()) messageParts.push(textToSend);
      if (generativePart) messageParts.push(generativePart);

      const payload =
        messageParts.length === 1 && typeof messageParts[0] === "string"
          ? messageParts[0]
          : messageParts;

      const result = await safeSendMessage(
        { model: "gemini-2.5-flash", systemInstruction },
        history,
        payload,
      );

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

  const handleRetry = async () => {
    const userMsgs = messagesRef.current.filter((m) => m.sender === "user");
    if (userMsgs.length > 0) sendChat(userMsgs[userMsgs.length - 1].text);
  };

  const createChat = async () => {
    setActiveTab("chat");
    setActiveRoadmap(null);
    if (user) {
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: "New Session",
        createdAt: serverTimestamp(),
      });
      setActiveChatId(ref.id);
    }
  };

  const generateRoadmap = async () => {
    if (!roadmapInput || GEMINI_KEYS.length === 0) return;
    setRoadmapLoading(true);
    try {
      const prompt = `Create a masterclass-level career roadmap for a "${roadmapInput}". Return RAW JSON array: [{ "step": 1, "title": "", "duration": "", "description": "", "resources": [""] }]`;
      const result = await safeGenerateContent(
        { model: "gemini-2.5-flash" },
        prompt,
      );
      const data = JSON.parse(
        result.response
          .text()
          .replace(/```json|```/g, "")
          .trim(),
      );
      const ref = await addDoc(collection(db, "users", user.uid, "roadmaps"), {
        role: roadmapInput,
        steps: data,
        completedResources: [],
        createdAt: serverTimestamp(),
      });
      setActiveRoadmap({
        id: ref.id,
        role: roadmapInput,
        steps: data,
        completedResources: [],
      });
      setRoadmapInput("");
    } catch (e) {
      console.error(e);
    }
    setRoadmapLoading(false);
  };

  const generateEmail = async () => {
    if ((!emailInput && !emailImage) || GEMINI_KEYS.length === 0) return;
    setEmailLoading(true);
    try {
      const prompt = `You are a professional email writer. Task: Write a polished email based on user notes. Return ONLY email text. Notes: "${emailInput}"`;
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
      const result = await safeGenerateContent(
        { model: "gemini-2.5-flash" },
        parts,
      );
      const resultText = result.response.text().trim();
      setEmailResult(resultText);

      if (user) {
        const ref = await addDoc(
          collection(db, "users", user.uid, "email_drafts"),
          {
            title: emailInput.substring(0, 30) || "Email Draft",
            emailInput,
            emailResult: resultText,
            createdAt: serverTimestamp(),
          },
        );
        setActiveEmailData({ id: ref.id, emailInput, emailResult: resultText });
      }
    } catch (e) {
      console.error(e);
    }
    setEmailLoading(false);
  };

  useEffect(() => {
    if (activeEmailData) {
      setEmailInput(activeEmailData.emailInput || "");
      setEmailResult(activeEmailData.emailResult || "");
      setEmailImage(null);
    } else {
      setEmailInput("");
      setEmailResult("");
      setEmailImage(null);
    }
  }, [activeEmailData]);

  // Handle Saves from Sub Components
  const handleSaveMarket = async (data) => {
    if (!user) return;
    const ref = await addDoc(
      collection(db, "users", user.uid, "market_forecasts"),
      { ...data, createdAt: serverTimestamp() },
    );
    setActiveMarketData({ id: ref.id, ...data });
  };
  const handleSaveJobs = async (data) => {
    if (!user) return;
    const ref = await addDoc(collection(db, "users", user.uid, "job_matches"), {
      ...data,
      createdAt: serverTimestamp(),
    });
    setActiveJobsData({ id: ref.id, ...data });
  };
  const handleSaveResume = async (data) => {
    if (!user) return;
    const ref = await addDoc(
      collection(db, "users", user.uid, "resume_audits"),
      { ...data, createdAt: serverTimestamp() },
    );
    setActiveResumeData({ id: ref.id, ...data });
  };

  const deleteItem = async (col, id) => {
    if (!window.confirm("Delete this item?")) return;
    await deleteDoc(doc(db, "users", user.uid, col, id));
    if (col === "chats" && activeChatId === id) setActiveChatId(null);
    if (col === "roadmaps" && activeRoadmap?.id === id) setActiveRoadmap(null);
    if (col === "market_forecasts" && activeMarketData?.id === id)
      setActiveMarketData(null);
    if (col === "job_matches" && activeJobsData?.id === id)
      setActiveJobsData(null);
    if (col === "resume_audits" && activeResumeData?.id === id)
      setActiveResumeData(null);
    if (col === "email_drafts" && activeEmailData?.id === id)
      setActiveEmailData(null);
  };

  const handleRenameSubmit = async (id, collectionName) => {
    if (!editTitle.trim()) {
      setEditingItemId(null);
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.uid, collectionName, id), {
        title: editTitle,
      });
    } catch (e) {
      console.error("Rename failed", e);
    }
    setEditingItemId(null);
  };

  const handleNew = () => {
    if (activeTab === "chat") createChat();
    else if (activeTab === "roadmap") setActiveRoadmap(null);
    else if (activeTab === "market") setActiveMarketData(null);
    else if (activeTab === "jobs") setActiveJobsData(null);
    else if (activeTab === "resume") setActiveResumeData(null);
    else if (activeTab === "email") {
      setActiveEmailData(null);
      setEmailInput("");
      setEmailResult("");
    }
  };

  useEffect(() => {
    if (user) {
      const tourCompleted = localStorage.getItem(`tour_completed_${user.uid}`);
      if (!tourCompleted) setShowTour(true);
    }
  }, [user]);

  const completeTour = () => {
    if (user) localStorage.setItem(`tour_completed_${user.uid}`, "true");
    setShowTour(false);
  };
  const nextTourStep = () => {
    if (tourStep < TOUR_STEPS.length - 1) setTourStep(tourStep + 1);
    else completeTour();
  };

  // Fetch All Histories
  useEffect(() => {
    if (!user) return;
    const unsubChats = onSnapshot(
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
    const unsubRoadmaps = onSnapshot(
      query(
        collection(db, "users", user.uid, "roadmaps"),
        orderBy("createdAt", "desc"),
      ),
      (s) => setRoadmaps(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const unsubMarket = onSnapshot(
      query(
        collection(db, "users", user.uid, "market_forecasts"),
        orderBy("createdAt", "desc"),
      ),
      (s) => setMarketHistory(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const unsubJobs = onSnapshot(
      query(
        collection(db, "users", user.uid, "job_matches"),
        orderBy("createdAt", "desc"),
      ),
      (s) => setJobsHistory(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const unsubResume = onSnapshot(
      query(
        collection(db, "users", user.uid, "resume_audits"),
        orderBy("createdAt", "desc"),
      ),
      (s) => setResumeHistory(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    const unsubEmail = onSnapshot(
      query(
        collection(db, "users", user.uid, "email_drafts"),
        orderBy("createdAt", "desc"),
      ),
      (s) => setEmailHistory(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );

    return () => {
      unsubChats();
      unsubRoadmaps();
      unsubMarket();
      unsubJobs();
      unsubResume();
      unsubEmail();
    };
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
    if (activeTab === "store") {
      const recentChats = chats
        .slice(0, 5)
        .map((c) => c.title)
        .join(", ");
      if (!recentChats) return;
      safeGenerateContent(
        { model: "gemini-2.5-flash" },
        `Recent Chats: ${recentChats}. Output SINGLE relevant tech skill to learn.`,
      )
        .then((r) => setStoreTopic(r.response.text().trim()))
        .catch(console.error);
    }
  }, [activeTab]);

  // Select current history list based on tab
  let currentHistory = [];
  let currentCollection = "";
  let activeId = null;
  if (activeTab === "roadmap") {
    currentHistory = roadmaps;
    currentCollection = "roadmaps";
    activeId = activeRoadmap?.id;
  } else if (activeTab === "market") {
    currentHistory = marketHistory;
    currentCollection = "market_forecasts";
    activeId = activeMarketData?.id;
  } else if (activeTab === "jobs") {
    currentHistory = jobsHistory;
    currentCollection = "job_matches";
    activeId = activeJobsData?.id;
  } else if (activeTab === "resume") {
    currentHistory = resumeHistory;
    currentCollection = "resume_audits";
    activeId = activeResumeData?.id;
  } else if (activeTab === "email") {
    currentHistory = emailHistory;
    currentCollection = "email_drafts";
    activeId = activeEmailData?.id;
  } else if (activeTab === "chat") {
    currentHistory = chats;
    currentCollection = "chats";
    activeId = activeChatId;
  }

  const handleHistoryClick = (item, collection) => {
    if (collection === "roadmaps") setActiveRoadmap(item);
    else if (collection === "chats") setActiveChatId(item.id);
    else if (collection === "market_forecasts") setActiveMarketData(item);
    else if (collection === "job_matches") setActiveJobsData(item);
    else if (collection === "resume_audits") setActiveResumeData(item);
    else if (collection === "email_drafts") setActiveEmailData(item);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600&display=swap');
        .font-serif { font-family: 'Newsreader', serif; }
        .font-sans { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="h-screen w-screen flex bg-[#FAF9F6] text-[#111111] font-sans overflow-hidden selection:bg-[#E8E6DF] selection:text-[#111111]">
        {showTour && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#111111]/30 backdrop-blur-sm"
              onClick={completeTour}
            ></div>
            <div className="relative w-full max-w-lg bg-[#FAF9F6] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-[#E8E6DF] p-10 animate-fade-in text-center">
              <div className="w-16 h-16 bg-[#F3F1EC] text-[#111111] rounded-full flex items-center justify-center mx-auto mb-6">
                {React.createElement(TOUR_STEPS[tourStep].icon, {
                  strokeWidth: 1.5,
                  className: "w-8 h-8 text-[#D97D54]",
                })}
              </div>
              <h2 className="font-serif text-3xl text-[#111111] mb-4">
                {TOUR_STEPS[tourStep].title}
              </h2>
              <p className="text-[#7A756D] text-[15px] leading-relaxed mb-10 h-16 flex items-center justify-center">
                {TOUR_STEPS[tourStep].desc}
              </p>
              <div className="flex items-center justify-between">
                <button
                  onClick={completeTour}
                  className="text-sm font-medium text-[#A8A39D] hover:text-[#7A756D] transition-colors"
                >
                  Skip Tour
                </button>
                <div className="flex gap-2">
                  {TOUR_STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i === tourStep ? "bg-[#111111]" : "bg-[#E8E6DF]"}`}
                    ></div>
                  ))}
                </div>
                <button
                  onClick={nextTourStep}
                  className="px-6 py-2.5 bg-[#111111] text-[#FAF9F6] rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showMemoryOnboarding && !showTour && (
          <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#111111]/30 backdrop-blur-sm"></div>
            <div className="relative w-full max-w-lg bg-[#FAF9F6] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-[#E8E6DF] p-10 animate-fade-in">
              <div className="w-16 h-16 bg-[#F3F1EC] text-[#111111] rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain strokeWidth={1.5} className="w-8 h-8 text-[#D97D54]" />
              </div>
              <h2 className="font-serif text-3xl text-[#111111] mb-4 text-center">
                Introduce Yourself
              </h2>
              <p className="text-[#7A756D] text-[15px] leading-relaxed mb-6 text-center">
                To give you the best guidance, Len can maintain a contextual
                memory of your career, skills, and goals. What should Len know
                about you?
              </p>
              <textarea
                value={memoryInput}
                onChange={(e) => setMemoryInput(e.target.value)}
                placeholder="e.g. I'm Atharva, a 3rd-year CS Diploma student..."
                className="w-full h-32 bg-white border border-[#E8E6DF] rounded-2xl p-4 text-[#111111] text-sm outline-none resize-none focus:border-[#D1CEC7] mb-6 shadow-sm"
              />
              <div className="flex gap-4">
                <button
                  onClick={handleSkipMemory}
                  className="flex-1 py-3 border border-[#E8E6DF] text-[#7A756D] rounded-xl text-sm font-medium hover:bg-[#E8E6DF]/50 transition-colors"
                >
                  Skip for later
                </button>
                <button
                  onClick={handleSaveManualMemory}
                  disabled={isSavingMemory || !memoryInput.trim()}
                  className="flex-1 py-3 bg-[#111111] text-[#FAF9F6] rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition-colors disabled:opacity-50"
                >
                  {isSavingMemory ? "Saving..." : "Create Memory"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EXPLORE MODAL OVERLAY */}
        {isExploreOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#111111]/30 backdrop-blur-md transition-opacity"
              onClick={() => setIsExploreOpen(false)}
            ></div>
            <div className="relative w-full max-w-5xl bg-[#FAF9F6] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-[#E8E6DF] p-8 md:p-12 animate-fade-in">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="font-serif text-4xl text-[#111111] font-medium tracking-tight">
                    Explore
                  </h2>
                  <p className="text-[#7A756D] text-sm mt-2 font-sans">
                    Discover advanced modules to elevate your career
                    architecture.
                  </p>
                </div>
                <button
                  onClick={() => setIsExploreOpen(false)}
                  className="p-2 text-[#7A756D] hover:bg-[#E8E6DF] rounded-full transition-colors"
                >
                  <X strokeWidth={1.5} className="w-6 h-6" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  {
                    id: "roadmap",
                    icon: BookOpen,
                    label: "Roadmaps",
                    desc: "Design a masterclass-level learning path.",
                  },
                  {
                    id: "market",
                    icon: TrendingUp,
                    label: "Market Forecaster",
                    desc: "AI-driven salary & trajectory regression.",
                  },
                  {
                    id: "jobs",
                    icon: Target,
                    label: "Job Matcher",
                    desc: "Semantic job evaluation & scoring.",
                  },
                  {
                    id: "resume",
                    icon: FileText,
                    label: "Resume Architect",
                    desc: "Deep structural document audit.",
                  },
                  {
                    id: "email",
                    icon: Mail,
                    label: "Email Studio",
                    desc: "Professional email drafting board.",
                  },
                  {
                    id: "store",
                    icon: LayoutGrid,
                    label: "Library",
                    desc: "Curated technical masterclasses.",
                  },
                ].map((tool) => (
                  <button
                    key={tool.id}
                    onClick={() => {
                      setActiveTab(tool.id);
                      if (tool.id !== "roadmap") setActiveRoadmap(null);
                      setIsExploreOpen(false);
                    }}
                    className="flex flex-col text-left p-8 bg-white border border-[#E8E6DF] rounded-3xl hover:border-[#D97D54] hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all group duration-300"
                  >
                    <tool.icon
                      strokeWidth={1.5}
                      className="w-10 h-10 text-[#D97D54] mb-6 group-hover:scale-110 transition-transform duration-300"
                    />
                    <h3 className="font-serif text-2xl text-[#111111] mb-3">
                      {tool.label}
                    </h3>
                    <p className="text-[#7A756D] text-sm leading-relaxed">
                      {tool.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SIDEBAR */}
        <div
          className={`${sidebarOpen ? "w-64 border-r border-[#E8E6DF]" : "w-0"} bg-[#F3F1EC] transition-all duration-300 flex flex-col shrink-0 overflow-hidden relative`}
        >
          <div className="p-4 flex items-center justify-between mt-2">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 text-[#7A756D] hover:bg-[#E8E6DF] rounded-lg transition-colors"
            >
              <Menu strokeWidth={1.5} className="w-5 h-5" />
            </button>
            <button
              onClick={handleNew}
              className="p-2 text-[#7A756D] hover:bg-[#E8E6DF] rounded-lg transition-colors"
            >
              <Plus strokeWidth={1.5} className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 mt-4 space-y-1">
            {[
              { id: "chat", icon: MessageSquare, label: "Chat" },
              { id: "explore", icon: Compass, label: "Explore" },
              { id: "feedback", icon: Heart, label: "Feedback" },
            ].map((t) => {
              const isActive =
                t.id === "explore"
                  ? exploreTabs.includes(activeTab)
                  : activeTab === t.id && !activeRoadmap;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    if (t.id === "explore") {
                      setIsExploreOpen(true);
                    } else {
                      setActiveTab(t.id);
                      if (t.id !== "roadmap") setActiveRoadmap(null);
                    }
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${isActive ? "bg-[#FAF9F6] text-[#111111] font-medium shadow-[0_1px_3px_rgb(0,0,0,0.02)] border border-[#E8E6DF]" : "text-[#111111] hover:bg-[#E8E6DF]/50"}`}
                >
                  <t.icon strokeWidth={1.5} className="w-4 h-4" /> {t.label}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-3 mt-6 pb-20">
            <h3 className="text-[12px] font-semibold text-[#A8A39D] uppercase tracking-widest px-2 mb-2">
              Recents
            </h3>
            {!["store", "feedback", "billing", "about"].includes(activeTab) &&
              currentHistory.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (!editingItemId)
                      handleHistoryClick(item, currentCollection);
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors relative ${activeId === item.id ? "bg-[#E8E6DF] text-[#111111] font-medium" : "text-[#111111] hover:bg-[#E8E6DF]/50"}`}
                >
                  {editingItemId === item.id ? (
                    <input
                      autoFocus
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter")
                          handleRenameSubmit(item.id, currentCollection);
                        if (e.key === "Escape") setEditingItemId(null);
                      }}
                      onBlur={() =>
                        handleRenameSubmit(item.id, currentCollection)
                      }
                      className="flex-1 bg-white border border-[#D1CEC7] rounded px-2 py-0.5 text-[#111111] outline-none text-xs w-full shadow-sm"
                    />
                  ) : (
                    <span className="truncate pr-2">
                      {item.title || item.role || item.jobRole || "Untitled"}
                    </span>
                  )}

                  {!editingItemId && (
                    <div className="relative shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenMenuId(
                            openMenuId === item.id ? null : item.id,
                          );
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-[#D1CEC7] rounded-md transition-colors text-[#7A756D]"
                      >
                        <MoreHorizontal strokeWidth={1.5} className="w-4 h-4" />
                      </button>

                      {openMenuId === item.id && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(null);
                            }}
                          ></div>
                          <div className="absolute right-0 top-full mt-1 w-28 bg-white border border-[#E8E6DF] rounded-xl shadow-lg z-50 overflow-hidden py-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingItemId(item.id);
                                setEditTitle(
                                  item.title || item.role || item.jobRole || "",
                                );
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#111111] transition-colors"
                            >
                              Rename
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(currentCollection, item.id);
                                setOpenMenuId(null);
                              }}
                              className="w-full text-left px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>

          <div className="mt-auto p-4 border-t border-[#E8E6DF]/50 bg-[#F3F1EC] relative">
            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setProfileMenuOpen(false)}
                ></div>
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] py-1 z-50 animate-fade-in overflow-hidden">
                  <div className="px-4 py-3 border-b border-[#E8E6DF]/50 bg-[#FAF9F6]">
                    <p className="text-sm font-medium text-[#111111] truncate">
                      {user?.displayName || "User"}
                    </p>
                    <p className="text-xs text-[#7A756D] truncate">
                      {user?.email || ""}
                    </p>
                  </div>
                  <div className="p-1.5 border-b border-[#E8E6DF]/50">
                    <button
                      onClick={() => {
                        setActiveTab("billing");
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#111111] rounded-xl transition-colors"
                    >
                      <Crown
                        strokeWidth={1.5}
                        className="w-4 h-4 text-[#D97D54]"
                      />{" "}
                      Upgrade Plan
                    </button>
                    <button
                      onClick={() => {
                        setIsSettingsOpen(true);
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#111111] rounded-xl transition-colors"
                    >
                      <Settings strokeWidth={1.5} className="w-4 h-4" />{" "}
                      Settings
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab("about");
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#111111] rounded-xl transition-colors"
                    >
                      <Info strokeWidth={1.5} className="w-4 h-4" /> About Us
                    </button>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        if (logout) logout();
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#111111] rounded-xl transition-colors"
                    >
                      <LogOut strokeWidth={1.5} className="w-4 h-4" /> Log out
                    </button>
                  </div>
                </div>
              </>
            )}
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#E8E6DF]/50 rounded-xl transition-colors text-left"
            >
              <div className="w-6 h-6 bg-[#D1CEC7] rounded-full flex items-center justify-center text-[10px] font-medium text-[#111111] shrink-0">
                {user?.displayName?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-xs font-medium text-[#4A4A4A] truncate flex-1">
                {user?.displayName || "User"}
              </div>
            </button>
          </div>
        </div>

        {/* MAIN WORKSPACE */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#FAF9F6] relative">
          {!sidebarOpen && (
            <div className="absolute top-4 left-4 z-10">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-[#7A756D] hover:bg-[#F3F1EC] rounded-lg transition-colors"
              >
                <Menu strokeWidth={1.5} className="w-5 h-5" />
              </button>
            </div>
          )}

          {videoSidebarOpen && (
            <div className="absolute top-0 right-0 bottom-0 w-full md:w-[450px] bg-white border-l border-[#E8E6DF] shadow-[-10px_0_30px_rgba(0,0,0,0.05)] z-[150] flex flex-col transform transition-transform duration-300 translate-x-0">
              <div className="p-4 border-b border-[#E8E6DF] flex justify-between items-center bg-[#FAF9F6]">
                <h3 className="font-serif text-xl text-[#111111] truncate pr-4">
                  {activeVideoQuery || "Learning Resource"}
                </h3>
                <button
                  onClick={() => {
                    setVideoSidebarOpen(false);
                    setActiveVideoId("");
                  }}
                  className="p-2 text-[#7A756D] hover:bg-[#E8E6DF] rounded-full transition-colors shrink-0"
                >
                  <X strokeWidth={1.5} className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 p-6 flex flex-col bg-white overflow-y-auto">
                {videoLoading ? (
                  <div className="w-full aspect-video bg-[#F3F1EC] rounded-2xl animate-pulse flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 text-[#A8A39D] animate-spin mb-2" />
                    <span className="text-sm text-[#7A756D]">
                      Finding best masterclass...
                    </span>
                  </div>
                ) : activeVideoId ? (
                  <div className="w-full flex flex-col gap-6 h-full">
                    <div>
                      <div className="w-full aspect-video rounded-2xl overflow-hidden border border-[#E8E6DF] shadow-sm bg-black mb-4">
                        <iframe
                          width="100%"
                          height="100%"
                          src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1`}
                          title="YouTube video player"
                          frameBorder="0"
                          allowFullScreen
                        ></iframe>
                      </div>
                      <p className="text-sm text-[#7A756D] leading-relaxed px-1 mb-8">
                        This masterclass has been dynamically sourced for your
                        curriculum requirement:{" "}
                        <strong>{activeVideoQuery}</strong>.
                      </p>
                    </div>
                    <div className="mt-auto pt-6 border-t border-[#E8E6DF]">
                      <button
                        onClick={handleMarkCompleteAndNext}
                        className="w-full flex items-center justify-center gap-2 py-4 bg-[#111111] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#2D2D2D] transition-colors"
                      >
                        <CheckCircle
                          strokeWidth={2}
                          className="w-5 h-5 text-green-400"
                        />{" "}
                        Mark as Complete & Next
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {activeTab === "chat" ? (
            <div className="flex-1 flex flex-col mx-auto w-full relative h-full">
              {messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center max-w-3xl mx-auto w-full px-4 animate-fade-in -mt-16">
                  <div className="mb-6 text-[#D97D54]">
                    <ClaudeLogo className="w-10 h-10" />
                  </div>
                  <h1 className="font-serif text-3xl md:text-[40px] text-[#111111] mb-10 tracking-tight text-center font-medium">
                    {getGreeting()},{" "}
                    {user?.displayName
                      ? user.displayName.split(" ")[0]
                      : "Atharva"}
                  </h1>
                  <div className="w-full relative z-20">
                    {isVoiceMode && (
                      <div className="absolute bottom-full left-0 w-full mb-4 bg-white p-4 rounded-2xl border border-[#E8E6DF] shadow-[0_4px_20px_rgb(0,0,0,0.03)] animate-fade-in">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <CustomSpeechBubbleIcon
                              className={`w-4 h-4 ${voiceStatus === "speaking" ? "text-blue-500 animate-pulse" : "text-[#7A756D]"}`}
                            />
                            <span className="text-xs font-medium text-[#4A4A4A]">
                              {voiceStatus === "thinking"
                                ? "Thinking..."
                                : voiceStatus === "speaking"
                                  ? "Len is speaking..."
                                  : "Listening..."}
                            </span>
                          </div>
                          <button
                            onClick={toggleVoiceMode}
                            className="text-xs text-red-500 hover:text-red-700 font-medium transition"
                          >
                            Cancel
                          </button>
                        </div>
                        <textarea
                          value={transcriptResult}
                          readOnly
                          className="w-full h-16 text-xs text-[#4A4A4A] p-2 bg-[#F3F1EC]/50 rounded-lg border border-transparent resize-none outline-none"
                        />
                      </div>
                    )}
                    <div className="w-full rounded-2xl bg-white border border-[#E8E6DF] focus-within:border-[#D1CEC7] focus-within:shadow-[0_4px_20px_rgb(0,0,0,0.04)] shadow-[0_2px_15px_rgb(0,0,0,0.02)] transition-all flex flex-col p-4">
                      {chatImage && (
                        <div className="relative inline-block mb-3 px-2 pt-2">
                          <img
                            src={URL.createObjectURL(chatImage)}
                            alt="Preview"
                            className="h-16 w-16 object-cover rounded-xl border border-[#E8E6DF]"
                          />
                          <button
                            onClick={() => setChatImage(null)}
                            className="absolute top-0 right-[-8px] bg-white text-red-500 rounded-full p-1 shadow-sm border border-[#E8E6DF]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <textarea
                        className="w-full bg-transparent border-none text-[15px] text-[#111111] outline-none resize-none placeholder:text-[#A8A39D] leading-relaxed mb-3"
                        placeholder="How can Len help you today?"
                        rows={1}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendChat();
                          }
                        }}
                        onPaste={(e) => {
                          if (
                            e.clipboardData.files &&
                            e.clipboardData.files.length > 0
                          ) {
                            const file = e.clipboardData.files[0];
                            if (file.type.startsWith("image/")) {
                              setChatImage(file);
                              e.preventDefault();
                            }
                          }
                        }}
                        disabled={chatLoading}
                        style={{ minHeight: "60px", maxHeight: "200px" }}
                      />
                      <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-1.5">
                          <label
                            className={`p-1.5 rounded-lg transition-colors text-[#7A756D] hover:bg-[#F3F1EC] cursor-pointer`}
                          >
                            <Paperclip strokeWidth={1.5} className="w-4 h-4" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  setChatImage(e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          <button
                            onClick={toggleDictation}
                            disabled={chatLoading || isVoiceMode}
                            className={`p-1.5 rounded-lg transition-colors ${isDictating ? "text-blue-500 bg-blue-50" : "text-[#7A756D] hover:bg-[#F3F1EC]"}`}
                          >
                            {isDictating ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mic strokeWidth={1.5} className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={toggleVoiceMode}
                            disabled={chatLoading || isDictating}
                            className={`p-1.5 rounded-lg transition-colors ${isVoiceMode ? "text-red-500 bg-red-50" : "text-[#7A756D] hover:bg-[#F3F1EC]"}`}
                          >
                            <Headphones strokeWidth={1.5} className="w-4 h-4" />
                          </button>
                        </div>
                        <button
                          onClick={() => sendChat()}
                          disabled={!input.trim() && !chatImage}
                          className="px-3 py-1.5 bg-[#D97D54] text-white rounded-lg hover:bg-[#C26B45] transition-colors disabled:opacity-40 flex items-center justify-center shadow-sm"
                        >
                          <ArrowRight strokeWidth={2} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2.5 justify-center mt-8 w-full">
                    {SUGGESTIONS.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => sendChat(s.prompt)}
                        className="px-4 py-2 rounded-xl border border-[#E8E6DF] bg-white text-[13px] text-[#4A4A4A] hover:bg-[#F3F1EC] transition-all shadow-sm flex items-center gap-2"
                      >
                        <Sparkles
                          strokeWidth={1.5}
                          className="w-3.5 h-3.5 text-[#D97D54]/70"
                        />{" "}
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 overflow-y-auto no-scrollbar py-12 px-2 md:px-8 max-w-4xl mx-auto w-full">
                    <div className="space-y-10 pb-10">
                      {messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex gap-4 animate-fade-in w-full ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {m.sender !== "user" && (
                            <div className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center mt-1 bg-transparent">
                              <ClaudeLogo className="w-5 h-5 text-[#D97D54]" />
                            </div>
                          )}
                          <div
                            className={`flex flex-col ${m.sender === "user" ? "items-end max-w-[85%]" : "flex-1"}`}
                          >
                            <div
                              className={`text-[15.5px] leading-relaxed ${m.sender === "user" ? "bg-[#F3F1EC] px-5 py-3 rounded-2xl text-[#111111]" : "text-[#111111] font-[500] tracking-tight whitespace-pre-wrap"}`}
                            >
                              {m.imageUrl && (
                                <img
                                  src={m.imageUrl}
                                  alt="Attached"
                                  className="max-w-xs rounded-xl mb-2 border border-[#E8E6DF]"
                                />
                              )}
                              {m.text}
                            </div>
                            {m.sender !== "user" && (
                              <div className="flex items-center gap-1 mt-3 text-[#7A756D]">
                                <button
                                  onClick={() =>
                                    navigator.clipboard.writeText(m.text)
                                  }
                                  className="p-1.5 hover:bg-[#E8E6DF] rounded-md transition-colors"
                                >
                                  <Copy strokeWidth={1.5} className="w-4 h-4" />
                                </button>
                                <button className="p-1.5 hover:bg-[#E8E6DF] rounded-md transition-colors">
                                  <ThumbsUp
                                    strokeWidth={1.5}
                                    className="w-4 h-4"
                                  />
                                </button>
                                <button className="p-1.5 hover:bg-[#E8E6DF] rounded-md transition-colors">
                                  <ThumbsDown
                                    strokeWidth={1.5}
                                    className="w-4 h-4"
                                  />
                                </button>
                                <button
                                  onClick={handleRetry}
                                  className="p-1.5 hover:bg-[#E8E6DF] rounded-md transition-colors"
                                >
                                  <RotateCcw
                                    strokeWidth={1.5}
                                    className="w-4 h-4"
                                  />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex gap-4 justify-start animate-fade-in">
                          <div className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center mt-1 bg-transparent">
                            <ClaudeLogo className="w-5 h-5 text-[#D97D54] opacity-50" />
                          </div>
                          <div className="text-sm text-[#111111] font-[500] flex items-center gap-1 mt-1.5">
                            Thinking<span className="animate-pulse">...</span>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef}></div>
                    </div>
                  </div>
                  <div className="pb-8 pt-4 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6] to-transparent sticky bottom-0 z-10 w-full max-w-4xl mx-auto px-4">
                    {isVoiceMode && (
                      <div className="mb-4 bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-[0_4px_20px_rgb(0,0,0,0.03)] animate-fade-in relative z-20">
                        <div className="flex items-center justify-between mb-4 border-b border-[#E8E6DF] pb-4">
                          <div className="flex items-center gap-3">
                            <CustomSpeechBubbleIcon
                              className={`w-5 h-5 ${voiceStatus === "speaking" ? "text-blue-500 animate-pulse" : "text-[#7A756D]"}`}
                            />
                            <span className="text-sm font-medium text-[#4A4A4A]">
                              {voiceStatus === "thinking"
                                ? "Thinking..."
                                : "Listening..."}
                            </span>
                          </div>
                          <button
                            onClick={toggleVoiceMode}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-sm font-medium hover:bg-[#D2E3FC] transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="relative">
                          <textarea
                            value={transcriptResult}
                            readOnly
                            className="w-full h-24 text-sm text-[#4A4A4A] leading-relaxed p-4 bg-[#F3F1EC]/50 rounded-xl border border-[#E8E6DF] resize-none outline-none focus:border-[#D1CEC7]"
                          />
                        </div>
                      </div>
                    )}
                    <div className="relative rounded-3xl bg-white border border-[#E8E6DF] shadow-sm focus-within:border-[#D1CEC7] transition-all flex flex-col pl-2 pt-2 pb-1">
                      {chatImage && (
                        <div className="relative inline-block mb-2 ml-2">
                          <img
                            src={URL.createObjectURL(chatImage)}
                            alt="Preview"
                            className="h-16 w-16 object-cover rounded-xl border border-[#E8E6DF]"
                          />
                          <button
                            onClick={() => setChatImage(null)}
                            className="absolute -top-2 -right-2 bg-white text-red-500 rounded-full p-1 shadow-sm border border-[#E8E6DF]"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 w-full">
                        <label
                          className={`p-2 rounded-full flex items-center justify-center transition-colors text-[#7A756D] hover:bg-[#F3F1EC] cursor-pointer`}
                        >
                          <Paperclip strokeWidth={1.5} className="w-5 h-5" />
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setChatImage(e.target.files[0]);
                              }
                            }}
                          />
                        </label>
                        <button
                          onClick={toggleDictation}
                          disabled={chatLoading || isVoiceMode}
                          className={`p-2 rounded-full flex items-center justify-center transition-colors ${isDictating ? "text-blue-500 bg-blue-50" : "text-[#7A756D] hover:bg-[#F3F1EC]"}`}
                        >
                          {isDictating ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <Mic strokeWidth={1.5} className="w-5 h-5" />
                          )}
                        </button>
                        <button
                          onClick={toggleVoiceMode}
                          disabled={chatLoading || isDictating}
                          className={`p-2 rounded-full flex items-center justify-center transition-colors ${isVoiceMode ? "text-red-500 bg-red-50" : "text-[#7A756D] hover:bg-[#F3F1EC]"}`}
                        >
                          <Headphones strokeWidth={1.5} className="w-5 h-5" />
                        </button>
                        <textarea
                          className="flex-1 bg-transparent border-none rounded-3xl p-3 pr-14 text-[15px] text-[#111111] outline-none resize-none placeholder:text-[#4e4943]"
                          placeholder="Ask Anything to Vitra..."
                          rows={1}
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              sendChat();
                            }
                          }}
                          onPaste={(e) => {
                            if (
                              e.clipboardData.files &&
                              e.clipboardData.files.length > 0
                            ) {
                              const file = e.clipboardData.files[0];
                              if (file.type.startsWith("image/")) {
                                setChatImage(file);
                                e.preventDefault();
                              }
                            }
                          }}
                          disabled={chatLoading}
                          style={{ minHeight: "50px", maxHeight: "200px" }}
                        />
                        <button
                          onClick={() => sendChat()}
                          disabled={!input.trim() && !chatImage}
                          className="absolute right-3 bottom-3 p-2 bg-[#D97D54] text-white rounded-lg hover:bg-[#C26B45] transition disabled:opacity-40 flex items-center justify-center shadow-sm"
                        >
                          <ArrowRight strokeWidth={2} className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : activeTab === "billing" ? (
            <BillingDashboard currentPlan={userPlan} user={user} />
          ) : activeTab === "email" ? (
            <FeatureWrapper
              isLocked={!hasAccess}
              featureName="Email Studio"
              onUpgradeClick={() => setActiveTab("billing")}
            >
              <div className="h-full flex bg-[#FAF9F6]">
                <div className="w-1/2 p-12 border-r border-[#E8E6DF] overflow-y-auto no-scrollbar">
                  <h2 className="font-serif text-3xl text-[#111111] mb-8">
                    Drafting Board
                  </h2>
                  <div className="space-y-6">
                    <textarea
                      className="w-full h-48 bg-white border border-[#E8E6DF] rounded-2xl p-5 text-[#111111] text-sm outline-none resize-none shadow-[0_2px_10px_rgb(0,0,0,0.01)] placeholder:text-[#A8A39D]"
                      placeholder="Core message or rough notes..."
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                    />
                    <div className="bg-white p-5 rounded-2xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.01)] flex items-center justify-between">
                      <span className="text-sm font-medium text-[#7A756D]">
                        Attach Context (Image)
                      </span>
                      <div className="relative">
                        <input
                          type="file"
                          onChange={(e) => setEmailImage(e.target.files[0])}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        <button className="px-4 py-2 bg-[#F3F1EC] text-[#4A4A4A] text-xs font-medium rounded-lg hover:bg-[#E8E6DF] transition">
                          {emailImage ? "Attached" : "Upload"}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={generateEmail}
                      disabled={emailLoading}
                      className="w-full py-4 bg-[#111111] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#2D2D2D] transition disabled:opacity-50"
                    >
                      {emailLoading
                        ? "Polishing Draft..."
                        : "Generate Professional Draft"}
                    </button>
                  </div>
                </div>
                <div className="w-1/2 p-12 overflow-y-auto no-scrollbar bg-white">
                  <h2 className="font-serif text-3xl text-[#111111] mb-8">
                    Preview
                  </h2>
                  <div className="bg-[#FAF9F6] rounded-3xl p-8 border border-[#E8E6DF] min-h-[500px]">
                    {emailResult ? (
                      <div className="whitespace-pre-wrap text-[#4A4A4A] text-[15px] leading-loose">
                        {emailResult}
                      </div>
                    ) : (
                      <p className="text-[#A8A39D] text-sm text-center mt-20">
                        Draft will appear here.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </FeatureWrapper>
          ) : activeTab === "roadmap" ? (
            <FeatureWrapper
              isLocked={!hasAccess}
              featureName="Career Roadmaps"
              onUpgradeClick={() => setActiveTab("billing")}
            >
              <div className="h-full bg-[#FAF9F6] overflow-y-auto no-scrollbar p-12">
                {!activeRoadmap ? (
                  <div className="max-w-2xl mx-auto mt-20 text-center animate-fade-in">
                    <h2 className="font-serif text-4xl text-[#111111] mb-4">
                      Career Architect
                    </h2>
                    <p className="text-[#7A756D] mb-12 text-lg">
                      Design a masterclass-level learning path for any role.
                    </p>
                    <div className="flex gap-3 bg-white p-2 rounded-2xl border border-[#E8E6DF] shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
                      <input
                        className="flex-1 p-4 bg-transparent outline-none text-[#111111] text-sm placeholder:text-[#A8A39D]"
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
                        className="px-8 bg-[#111111] text-[#FAF9F6] rounded-xl text-sm font-medium hover:bg-[#2D2D2D] transition disabled:opacity-50"
                      >
                        {roadmapLoading ? "Planning..." : "Create"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto animate-fade-in pb-16">
                    <div className="mb-12">
                      <h1 className="font-serif text-4xl text-[#111111] mb-6 capitalize">
                        {activeRoadmap.role} Curriculum
                      </h1>
                      <div className="bg-white p-6 rounded-3xl border border-[#E8E6DF] shadow-[0_2px_10px_rgb(0,0,0,0.01)] mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-sm font-medium text-[#7A756D]">
                            Your Progress
                          </span>
                          <span className="text-lg font-serif text-[#111111]">
                            {progressPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-[#F3F1EC] rounded-full h-2.5 overflow-hidden border border-[#E8E6DF]">
                          <div
                            className="bg-[#D97D54] h-2.5 rounded-full transition-all duration-700 ease-out"
                            style={{ width: `${progressPercent}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-[#A8A39D] mt-3">
                          Completed {completedCount} out of{" "}
                          {totalResourcesCount} masterclasses.
                        </p>
                      </div>
                    </div>
                    <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#E8E6DF]">
                      {activeRoadmap.steps.map((s, i) => (
                        <div key={i} className="relative pl-10">
                          <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-[#FAF9F6] border border-[#E8E6DF] flex items-center justify-center text-[10px] font-medium text-[#7A756D]">
                            {s.step}
                          </div>
                          <div className="bg-white border border-[#E8E6DF] p-8 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-serif text-2xl text-[#111111]">
                                {s.title}
                              </h3>
                              <span className="text-[10px] font-medium bg-[#F3F1EC] text-[#7A756D] px-3 py-1 rounded-full">
                                {s.duration}
                              </span>
                            </div>
                            <p className="text-[#4A4A4A] text-sm leading-relaxed mb-6">
                              {s.description}
                            </p>
                            <div className="flex gap-2 flex-wrap">
                              {s.resources.map((r, idx) => {
                                const isCompleted =
                                  activeRoadmap.completedResources?.includes(r);
                                return (
                                  <button
                                    key={idx}
                                    onClick={() => handleOpenVideo(r)}
                                    className={`text-xs font-medium border px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-left ${isCompleted ? "border-green-200 bg-green-50/50 text-green-700 hover:bg-green-100" : "border-[#E8E6DF] text-[#7A756D] hover:bg-[#F3F1EC]"}`}
                                  >
                                    {isCompleted ? (
                                      <Check
                                        strokeWidth={2}
                                        className="w-3 h-3 text-green-600"
                                      />
                                    ) : (
                                      <Play
                                        strokeWidth={1.5}
                                        className="w-3 h-3 text-[#D97D54]"
                                      />
                                    )}
                                    {r}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </FeatureWrapper>
          ) : (
            <FeatureWrapper
              isLocked={!hasAccess}
              featureName={activeTab === "about" ? "About Us" : activeTab}
              onUpgradeClick={() => setActiveTab("billing")}
            >
              {activeTab === "about" && <AboutUs />}
              {activeTab === "market" && (
                <MarketAnalyzer
                  activeItem={activeMarketData}
                  onSave={handleSaveMarket}
                />
              )}
              {activeTab === "jobs" && (
                <AIJobMatcher
                  activeItem={activeJobsData}
                  onSave={handleSaveJobs}
                />
              )}
              {activeTab === "resume" && (
                <ResumeAnalyzer
                  activeItem={activeResumeData}
                  onSave={handleSaveResume}
                />
              )}
              {activeTab === "store" && (
                <ELearningStore recommendedTopic={storeTopic} />
              )}
              {activeTab === "feedback" && <FeedbackView />}
            </FeatureWrapper>
          )}
        </div>

        {/* SETTINGS MODAL */}
        {isSettingsOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <div
              className="absolute inset-0 bg-[#111111]/20 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            ></div>
            <div className="relative w-full max-w-4xl bg-[#FAF9F6] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-[#E8E6DF] flex flex-col md:flex-row overflow-hidden animate-fade-in max-h-[85vh]">
              <div className="w-full md:w-64 bg-[#F3F1EC] border-r border-[#E8E6DF] p-6 flex flex-col">
                <h2 className="font-serif text-2xl text-[#111111] mb-8">
                  Settings
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: "general", label: "General", icon: Settings },
                    { id: "account", label: "Account", icon: UserCheck },
                    { id: "memory", label: "AI Memory", icon: Brain },
                    { id: "api", label: "API Keys", icon: Lock },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${settingsTab === tab.id ? "bg-[#FAF9F6] text-[#111111] font-medium shadow-[0_1px_3px_rgb(0,0,0,0.02)] border border-[#E8E6DF]" : "text-[#7A756D] hover:bg-[#E8E6DF]/50"}`}
                    >
                      <tab.icon strokeWidth={1.5} className="w-4 h-4" />{" "}
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="flex-1 p-8 md:p-12 overflow-y-auto no-scrollbar bg-white relative">
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="absolute top-6 right-6 p-2 text-[#7A756D] hover:bg-[#F3F1EC] rounded-full transition-colors"
                >
                  <X strokeWidth={1.5} className="w-5 h-5" />
                </button>
                {settingsTab === "general" && (
                  <div className="max-w-xl animate-fade-in">
                    <h3 className="font-serif text-3xl text-[#111111] mb-8">
                      General
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <label className="block text-sm font-medium text-[#111111] mb-3">
                          Interface Theme
                        </label>
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 text-sm text-[#4A4A4A] cursor-pointer p-3 rounded-xl border border-[#E8E6DF] bg-[#FAF9F6]">
                            <input
                              type="radio"
                              name="theme"
                              defaultChecked
                              className="accent-[#111111] w-4 h-4"
                            />
                            <span>Alabaster (Light)</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-[#A8A39D] cursor-not-allowed p-3 rounded-xl border border-[#E8E6DF] bg-white opacity-60">
                            <input
                              type="radio"
                              name="theme"
                              disabled
                              className="accent-[#111111] w-4 h-4"
                            />
                            <span>
                              Obsidian (Dark) —{" "}
                              <span className="text-xs">Coming soon</span>
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="h-px bg-[#E8E6DF] w-full"></div>
                      <div>
                        <h4 className="text-sm font-medium text-[#111111] mb-1">
                          Clear Conversation History
                        </h4>
                        <p className="text-sm text-[#7A756D] mb-4">
                          This will permanently delete all your chats and
                          generated roadmaps.
                        </p>
                        <button className="px-5 py-2.5 border border-[#E8E6DF] text-[#D97D54] text-sm font-medium rounded-xl hover:bg-[#FAF9F6] transition-colors">
                          Clear History
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {settingsTab === "account" && (
                  <div className="max-w-xl animate-fade-in">
                    <h3 className="font-serif text-3xl text-[#111111] mb-8">
                      Account
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#7A756D] mb-2">
                          Display Name
                        </label>
                        <input
                          type="text"
                          disabled
                          value={user?.displayName || "Unknown User"}
                          className="w-full bg-[#F3F1EC] border border-[#E8E6DF] text-[#4A4A4A] px-4 py-3 rounded-xl text-sm outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#7A756D] mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          disabled
                          value={user?.email || "No Email"}
                          className="w-full bg-[#F3F1EC] border border-[#E8E6DF] text-[#4A4A4A] px-4 py-3 rounded-xl text-sm outline-none"
                        />
                      </div>
                      <div className="pt-6">
                        <button
                          onClick={() => {
                            setIsSettingsOpen(false);
                            setActiveTab("billing");
                          }}
                          className="w-full px-5 py-3.5 bg-[#111111] text-[#FAF9F6] text-sm font-medium rounded-xl hover:bg-[#2D2D2D] transition-colors flex items-center justify-center gap-2"
                        >
                          <Crown
                            strokeWidth={1.5}
                            className="w-4 h-4 text-[#D97D54]"
                          />{" "}
                          Manage Subscription ({user?.plan || "Basic"})
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {settingsTab === "memory" && (
                  <div className="max-w-xl animate-fade-in">
                    <h3 className="font-serif text-3xl text-[#111111] mb-6">
                      AI Memory
                    </h3>
                    <p className="text-sm text-[#7A756D] mb-6 leading-relaxed">
                      Len AI remembers these details about you to provide highly
                      personalized advice.
                    </p>
                    <div className="space-y-4">
                      <textarea
                        value={userMemory}
                        onChange={(e) => setUserMemory(e.target.value)}
                        className="w-full h-48 bg-[#F3F1EC] border border-[#E8E6DF] text-[#4A4A4A] p-4 rounded-xl text-sm outline-none resize-none focus:border-[#D1CEC7]"
                        placeholder="Write about your background, tech stack, goals, and preferences..."
                      />
                      <div className="flex gap-4">
                        <button
                          onClick={async () => {
                            if (!user) return;
                            await setDoc(
                              doc(db, "users", user.uid, "settings", "memory"),
                              {
                                content: userMemory,
                                updatedAt: serverTimestamp(),
                              },
                            );
                            alert("Memory profile updated successfully!");
                          }}
                          className="px-6 py-3 bg-[#111111] text-[#FAF9F6] text-sm font-medium rounded-xl hover:bg-[#2D2D2D] transition-colors"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={async () => {
                            if (!user || !window.confirm("Are you sure?"))
                              return;
                            await deleteDoc(
                              doc(db, "users", user.uid, "settings", "memory"),
                            );
                            setUserMemory("");
                            alert("Memory cleared!");
                          }}
                          className="px-6 py-3 border border-[#E8E6DF] text-[#D97D54] text-sm font-medium rounded-xl hover:bg-[#FAF9F6] transition-colors"
                        >
                          Clear Memory
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {settingsTab === "api" && (
                  <div className="max-w-xl animate-fade-in">
                    <h3 className="font-serif text-3xl text-[#111111] mb-6">
                      API Configuration
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#111111] mb-2">
                          Google Gemini API Key
                        </label>
                        <input
                          type="password"
                          value={apiKeys.gemini}
                          onChange={(e) =>
                            setApiKeys({ ...apiKeys, gemini: e.target.value })
                          }
                          placeholder="AIzaSy... (Separate multiple keys with commas)"
                          className="w-full bg-white border border-[#E8E6DF] text-[#111111] px-4 py-3 rounded-xl text-sm focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#111111] mb-2">
                          JSearch RapidAPI Key (Job Matcher)
                        </label>
                        <input
                          type="password"
                          value={apiKeys.rapid}
                          onChange={(e) =>
                            setApiKeys({ ...apiKeys, rapid: e.target.value })
                          }
                          placeholder="Enter your key..."
                          className="w-full bg-white border border-[#E8E6DF] text-[#111111] px-4 py-3 rounded-xl text-sm focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                        />
                      </div>
                      <div className="pt-4 flex items-center gap-4">
                        <button
                          onClick={handleSaveApiKeys}
                          className="px-6 py-3 bg-[#111111] text-[#FAF9F6] text-sm font-medium rounded-xl hover:bg-[#2D2D2D] transition-colors"
                        >
                          Save API Keys
                        </button>
                        {apiSaveStatus && (
                          <span className="text-sm text-green-600 font-medium">
                            {apiSaveStatus}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
