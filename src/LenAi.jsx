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
} from "firebase/firestore";

// --- CONFIGURATION ---
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;
const RAPIDAPI_KEY = import.meta.env.VITE_RAPIDAPI_KEY;
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// ==================================================================
// SUB-COMPONENT: Custom Image Icon for AI Speaking Status
// ==================================================================
const CustomSpeechBubbleIcon = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    stroke="none"
  >
    <path
      d="M19.07,3H4.93C3.31,3,2,4.31,2,5.93v8.14c0,1.62,1.31,2.93,2.93,2.93h12.14l4.93,4V5.93C22,4.31,20.69,3,19.07,3z
    M7,11.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S7.83,11.5,7,11.5z M12,11.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5
    s1.5,0.67,1.5,1.5S12.83,11.5,12,11.5z M17,11.5c-0.83,0-1.5-0.67-1.5-1.5s0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5S17.83,11.5,17,11.5z"
    />
  </svg>
);

// --- ACCESS CONTROL CONFIGURATION ---
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
    desc: "Your intelligent career architect. Let's take a quick tour of your new workspace and see what you can achieve.",
    icon: Sparkles,
  },
  {
    title: "AI Career Chat",
    desc: "Chat with a Principal Software Architect AI. Ask for advice, debugging help, or structural career guidance.",
    icon: MessageSquare,
  },
  {
    title: "Full-Duplex Voice",
    desc: "Engage in real-time, interruptible live conversation. Use the Microphone to start the session, and the speech bubble icon will show status. If you speak, the AI will stop and listen.",
    icon: Headphones,
  },
  {
    title: "Career Roadmaps",
    desc: "Generate masterclass-level learning paths for any tech role, complete with estimated durations and YouTube resources.",
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
// SUB-COMPONENT: AI JOB MATCHER
// =========================================================================================
const AIJobMatcher = () => {
  const [userProfile, setUserProfile] = useState("");
  const [jobRole, setJobRole] = useState("");
  const [location, setLocation] = useState("");
  const [matchedJobs, setMatchedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState("");

  const searchAndMatchJobs = async () => {
    if (!userProfile || !jobRole || !genAI) return;
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
              "x-rapidapi-host": "jsearch27.p.rapidapi.com",
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
            job_description: `Looking for a strong ${jobRole} with deep expertise in modern frameworks, strong communication skills, and ability to lead teams. Minimum 3 years experience.`,
            job_apply_link: "#",
          },
          {
            job_title: `Junior ${jobRole}`,
            employer_name: "Quantum Dynamics",
            job_description: `Entry level position. Must know basic principles of development, eager to learn, familiar with agile methodologies.`,
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

      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const prompt = `Act as an expert AI Recruiter utilizing semantic similarity embeddings. Evaluate the match between this User Profile and the provided Job Listings. USER PROFILE: "${userProfile}" JOB LISTINGS (JSON): ${JSON.stringify(jobsPayload)} Task: Rank these jobs strictly by how well they semantically match the User Profile. Output ONLY a valid JSON array of objects with the following exact structure: [{"title": "Job Title", "company": "Company Name", "matchScore": <Number 0-100>, "reason": "1 concise sentence explaining exactly why this is or isn't a good match.", "link": "The job link"}]`;

      const result = await model.generateContent(prompt);
      const rawText = result.response
        .text()
        .replace(/```json|```/g, "")
        .trim();
      let matchedData = JSON.parse(rawText);
      matchedData.sort((a, b) => b.matchScore - a.matchScore);
      setMatchedJobs(matchedData);
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
          <h2 className="font-serif text-4xl text-[#2D2D2D] mb-4 tracking-tight">
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
              className="w-full py-4 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] transition-colors disabled:opacity-50"
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
                    <h3 className="font-serif text-2xl text-[#2D2D2D] mb-1">
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
                    <span className="font-serif text-3xl text-[#2D2D2D]">
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
                  className="text-sm font-medium text-[#2D2D2D] hover:text-[#D97D54] transition-colors flex items-center gap-2"
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
const MarketAnalyzer = () => {
  const [role, setRole] = useState("");
  const [baseLocation, setBaseLocation] = useState("");
  const [targetLocation, setTargetLocation] = useState("");
  const [marketData, setMarketData] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeMarket = async () => {
    if (!role || !baseLocation || !genAI) return;
    setLoading(true);
    setMarketData(null);

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const prompt = `You are an advanced AI regression model trained on global job market data. Perform a comprehensive salary and market demand prediction for the role: "${role}". Base Location: "${baseLocation}". ${targetLocation ? `Target Comparison Location: "${targetLocation}".` : ""} Provide expected average salary range (USD), demand level, and projected growth rate (5 yrs). Return STRICTLY a JSON object with this exact structure: {"base": {"location": "${baseLocation}", "salaryUSD": "$X - $Y", "demand": "High/Medium/Low", "growthRate": "X%"}, "target": {"location": "${targetLocation}", "salaryUSD": "$X - $Y", "demand": "High/Medium/Low", "growthRate": "X%"}, "insights": ["Insight 1", "Insight 2", "Insight 3"], "verdict": "One sentence final recommendation."}`;

      const result = await model.generateContent(prompt);
      const data = JSON.parse(
        result.response
          .text()
          .replace(/```json|```/g, "")
          .trim(),
      );
      setMarketData(data);
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
          <h2 className="font-serif text-3xl text-[#2D2D2D] flex items-center gap-2">
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
          <p className="font-serif text-4xl text-[#2D2D2D]">{data.salaryUSD}</p>
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
          <h2 className="font-serif text-4xl text-[#2D2D2D] mb-4 tracking-tight">
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
            className="px-8 py-3 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] transition disabled:opacity-50"
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
              <h3 className="font-serif text-2xl text-[#2D2D2D] mb-8">
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
                <p className="font-serif text-lg text-[#2D2D2D]">
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
// SUB-COMPONENT: BILLING DASHBOARD
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
          <div className="w-16 h-16 bg-[#F3F1EC] text-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-6">
            <Crown strokeWidth={1.5} className="w-8 h-8 text-[#D97D54]" />
          </div>
          <h2 className="font-serif text-4xl text-[#2D2D2D] mb-4">
            You are a Pro User
          </h2>
          <p className="text-[#7A756D] text-lg leading-relaxed mb-12">
            Unrestricted access to all advanced models, resume architectures,
            job matching, and priority processing.
          </p>
          <div className="bg-[#FAF9F6] border border-[#E8E6DF] rounded-2xl p-8 max-w-md mx-auto">
            <h3 className="font-serif text-xl text-[#2D2D2D] mb-2">
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
                  className="px-6 bg-[#2D2D2D] text-[#FAF9F6] rounded-xl text-sm font-medium"
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
          <h2 className="font-serif text-3xl text-[#2D2D2D] mb-4">
            Verification Pending
          </h2>
          <p className="text-[#7A756D] text-sm leading-relaxed mb-8">
            Your transaction ID{" "}
            <span className="font-mono bg-[#F3F1EC] px-2 py-1 rounded text-[#2D2D2D]">
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
            className="flex items-center gap-2 text-[#7A756D] hover:text-[#2D2D2D] text-sm mb-8 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Plans
          </button>
          <h2 className="font-serif text-3xl text-[#2D2D2D] mb-2">
            Complete Upgrade
          </h2>
          <p className="text-[#7A756D] text-sm mb-8">
            Total:{" "}
            <span className="text-[#2D2D2D] font-medium">
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
              className="w-full py-4 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] disabled:opacity-50 transition"
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
        <h2 className="font-serif text-4xl text-[#2D2D2D] mb-4 tracking-tight">
          Select your workspace plan.
        </h2>
        <p className="text-[#7A756D] text-lg font-sans">
          Elevate your capabilities with advanced models and tools.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
        <div className="bg-white p-10 rounded-3xl border border-[#E8E6DF] flex flex-col items-center text-center">
          <h3 className="font-serif text-2xl text-[#2D2D2D] mb-2">Basic</h3>
          <p className="text-sm text-[#7A756D] mb-8">Standard access</p>
          <p className="font-sans text-4xl text-[#2D2D2D] mb-10 font-medium">
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
          <h3 className="font-serif text-2xl text-[#2D2D2D] mb-2">Essential</h3>
          <p className="text-sm text-[#7A756D] mb-8">
            AI Roadmaps & Forecaster
          </p>
          <p className="font-sans text-4xl text-[#2D2D2D] mb-10 font-medium">
            $9<span className="text-sm text-[#7A756D]">/mo</span>
          </p>
          <button
            onClick={() => setSelectedPlan("essential")}
            className="w-full py-3 bg-[#D97D54] text-white rounded-full text-sm font-medium hover:bg-[#C26B45] transition"
          >
            Upgrade
          </button>
        </div>

        <div className="bg-[#2D2D2D] p-10 rounded-3xl border border-[#1A1A1A] flex flex-col items-center text-center">
          <h3 className="font-serif text-2xl text-[#FAF9F6] mb-2">Pro</h3>
          <p className="text-sm text-[#A8A39D] mb-8">Full access & Audits</p>
          <p className="font-sans text-4xl text-[#FAF9F6] mb-10 font-medium">
            $19<span className="text-sm text-[#A8A39D]">/mo</span>
          </p>
          <button
            onClick={() => setSelectedPlan("pro")}
            className="w-full py-3 bg-[#FAF9F6] text-[#2D2D2D] rounded-full text-sm font-medium hover:bg-white transition"
          >
            Get Pro
          </button>
        </div>
      </div>
    </div>
  );
};

// =========================================================================================
// SUB-COMPONENT: E-LEARNING STORE
// =========================================================================================
const ELearningStore = ({ recommendedTopic = "", isAnalyzing = false }) => {
  const [videos, setVideos] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="h-full flex flex-col bg-[#FAF9F6] overflow-y-auto no-scrollbar p-8 md:p-16">
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <h2 className="font-serif text-4xl text-[#2D2D2D] mb-2">Library</h2>
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
              <div>
                <a
                  href={`https://www.youtube.com/watch?v=${videos[0].id.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block relative w-full h-[400px] rounded-3xl overflow-hidden group"
                >
                  <img
                    src={videos[0].snippet.thumbnails.high.url}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    alt="Featured"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A]/90 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 p-10 w-full md:w-2/3">
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
                </a>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {videos.slice(1).map((video) => (
                <a
                  key={video.id.videoId}
                  href={`https://www.youtube.com/watch?v=${video.id.videoId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex flex-col"
                >
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-[#F3F1EC] mb-4 border border-[#E8E6DF]">
                    <img
                      src={video.snippet.thumbnails.high.url}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <h3 className="font-sans text-sm font-medium text-[#2D2D2D] leading-snug line-clamp-2 mb-1">
                    {video.snippet.title}
                  </h3>
                  <p className="text-xs text-[#7A756D]">
                    {video.snippet.channelTitle}
                  </p>
                </a>
              ))}
            </div>
          </div>
        )}
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
        <h2 className="font-serif text-3xl text-[#2D2D2D] mb-2">
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
          className="text-sm font-medium text-[#4A4A4A] hover:text-[#2D2D2D] underline underline-offset-4 decoration-[#E8E6DF]"
        >
          Send another
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FAF9F6]">
      <div className="max-w-lg mx-auto w-full">
        <h2 className="font-serif text-4xl text-[#2D2D2D] mb-4 tracking-tight">
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
            className="w-full py-4 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] transition disabled:opacity-50"
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
    if (!file || !genAI) return;
    setLoading(true);
    try {
      const resumeText = await extractText(file);
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
      });
      const prompt = `You are a Senior Technical Recruiter at FAANG. Conduct a deep-dive review of this resume. Resume Text: "${resumeText}". Output STRICTLY in this format: Score: <number 0-100>\nCritical Flaws:\n- <Point 1>\nTechnical Gaps:\n- <Point 1>\nImpact Metrics:\n- <Point 1>\nFormatting:\n- <Point 1>`;
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
    <div className="h-full flex flex-col p-8 md:p-16 overflow-y-auto no-scrollbar bg-[#FAF9F6]">
      <div className="max-w-3xl mx-auto w-full">
        <h2 className="font-serif text-4xl text-[#2D2D2D] mb-4 tracking-tight">
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
          <p className="text-lg font-medium text-[#2D2D2D] mb-2">
            {file ? file.name : "Select document (PDF/DOCX)"}
          </p>
          <p className="text-sm text-[#A8A39D]">Powered by Gemini 2.5</p>
        </div>

        <button
          onClick={analyze}
          disabled={!file || loading}
          className="w-full py-4 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] transition disabled:opacity-50"
        >
          {loading ? "Auditing Document..." : "Run Analysis"}
        </button>

        {score !== null && (
          <div className="mt-16 animate-fade-in">
            <div className="flex items-center justify-between mb-8 pb-8 border-b border-[#E8E6DF]">
              <span className="font-serif text-2xl text-[#2D2D2D]">
                Hiring Probability
              </span>
              <span className="font-serif text-5xl text-[#2D2D2D]">
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

  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  const [storeTopic, setStoreTopic] = useState("");
  const [roadmapInput, setRoadmapInput] = useState("");
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);

  const [emailInput, setEmailInput] = useState("");
  const [emailImage, setEmailImage] = useState(null);
  const [emailResult, setEmailResult] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // --- MODEL 1: SIMPLE TRANSCRIPTION (VOICE TO TEXT) ---
  const [isDictating, setIsDictating] = useState(false);
  const dictationRecognitionRef = useRef(null);

  // --- MODEL 2: FULL DUPLEX LIVE AUDIO (INTERACTIVE) ---
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState("idle");
  const [transcriptResult, setTranscriptResult] = useState("");

  const isVoiceModeRef = useRef(false);
  const voiceStatusRef = useRef("idle");
  const silenceTimerRef = useRef(null);
  const transcriptRef = useRef("");
  const interactiveRecognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Refs for state used inside speech event handlers (prevents stale closure bugs)
  const activeChatIdRef = useRef(activeChatId);
  const messagesRef = useRef(messages);

  const userPlan = user?.plan || "basic";
  const hasAccess = PLAN_ACCESS[activeTab]?.includes(userPlan);

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

  // =========================================================================
  // SETUP FOR MODEL 1: SIMPLE DICTATION
  // =========================================================================
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
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        }
      }
      if (final) {
        // Appends the spoken text directly into the main chat input
        setInput((prev) => (prev + " " + final).trim());
      }
    };

    recognition.onerror = (e) => {
      if (e.error !== "no-speech") setIsDictating(false);
    };

    recognition.onend = () => {
      // Auto restart if still actively dictating
      if (isDictating) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    dictationRecognitionRef.current = recognition;
  }, [isDictating]);

  const toggleDictation = () => {
    if (isVoiceMode)
      return alert("Please close the Interactive Audio Session first.");
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

  // =========================================================================
  // SETUP FOR MODEL 2: INTERACTIVE LIVE CONVERSATION
  // =========================================================================
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

      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
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

    recognition.onerror = (event) => {
      if (event.error !== "no-speech") {
        console.error("Speech recognition error", event.error);
      }
    };

    recognition.onend = () => {
      if (isVoiceModeRef.current) {
        try {
          recognition.start();
        } catch (e) {}
      }
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
      if (!interactiveRecognitionRef.current) {
        alert(
          "Live speech recognition is not supported in this browser. Try Chrome.",
        );
        return;
      }
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
    if (!textToSend.trim() || !user || !genAI) return;
    setVoiceStatus("thinking");
    setChatLoading(true);

    let cid = activeChatIdRef.current;
    if (!cid) {
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: textToSend.slice(0, 25) + "...",
        createdAt: serverTimestamp(),
      });
      cid = ref.id;
      setActiveChatId(ref.id);
      activeChatIdRef.current = ref.id;
    }

    await addDoc(collection(db, "users", user.uid, "chats", cid, "messages"), {
      text: textToSend,
      sender: "user",
      createdAt: serverTimestamp(),
    });

    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are Len, an interactive AI career assistant. Because this is a live audio conversation, your answers MUST be extremely short—no more than 1 or 2 conversational sentences. Do not use formatting, lists, or code blocks. Always reply like a human talking on a phone call. Address the user directly.`,
      });

      const recentMessages = messagesRef.current.slice(-10);
      const history = recentMessages.map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }],
      }));

      const result = await model.startChat({ history }).sendMessage(textToSend);
      const aiResponseText = result.response.text();

      await addDoc(
        collection(db, "users", user.uid, "chats", cid, "messages"),
        {
          text: aiResponseText,
          sender: "ai",
          createdAt: serverTimestamp(),
        },
      );

      speakText(aiResponseText);
    } catch (e) {
      console.error(e);
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
    if (!textToSend.trim() || !user || !genAI) return;
    setInput("");

    // Auto-stop dictation if the user sends the message
    if (isDictating) {
      setIsDictating(false);
      dictationRecognitionRef.current?.stop();
    }

    setChatLoading(true);

    let cid = activeChatIdRef.current;
    if (!cid) {
      const ref = await addDoc(collection(db, "users", user.uid, "chats"), {
        title: textToSend.slice(0, 25) + "...",
        createdAt: serverTimestamp(),
      });
      cid = ref.id;
      setActiveChatId(ref.id);
      activeChatIdRef.current = ref.id;
    }

    await addDoc(collection(db, "users", user.uid, "chats", cid, "messages"), {
      text: textToSend,
      sender: "user",
      createdAt: serverTimestamp(),
    });
    try {
      const model = genAI.getGenerativeModel({
        model: "gemini-2.5-flash",
        systemInstruction: `You are a Principal Software Architect. Be concise and expert. The user you are talking to is named ${user?.displayName || "User"}. Remember their name and context. Never say you are an AI. Always respond as a human expert. If you don't know something, say you don't know but suggest how to find out. Use the user's name occasionally to build rapport. Never say I am a large language model, trained by Google. Always provide actionable advice. Tailor your responses to the user's background and goals. Keep it friendly and professional. Never say you are an AI model trained by Google for this say i am trained by SSVA.LTD .`,
      });

      const recentMessages = messagesRef.current.slice(-10);
      const history = recentMessages.map((m) => ({
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
    if (!roadmapInput || !genAI) return;
    setRoadmapLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
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
      (s) => setRoadmaps(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
  }, [user]);

  useEffect(() => {
    if (activeTab === "store") {
      const recentChats = chats
        .slice(0, 5)
        .map((c) => c.title)
        .join(", ");
      if (!recentChats) return;
      genAI
        .getGenerativeModel({ model: "gemini-2.5-flash" })
        .generateContent(
          `Recent Chats: ${recentChats}. Output SINGLE relevant tech skill to learn.`,
        )
        .then((r) => setStoreTopic(r.response.text().trim()))
        .catch(console.error);
    }
  }, [activeTab]);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500&family=Inter:wght@300;400;500;600&display=swap');
        .font-serif { font-family: 'Newsreader', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .animate-fade-in { animation: fadeIn 0.5s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="h-screen w-screen flex bg-[#FAF9F6] text-[#2D2D2D] font-sans overflow-hidden selection:bg-[#E8E6DF] selection:text-[#2D2D2D]">
        {/* --- ONBOARDING TOUR OVERLAY --- */}
        {showTour && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-[#2D2D2D]/30 backdrop-blur-sm"
              onClick={completeTour}
            ></div>
            <div className="relative w-full max-w-lg bg-[#FAF9F6] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] border border-[#E8E6DF] p-10 animate-fade-in text-center">
              <div className="w-16 h-16 bg-[#F3F1EC] text-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-6">
                {React.createElement(TOUR_STEPS[tourStep].icon, {
                  strokeWidth: 1.5,
                  className: "w-8 h-8 text-[#D97D54]",
                })}
              </div>
              <h2 className="font-serif text-3xl text-[#2D2D2D] mb-4">
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
                      className={`w-2 h-2 rounded-full transition-colors ${i === tourStep ? "bg-[#2D2D2D]" : "bg-[#E8E6DF]"}`}
                    ></div>
                  ))}
                </div>
                <button
                  onClick={nextTourStep}
                  className="px-6 py-2.5 bg-[#2D2D2D] text-[#FAF9F6] rounded-xl text-sm font-medium hover:bg-[#1A1A1A] transition-colors"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? "Get Started" : "Next"}
                </button>
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
              onClick={createChat}
              className="p-2 text-[#7A756D] hover:bg-[#E8E6DF] rounded-lg transition-colors"
            >
              <Plus strokeWidth={1.5} className="w-5 h-5" />
            </button>
          </div>

          <div className="px-3 mt-4 space-y-1">
            {[
              { id: "chat", icon: MessageSquare, label: "Chat" },
              { id: "roadmap", icon: BookOpen, label: "Roadmaps" },
              { id: "market", icon: TrendingUp, label: "Market Forecaster" },
              { id: "jobs", icon: Target, label: "Job Matcher" },
              { id: "resume", icon: FileText, label: "Resume Architect" },
              { id: "email", icon: Mail, label: "Email Studio" },
              { id: "store", icon: LayoutGrid, label: "Library" },
              { id: "feedback", icon: Heart, label: "Feedback" },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  if (t.id !== "roadmap") setActiveRoadmap(null);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${activeTab === t.id && !activeRoadmap ? "bg-[#FAF9F6] text-[#2D2D2D] font-medium shadow-[0_1px_3px_rgb(0,0,0,0.02)] border border-[#E8E6DF]" : "text-[#7A756D] hover:bg-[#E8E6DF]/50"}`}
              >
                <t.icon strokeWidth={1.5} className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar px-3 mt-6">
            <h3 className="text-[10px] font-semibold text-[#A8A39D] uppercase tracking-widest px-3 mb-2">
              History
            </h3>
            {(activeTab === "roadmap" || activeRoadmap ? roadmaps : chats).map(
              (item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (item.role) {
                      setActiveRoadmap(item);
                      setActiveTab("roadmap");
                    } else {
                      setActiveChatId(item.id);
                      setActiveTab("chat");
                    }
                  }}
                  className={`group flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${(item.role && activeRoadmap?.id === item.id) || (!item.role && activeChatId === item.id) ? "bg-[#E8E6DF] text-[#2D2D2D]" : "text-[#7A756D] hover:bg-[#E8E6DF]/50"}`}
                >
                  <span className="truncate pr-2">
                    {item.role || item.title}
                  </span>
                  <Trash2
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.role ? "roadmaps" : "chats", item.id);
                    }}
                    strokeWidth={1.5}
                    className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 hover:text-red-400"
                  />
                </div>
              ),
            )}
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
                    <p className="text-sm font-medium text-[#2D2D2D] truncate">
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
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#2D2D2D] rounded-xl transition-colors"
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
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#2D2D2D] rounded-xl transition-colors"
                    >
                      <Settings strokeWidth={1.5} className="w-4 h-4" />{" "}
                      Settings
                    </button>
                  </div>
                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        if (logout) logout();
                        setProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 text-sm text-[#4A4A4A] hover:bg-[#F3F1EC] hover:text-[#2D2D2D] rounded-xl transition-colors"
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
              <div className="w-6 h-6 bg-[#D1CEC7] rounded-full flex items-center justify-center text-[10px] font-medium text-[#2D2D2D] shrink-0">
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

          {activeTab === "chat" ? (
            <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 h-full relative">
              <div className="flex-1 overflow-y-auto no-scrollbar py-12 px-2 md:px-8">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center -mt-10 animate-fade-in">
                    <h1 className="font-serif text-4xl md:text-5xl text-[#2D2D2D] mb-4">
                      {getGreeting()}
                      {user?.displayName
                        ? `, ${user.displayName.split(" ")[0]}`
                        : "."}
                    </h1>
                    <p className="text-[#7A756D] text-lg mb-12">
                      How can I assist your career today?
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
                      {SUGGESTIONS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => sendChat(s.prompt)}
                          className="px-5 py-2.5 rounded-full border border-[#E8E6DF] bg-transparent text-sm text-[#7A756D] hover:bg-[#F3F1EC] hover:text-[#2D2D2D] transition-colors"
                        >
                          {s.prompt}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-10 pb-10">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex gap-4 animate-fade-in w-full ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {m.sender !== "user" && (
                          <div className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center mt-1 bg-transparent">
                            <Sparkles
                              strokeWidth={1.5}
                              className="w-5 h-5 text-[#D97D54]"
                            />
                          </div>
                        )}
                        <div
                          className={`text-[15px] leading-relaxed ${m.sender === "user" ? "bg-[#F3F1EC] px-5 py-3 rounded-2xl max-w-[85%] text-[#2D2D2D]" : "text-[#4A4A4A] flex-1"}`}
                        >
                          {m.text}
                        </div>
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="flex gap-4 justify-start animate-fade-in">
                        <div className="w-6 h-6 shrink-0 rounded-md flex items-center justify-center mt-1 bg-transparent">
                          <Sparkles
                            strokeWidth={1.5}
                            className="w-5 h-5 text-[#D97D54] opacity-50"
                          />
                        </div>
                        <div className="text-sm text-[#A8A39D] flex items-center gap-1">
                          Thinking<span className="animate-pulse">...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef}></div>
                  </div>
                )}
              </div>

              {/* INPUT AREA */}
              <div className="pb-8 pt-4 bg-gradient-to-t from-[#FAF9F6] via-[#FAF9F6] to-transparent sticky bottom-0 z-10 w-full">
                {/* --- LIVE FULL DUPLEX AUDIO PANEL --- */}
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
                            : voiceStatus === "speaking"
                              ? "Len is speaking... (Speak to interrupt)"
                              : "Listening... (Auto-sends when you pause)"}
                        </span>
                      </div>
                      <button
                        onClick={toggleVoiceMode}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E8F0FE] text-[#1A73E8] rounded-full text-sm font-medium hover:bg-[#D2E3FC] transition-colors"
                      >
                        <span className="flex gap-0.5">
                          <span
                            className="w-1 h-1 bg-[#1A73E8] rounded-full animate-bounce"
                            style={{ animationDelay: "0ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-[#1A73E8] rounded-full animate-bounce"
                            style={{ animationDelay: "150ms" }}
                          ></span>
                          <span
                            className="w-1 h-1 bg-[#1A73E8] rounded-full animate-bounce"
                            style={{ animationDelay: "300ms" }}
                          ></span>
                        </span>
                        Cancel
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        value={transcriptResult}
                        readOnly
                        placeholder="Live transcript will appear here..."
                        className="w-full h-24 text-sm text-[#4A4A4A] leading-relaxed p-4 bg-[#F3F1EC]/50 rounded-xl border border-[#E8E6DF] resize-none outline-none focus:border-[#D1CEC7]"
                      />
                    </div>
                  </div>
                )}

                {/* --- CHAT INPUT BOX --- */}
                <div className="relative rounded-3xl bg-[#F3F1EC] border border-[#E8E6DF] focus-within:border-[#D1CEC7] transition-all flex items-center gap-1.5 pl-2">
                  {/* MODEL 1: DICTATION (Microphone) */}
                  <button
                    onClick={toggleDictation}
                    disabled={chatLoading || isVoiceMode}
                    title="Simple Voice Typing"
                    className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                      isDictating
                        ? "text-blue-500 bg-blue-50"
                        : "text-[#7A756D] hover:bg-[#E8E6DF]"
                    }`}
                  >
                    {isDictating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mic strokeWidth={1.5} className="w-5 h-5" />
                    )}
                  </button>

                  {/* MODEL 2: INTERACTIVE AUDIO (Headphones) */}
                  <button
                    onClick={toggleVoiceMode}
                    disabled={chatLoading || isDictating}
                    title="Live Audio Session"
                    className={`p-2 rounded-full flex items-center justify-center transition-colors ${
                      isVoiceMode
                        ? "text-red-500 bg-red-50"
                        : "text-[#7A756D] hover:bg-[#E8E6DF]"
                    }`}
                  >
                    <Headphones strokeWidth={1.5} className="w-5 h-5" />
                  </button>

                  <textarea
                    className="flex-1 bg-transparent border-none rounded-3xl p-5 pl-1 pr-14 text-[15px] text-[#2D2D2D] outline-none resize-none placeholder:text-[#A8A39D]"
                    placeholder="Ask anything about your career..."
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    disabled={chatLoading}
                    style={{ minHeight: "60px", maxHeight: "200px" }}
                  />
                  <button
                    onClick={() => sendChat()}
                    disabled={!input.trim()}
                    className="absolute right-3 bottom-3 p-2 bg-[#2D2D2D] text-[#FAF9F6] rounded-full hover:bg-[#1A1A1A] transition disabled:opacity-30 disabled:bg-[#D1CEC7] disabled:text-white"
                  >
                    <ArrowRight strokeWidth={2} className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center mt-3 text-[10px] text-[#A8A39D]">
                  LenAi can make mistakes. Consider verifying important
                  information.
                </div>
              </div>
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
                  <h2 className="font-serif text-3xl text-[#2D2D2D] mb-8">
                    Drafting Board
                  </h2>
                  <div className="space-y-6">
                    <textarea
                      className="w-full h-48 bg-white border border-[#E8E6DF] rounded-2xl p-5 text-[#2D2D2D] text-sm outline-none resize-none shadow-[0_2px_10px_rgb(0,0,0,0.01)] placeholder:text-[#A8A39D]"
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
                      className="w-full py-4 bg-[#2D2D2D] text-[#FAF9F6] rounded-2xl font-medium text-sm hover:bg-[#1A1A1A] transition disabled:opacity-50"
                    >
                      {emailLoading
                        ? "Polishing Draft..."
                        : "Generate Professional Draft"}
                    </button>
                  </div>
                </div>
                <div className="w-1/2 p-12 overflow-y-auto no-scrollbar bg-white">
                  <h2 className="font-serif text-3xl text-[#2D2D2D] mb-8">
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
                    <h2 className="font-serif text-4xl text-[#2D2D2D] mb-4">
                      Career Architect
                    </h2>
                    <p className="text-[#7A756D] mb-12 text-lg">
                      Design a masterclass-level learning path for any role.
                    </p>
                    <div className="flex gap-3 bg-white p-2 rounded-2xl border border-[#E8E6DF] shadow-[0_2px_15px_rgb(0,0,0,0.02)]">
                      <input
                        className="flex-1 p-4 bg-transparent outline-none text-[#2D2D2D] text-sm placeholder:text-[#A8A39D]"
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
                        className="px-8 bg-[#2D2D2D] text-[#FAF9F6] rounded-xl text-sm font-medium hover:bg-[#1A1A1A] transition disabled:opacity-50"
                      >
                        {roadmapLoading ? "Planning..." : "Create"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto animate-fade-in">
                    <h1 className="font-serif text-4xl text-[#2D2D2D] mb-12 capitalize">
                      {activeRoadmap.role} Curriculum
                    </h1>
                    <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-px before:bg-[#E8E6DF]">
                      {activeRoadmap.steps.map((s, i) => (
                        <div key={i} className="relative pl-10">
                          <div className="absolute left-0 top-3 w-6 h-6 rounded-full bg-[#FAF9F6] border border-[#E8E6DF] flex items-center justify-center text-[10px] font-medium text-[#7A756D]">
                            {s.step}
                          </div>
                          <div className="bg-white border border-[#E8E6DF] p-8 rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.01)]">
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="font-serif text-2xl text-[#2D2D2D]">
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
                              {s.resources.map((r, idx) => (
                                <a
                                  key={idx}
                                  href={`https://www.youtube.com/results?search_query=${r}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs font-medium border border-[#E8E6DF] px-3 py-1.5 rounded-lg text-[#7A756D] hover:bg-[#F3F1EC] transition flex items-center gap-1.5"
                                >
                                  <Play strokeWidth={1.5} className="w-3 h-3" />{" "}
                                  {r}
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
            </FeatureWrapper>
          ) : (
            <FeatureWrapper
              isLocked={!hasAccess}
              featureName={activeTab}
              onUpgradeClick={() => setActiveTab("billing")}
            >
              {activeTab === "market" && <MarketAnalyzer />}
              {activeTab === "jobs" && <AIJobMatcher />}
              {activeTab === "resume" && <ResumeAnalyzer />}
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
              className="absolute inset-0 bg-[#2D2D2D]/20 backdrop-blur-sm"
              onClick={() => setIsSettingsOpen(false)}
            ></div>
            <div className="relative w-full max-w-4xl bg-[#FAF9F6] rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-[#E8E6DF] flex flex-col md:flex-row overflow-hidden animate-fade-in max-h-[85vh]">
              <div className="w-full md:w-64 bg-[#F3F1EC] border-r border-[#E8E6DF] p-6 flex flex-col">
                <h2 className="font-serif text-2xl text-[#2D2D2D] mb-8">
                  Settings
                </h2>
                <nav className="space-y-1">
                  {[
                    { id: "general", label: "General", icon: Settings },
                    { id: "account", label: "Account", icon: UserCheck },
                    { id: "api", label: "API Keys", icon: Lock },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-colors ${settingsTab === tab.id ? "bg-[#FAF9F6] text-[#2D2D2D] font-medium shadow-[0_1px_3px_rgb(0,0,0,0.02)] border border-[#E8E6DF]" : "text-[#7A756D] hover:bg-[#E8E6DF]/50"}`}
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
                    <h3 className="font-serif text-3xl text-[#2D2D2D] mb-8">
                      General
                    </h3>
                    <div className="space-y-8">
                      <div>
                        <label className="block text-sm font-medium text-[#2D2D2D] mb-3">
                          Interface Theme
                        </label>
                        <div className="flex flex-col gap-3">
                          <label className="flex items-center gap-3 text-sm text-[#4A4A4A] cursor-pointer p-3 rounded-xl border border-[#E8E6DF] bg-[#FAF9F6]">
                            <input
                              type="radio"
                              name="theme"
                              defaultChecked
                              className="accent-[#2D2D2D] w-4 h-4"
                            />
                            <span>Alabaster (Light)</span>
                          </label>
                          <label className="flex items-center gap-3 text-sm text-[#A8A39D] cursor-not-allowed p-3 rounded-xl border border-[#E8E6DF] bg-white opacity-60">
                            <input
                              type="radio"
                              name="theme"
                              disabled
                              className="accent-[#2D2D2D] w-4 h-4"
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
                        <h4 className="text-sm font-medium text-[#2D2D2D] mb-1">
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
                    <h3 className="font-serif text-3xl text-[#2D2D2D] mb-8">
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
                          className="w-full px-5 py-3.5 bg-[#2D2D2D] text-[#FAF9F6] text-sm font-medium rounded-xl hover:bg-[#1A1A1A] transition-colors flex items-center justify-center gap-2"
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

                {settingsTab === "api" && (
                  <div className="max-w-xl animate-fade-in">
                    <h3 className="font-serif text-3xl text-[#2D2D2D] mb-6">
                      API Configuration
                    </h3>
                    <p className="text-sm text-[#7A756D] mb-8 leading-relaxed">
                      PathifyAI uses system-provided API keys by default. If you
                      are experiencing rate limits, you can configure your own
                      personal keys here. Keys are stored locally in your
                      browser.
                    </p>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                          Google Gemini API Key
                        </label>
                        <input
                          type="password"
                          placeholder="AIzaSy..."
                          className="w-full bg-white border border-[#E8E6DF] text-[#2D2D2D] px-4 py-3 rounded-xl text-sm focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-[#2D2D2D] mb-2">
                          JSearch RapidAPI Key (Job Matcher)
                        </label>
                        <input
                          type="password"
                          placeholder="Enter your key..."
                          className="w-full bg-white border border-[#E8E6DF] text-[#2D2D2D] px-4 py-3 rounded-xl text-sm focus:border-[#D1CEC7] outline-none shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                        />
                      </div>
                      <div className="pt-4">
                        <button className="px-6 py-3 bg-[#2D2D2D] text-[#FAF9F6] text-sm font-medium rounded-xl hover:bg-[#1A1A1A] transition-colors">
                          Save API Keys
                        </button>
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
