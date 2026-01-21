import { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  MessageSquare,
  Map,
  Send,
  Sparkles,
  User,
  Bot,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

// 🔴 YOUR API KEY
const API_KEY = "AIzaSyBxOoJ9w2wD0OIzz0ypvzcdio5Ki0inuHw";

// --- LANDING PAGE COMPONENT ---
const LandingPage = ({ onStart }) => {
  return (
    <div className="min-h-screen text-slate-100 font-display">
      {/* Sticky Navigation */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-background-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
              <span className="material-symbols-outlined font-bold">
                auto_awesome
              </span>
            </div>
            <span className="text-xl font-black tracking-tight uppercase">
              Career<span className="text-primary">AI</span>
            </span>
          </div>
          <div className="hidden md:flex items-center gap-10">
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Platform
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Solutions
            </a>
            <a
              className="text-sm font-medium hover:text-primary transition-colors"
              href="#"
            >
              Resources
            </a>
          </div>
          <div className="flex items-center gap-4">
            <button className="text-sm font-bold px-5 py-2 hover:text-primary transition-colors">
              Log In
            </button>
            <button
              onClick={onStart}
              className="bg-primary text-white text-sm font-bold px-6 py-2.5 rounded-lg shadow-[0_0_20px_rgba(19,91,236,0.3)] hover:scale-105 transition-all"
            >
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-20 px-6 overflow-hidden min-h-[90vh] flex items-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full hero-glow pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest">
              <span className="size-2 bg-primary rounded-full animate-pulse"></span>
              Next-Gen Career Intelligence
            </div>
            <h1 className="text-6xl md:text-7xl font-black leading-[1.1] tracking-tight text-white">
              Architect Your Future with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                Precision AI
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-xl leading-relaxed">
              From student to specialist—data-driven career paths tailored to
              your unique potential. Leverage world-class AI to navigate your
              professional journey.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={onStart}
                className="px-8 py-4 bg-primary text-white font-bold rounded-xl shadow-lg hover:shadow-primary/40 transition-all flex items-center gap-2"
              >
                Start Free Analysis
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </button>
              <button className="px-8 py-4 glass-panel text-white font-bold rounded-xl hover:bg-white/10 transition-all">
                View Demo
              </button>
            </div>
            <div className="flex items-center gap-6 pt-4">
              <div className="flex -space-x-3">
                <img
                  className="w-10 h-10 rounded-full border-2 border-background-dark object-cover"
                  src="https://randomuser.me/api/portraits/men/32.jpg"
                  alt="User"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-background-dark object-cover"
                  src="https://randomuser.me/api/portraits/women/44.jpg"
                  alt="User"
                />
                <img
                  className="w-10 h-10 rounded-full border-2 border-background-dark object-cover"
                  src="https://randomuser.me/api/portraits/men/86.jpg"
                  alt="User"
                />
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Trusted by 12,000+ early professionals
              </p>
            </div>
          </div>
          <div className="relative hidden lg:block">
            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full"></div>
            <div className="relative glass-panel p-12 rounded-[3rem] border-white/10 shadow-2xl flex items-center justify-center">
              <div className="size-80 rounded-full bg-gradient-to-tr from-primary to-cyan-400 flex items-center justify-center ai-sphere-glow animate-pulse">
                <div className="size-64 rounded-full bg-background-dark flex items-center justify-center overflow-hidden relative">
                  <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_50%_50%,#135bec,transparent_70%)]"></div>
                  <span className="material-symbols-outlined text-8xl text-white opacity-90">
                    psychology
                  </span>
                </div>
              </div>
              <div className="absolute top-10 right-10 glass-panel px-4 py-2 rounded-lg text-xs font-bold text-cyan-400 border-cyan-500/30">
                SKILL_SYNTHESIS_V2
              </div>
              <div className="absolute bottom-10 left-10 glass-panel px-4 py-2 rounded-lg text-xs font-bold text-primary border-primary/30">
                MARKET_PREDICT_AI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem vs Solution Section */}
      <section className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              The Career Maze vs. The AI Advantage
            </h2>
            <div className="h-1 w-20 bg-primary mx-auto rounded-full"></div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="glass-panel p-10 rounded-3xl border-red-500/10 hover:border-red-500/30 transition-all group">
              <div className="size-14 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-500 mb-8">
                <span className="material-symbols-outlined text-3xl">
                  error
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                The Problem: Choice Paralysis
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Outdated counseling and generic advice leave students
                overwhelmed. 85% of graduates feel unprepared for the actual
                demands of their target industries.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="material-symbols-outlined text-red-500/50 text-lg">
                    close
                  </span>
                  Information overload without context
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-500">
                  <span className="material-symbols-outlined text-red-500/50 text-lg">
                    close
                  </span>
                  Generic "one-size-fits-all" advice
                </li>
              </ul>
            </div>
            <div className="glass-panel p-10 rounded-3xl border-primary/20 hover:border-primary/50 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl -mr-16 -mt-16"></div>
              <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-8 shadow-[0_0_15px_rgba(19,91,236,0.2)]">
                <span className="material-symbols-outlined text-3xl">
                  verified
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">
                The Solution: AI Clarity
              </h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                We transform raw data into a bespoke roadmap. Our AI analyzes
                10M+ job postings and millions of professional paths to find
                yours.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="material-symbols-outlined text-primary text-lg">
                    check_circle
                  </span>
                  Personalized skill-gap analysis
                </li>
                <li className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="material-symbols-outlined text-primary text-lg">
                    check_circle
                  </span>
                  Real-time industry demand tracking
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="pt-20 pb-10 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 gap-4">
          <p className="text-xs text-slate-600">
            © 2026 CareerAI Intelligence Inc. All rights reserved.
          </p>
          <div className="flex gap-8 text-xs text-slate-600">
            <a className="hover:text-white transition-colors" href="#">
              Terms
            </a>
            <a className="hover:text-white transition-colors" href="#">
              Privacy
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

// --- MAIN APP COMPONENT ---
function App() {
  const [showLanding, setShowLanding] = useState(true); // Control Landing Page View
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hi! I'm your AI Career Coach. Tell me your goals (e.g., 'I want to be a Full Stack Developer') and I'll help you build a path.",
    },
  ]);
  const [input, setInput] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim()) return;

    setError(null);
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview", // Updated to stable model name
      });

      let prompt = userMsg.text;
      const isRoadmapRequest =
        activeTab === "roadmap" || input.toLowerCase().includes("roadmap");

      if (isRoadmapRequest) {
        prompt = `Create a career roadmap for: "${input}". 
         RETURN ONLY RAW JSON. Do not use Markdown formatting (no \`\`\`json).
         Structure: { "title": "Role Title", "steps": [{ "phase": "Phase Name", "details": "Key topics to learn" }] }`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (isRoadmapRequest) {
        try {
          // Clean JSON string
          const cleanText = text
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();
          const json = JSON.parse(cleanText);
          setRoadmap(json);
          setMessages((prev) => [
            ...prev,
            {
              role: "model",
              text: `I've generated a roadmap for **${json.title}**! Check the Roadmap tab.`,
            },
          ]);
          setActiveTab("roadmap");
        } catch (e) {
          console.error("JSON Error", e);
          setMessages((prev) => [...prev, { role: "model", text }]);
        }
      } else {
        setMessages((prev) => [...prev, { role: "model", text }]);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect. Please check your API Key.");
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "⚠️ Error connecting to AI." },
      ]);
    }
    setLoading(false);
  };

  // If showing landing page, render it
  if (showLanding) {
    return <LandingPage onStart={() => setShowLanding(false)} />;
  }

  // Otherwise, render the Main App
  return (
    <div className="app-container font-display">
      <div className="background-glow"></div>

      <aside className="sidebar">
        <div className="logo-area">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/30">
            <Sparkles className="text-indigo-400" size={24} />
          </div>
          <h2>CareerAI</h2>
        </div>
        <nav className="flex flex-col gap-2">
          <button
            className={`nav-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={20} /> Chat Guidance
          </button>
          <button
            className={`nav-btn ${activeTab === "roadmap" ? "active" : ""}`}
            onClick={() => setActiveTab("roadmap")}
          >
            <Map size={20} /> Career Roadmap
          </button>
        </nav>
      </aside>

      <main className="main-content">
        <AnimatePresence mode="wait">
          {activeTab === "chat" ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="chat-container"
            >
              {error && (
                <div className="m-4 p-3 bg-red-500/10 border border-red-500/20 text-red-200 rounded-lg flex items-center gap-2">
                  <AlertCircle size={18} /> {error}
                </div>
              )}

              <div className="messages-area">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`message ${msg.role}`}>
                    <div className="avatar">
                      {msg.role === "user" ? (
                        <User size={20} className="text-white" />
                      ) : (
                        <Bot size={20} className="text-indigo-400" />
                      )}
                    </div>
                    <div className="bubble">
                      <ReactMarkdown>{msg.text}</ReactMarkdown>
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="message model">
                    <div className="avatar">
                      <Bot size={20} className="text-indigo-400" />
                    </div>
                    <div className="bubble flex gap-2 items-center">
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                      <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="input-wrapper">
                <div className="input-box">
                  <input
                    type="text"
                    placeholder="Ask about your career goals..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    disabled={loading}
                  />
                  <button
                    className="send-btn"
                    onClick={handleSend}
                    disabled={loading}
                  >
                    <Send size={20} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="roadmap"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="messages-area"
            >
              {!roadmap ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-4">
                  <Map size={64} strokeWidth={1} />
                  <p>No roadmap generated yet. Ask for one in the Chat!</p>
                  <button
                    onClick={() => setActiveTab("chat")}
                    className="px-6 py-2 bg-indigo-600 rounded-full text-white hover:bg-indigo-500 transition-colors"
                  >
                    Go to Chat
                  </button>
                </div>
              ) : (
                <div className="timeline-container">
                  <h1 className="text-3xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                    {roadmap.title}
                  </h1>
                  <div className="timeline">
                    {roadmap.steps?.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="timeline-item"
                      >
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <h4>{step.phase}</h4>
                          <p>{step.details}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
