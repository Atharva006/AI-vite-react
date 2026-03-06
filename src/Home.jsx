import React, { useEffect } from "react";
import { useAuth } from "./context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  PlayCircle,
  Search,
  Home as HomeIcon,
  Map,
  BarChart,
  Target,
  FileText,
  Star,
  Plus,
  Filter,
  CheckCircle,
  Briefcase,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Menu,
  MessageSquare,
} from "lucide-react";

const Home = () => {
  const { user, login, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Handle CTA Clicks
  const handleGetStarted = () => {
    if (user) {
      navigate("/LenAi");
    } else {
      login();
    }
  };

  return (
    <>
      {/* Inline styles for custom fonts and patterns to keep it strictly contained in Home.jsx */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        
        .font-display { font-family: 'DM Serif Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        .bg-pattern {
            background-image: radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px);
            background-size: 24px 24px;
        }
        
        .clay-card {
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.5);
        }

        /* Custom Scrollbar for the mock UI */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      <div className="min-h-screen bg-[#F2F0EB] text-[#1A1A1A] font-sans transition-colors duration-300 antialiased overflow-x-hidden">
        {/* Navigation */}
        <nav className="fixed w-full z-50 top-0 px-6 py-4 flex justify-between items-center bg-[#F2F0EB]/80 backdrop-blur-md">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl">
              L
            </div>
            <span className="font-display text-2xl tracking-tight mt-1">
              Vitra
            </span>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                to="/admin"
                className="text-sm font-bold text-blue-600 hover:text-blue-800 transition"
              >
                Admin
              </Link>
            )}
            {user ? (
              <div className="hidden md:flex items-center gap-4 mr-2">
                <span className="text-sm font-medium text-slate-600">
                  {user.displayName || "User"}
                </span>
                <button
                  onClick={logout}
                  className="text-sm font-bold text-red-500 hover:text-red-700 transition"
                >
                  Logout
                </button>
              </div>
            ) : null}
            <button
              onClick={handleGetStarted}
              className="bg-black text-white px-5 py-2.5 rounded-full text-sm font-bold hover:scale-105 transition-transform shadow-lg"
            >
              {user ? "WORKSPACE" : "GET STARTED"}
            </button>
            <button className="p-2 hover:bg-black/5 rounded-full md:hidden">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </nav>

        <main className="pt-32 pb-20 relative bg-pattern">
          {/* Hero Section */}
          <section className="max-w-4xl mx-auto text-center px-4 mb-20">
            <h1 className="font-display text-5xl md:text-7xl leading-tight mb-6 text-[#1A1A1A]">
              Finally, engineer your <br />
              entire career trajectory
            </h1>
            <p className="text-lg text-[#666666] mb-10 max-w-2xl mx-auto font-light leading-relaxed">
              Move beyond generic advice—automatically analyze resumes, generate
              tailored learning roadmaps, and match with the perfect roles using
              AI.
            </p>
            <div className="flex flex-col items-center gap-6">
              <button
                onClick={handleGetStarted}
                className="bg-[#2563EB] text-white text-sm font-bold tracking-wide py-4 px-8 rounded-full shadow-[0_10px_30px_-5px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300 flex items-center gap-2"
              >
                {user ? "ENTER WORKSPACE" : "GET CLAY FREE"}{" "}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button className="flex items-center gap-2 text-xs font-bold text-[#666666] hover:text-[#2563EB] transition-colors uppercase tracking-wider">
                <PlayCircle className="w-4 h-4" />
                Watch Demo
              </button>
            </div>
          </section>

          {/* App Preview Mockup */}
          <section className="max-w-7xl mx-auto px-4 relative z-10 mb-32">
            <div className="bg-white rounded-3xl shadow-[0_35px_60px_-15px_rgba(0,0,0,0.1)] clay-card overflow-hidden border border-gray-100 relative">
              {/* Window Controls */}
              <div className="h-12 border-b border-gray-100 flex items-center px-4 gap-2 bg-slate-50/50">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                  <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                <div className="mx-auto bg-white border border-gray-200 rounded-md px-32 py-1 flex items-center gap-2 shadow-sm">
                  <span className="text-xs font-medium text-slate-400">
                    Vitra.ai/console
                  </span>
                </div>
              </div>

              {/* Mock App Body */}
              <div className="flex h-[700px] md:h-[800px]">
                {/* Sidebar */}
                <div className="w-64 border-r border-gray-100 hidden md:flex flex-col p-4 bg-slate-50/50">
                  <div className="mb-6 flex items-center gap-2 px-2">
                    <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-xs font-bold">
                      L
                    </div>
                    <span className="font-bold text-slate-900">
                      LenAi Console
                    </span>
                  </div>

                  <div className="relative mb-6">
                    <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
                    <input
                      disabled
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-400 shadow-sm"
                      placeholder="Search tools..."
                    />
                  </div>

                  <nav className="space-y-1">
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-900 bg-white rounded-lg shadow-sm border border-slate-100 font-bold">
                      <HomeIcon className="w-4 h-4 text-blue-600" /> Dashboard
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                      <Map className="w-4 h-4 text-slate-400" /> Roadmaps
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                      <Target className="w-4 h-4 text-slate-400" /> Job Matcher
                    </div>
                    <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">
                      <FileText className="w-4 h-4 text-slate-400" /> Resume
                      Architect
                    </div>
                  </nav>

                  <div className="mt-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-3">
                      Active Paths
                    </h3>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        Full Stack Web Dev
                      </div>
                      <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 rounded-lg">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Systematic Trading
                      </div>
                    </div>
                  </div>

                  <div className="mt-auto">
                    <button className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-bold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-100 bg-white shadow-sm transition">
                      <Plus className="w-4 h-4" /> New Session
                    </button>
                  </div>
                </div>

                {/* Main Feed */}
                <div className="flex-1 p-8 overflow-y-auto no-scrollbar bg-white">
                  <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black text-slate-900">
                      Activity Feed
                    </h2>
                    <div className="flex gap-3 text-slate-400">
                      <Filter className="w-5 h-5 cursor-pointer hover:text-slate-600" />
                      <CheckCircle className="w-5 h-5 cursor-pointer hover:text-slate-600" />
                    </div>
                  </div>

                  <div className="space-y-4">
                    {/* Mock Notification 1: Job Match */}
                    <div className="flex gap-4 p-5 hover:bg-slate-50 rounded-2xl transition-colors group border border-transparent hover:border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm text-slate-900 leading-relaxed">
                            AI Semantic Job Matcher found a{" "}
                            <span className="font-bold text-blue-600">
                              92% Match
                            </span>{" "}
                            for{" "}
                            <span className="font-bold">Frontend Engineer</span>{" "}
                            at TechNova Solutions.
                          </p>
                          <span className="text-xs font-bold text-slate-400">
                            2m
                          </span>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                          <Sparkles className="w-3 h-3 text-yellow-500" /> High
                          probability based on React/Node.js skills
                        </div>
                      </div>
                    </div>

                    {/* Mock Notification 2: Resume Score */}
                    <div className="flex gap-4 p-5 bg-emerald-50/50 rounded-2xl transition-colors border-l-4 border-emerald-400 shadow-sm">
                      <div className="w-12 h-12 rounded-xl bg-white text-emerald-600 shadow-sm flex items-center justify-center shrink-0 border border-emerald-100">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm text-slate-900 font-medium">
                            Resume Architect analysis complete. Hiring
                            probability increased to{" "}
                            <span className="font-black text-emerald-600">
                              85%
                            </span>
                            .
                          </p>
                          <span className="text-xs font-bold text-slate-400">
                            1h
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-emerald-100 text-sm text-slate-600 shadow-sm mt-2">
                          <p className="font-bold text-slate-900 mb-1 text-xs uppercase tracking-wider">
                            Critical Fixes Applied:
                          </p>
                          <ul className="list-disc pl-4 space-y-1 text-sm">
                            <li>
                              Quantified Impact Metrics in recent project.
                            </li>
                            <li>
                              Fixed ATS formatting errors in skills section.
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="py-4">
                      <h4 className="text-xs font-black text-slate-300 uppercase tracking-widest">
                        Yesterday
                      </h4>
                    </div>

                    {/* Mock Notification 3: Roadmap */}
                    <div className="flex gap-4 p-5 hover:bg-slate-50 rounded-2xl transition-colors group border border-transparent hover:border-slate-100">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                        <Map className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm text-slate-900">
                            Generated a 12-week masterclass roadmap for{" "}
                            <span className="font-bold">
                              Systematic Trading Strategy Development
                            </span>
                            .
                          </p>
                          <span className="text-xs font-bold text-slate-400">
                            20h
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Sidebar - Analytics */}
                <div className="w-80 border-l border-gray-100 hidden lg:block bg-slate-50/30 p-6 overflow-y-auto no-scrollbar">
                  <div className="flex items-start gap-4 mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white flex items-center justify-center font-black text-2xl shadow-lg">
                      {user?.displayName
                        ? user.displayName[0].toUpperCase()
                        : "A"}
                    </div>
                    <div>
                      <h3 className="font-black text-lg text-slate-900 leading-tight">
                        Atharva Bhosale
                      </h3>
                      <p className="text-xs font-bold text-slate-400 mb-2">
                        SOFTWARE DEV & TRADER
                      </p>
                      <span className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                        Pro Plan
                      </span>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                        Market Demand
                      </h4>
                      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex justify-between items-end mb-2">
                          <p className="text-xs font-bold text-slate-500">
                            Full Stack Dev
                          </p>
                          <span className="text-sm font-black text-emerald-600">
                            High
                          </span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
                          <div className="h-full bg-emerald-500 rounded-full w-[85%]"></div>
                        </div>
                        <p className="text-xl font-black text-slate-900">
                          $120k - $160k
                        </p>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                        Skill Progress
                      </h4>
                      <ul className="space-y-4 relative border-l-2 border-slate-200 ml-2 pl-4">
                        <li className="relative">
                          <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white"></span>
                          <p className="text-sm font-bold text-slate-800">
                            React & Next.js
                          </p>
                          <span className="text-xs font-medium text-slate-400">
                            Intermediate
                          </span>
                        </li>
                        <li className="relative">
                          <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-purple-500 border-2 border-white"></span>
                          <p className="text-sm font-bold text-slate-800">
                            Systematic Methods
                          </p>
                          <span className="text-xs font-medium text-slate-400">
                            Intermediate
                          </span>
                        </li>
                        <li className="relative">
                          <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-slate-300 border-2 border-white"></span>
                          <p className="text-sm font-bold text-slate-800">
                            Python & AI/ML
                          </p>
                          <span className="text-xs font-medium text-slate-400">
                            Learning phase
                          </span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating aesthetic elements */}
              <div className="absolute top-1/4 -right-6 lg:-right-8 w-16 h-16 bg-white rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] flex items-center justify-center transform rotate-6 border border-slate-100 z-20">
                <Briefcase className="w-8 h-8 text-blue-600" />
              </div>
              <div className="absolute bottom-1/3 -left-4 lg:-left-8 w-14 h-14 bg-slate-900 rounded-2xl shadow-[0_10px_30px_-5px_rgba(0,0,0,0.1)] flex items-center justify-center transform -rotate-12 z-20">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </section>

          {/* Value Proposition Section */}
          <section className="max-w-4xl mx-auto text-center px-4 mb-24 mt-32">
            <h2 className="font-display text-4xl md:text-5xl mb-6 text-[#1A1A1A]">
              Everything you need.
              <br />
              Powered by advanced AI.
            </h2>
            <p className="text-lg text-[#666666] max-w-xl mx-auto font-light leading-relaxed">
              From drafting professional emails to generating granular technical
              learning roadmaps. LenAi uses state-of-the-art Gemini 2.5 models
              to elevate your professional profile.
            </p>
          </section>

          {/* Features / Awards */}
          <section className="max-w-3xl mx-auto text-center px-4 mb-32">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-8">
              Integrated Toolkit
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-center">
              <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
                  <Target className="w-6 h-6" />
                </div>
                <p className="font-bold text-lg text-slate-900 mb-1">
                  Job Matcher
                </p>
                <p className="text-xs text-slate-500 font-medium text-center">
                  Semantic embeddings score you against live jobs.
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="font-bold text-lg text-slate-900 mb-1">
                  Resume Architect
                </p>
                <p className="text-xs text-slate-500 font-medium text-center">
                  FAANG-level automated technical resume audits.
                </p>
              </div>
              <div className="flex flex-col items-center p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:-translate-y-1 transition-transform">
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
                  <BarChart className="w-6 h-6" />
                </div>
                <p className="font-bold text-lg text-slate-900 mb-1">
                  Market Demand
                </p>
                <p className="text-xs text-slate-500 font-medium text-center">
                  Predict global salaries and industry growth.
                </p>
              </div>
            </div>
          </section>

          {/* Social Proof Section */}
          <section className="max-w-6xl mx-auto px-4 mb-32">
            <h2 className="font-display text-3xl md:text-4xl text-center mb-16 text-[#1A1A1A]">
              Trusted by developers, traders
              <br />
              and ambitious professionals
            </h2>
            <div className="grid md:grid-cols-1 lg:grid-cols-1 gap-6 max-w-3xl mx-auto">
              <div className="bg-white p-8 rounded-3xl shadow-[0_20px_40px_-10px_rgba(0,0,0,0.05)] border border-slate-100">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-slate-900 text-white flex items-center justify-center rounded-full font-bold text-xl">
                    S
                  </div>
                  <div>
                    <p className="font-bold text-sm text-slate-900">
                      Sarah Jenkins
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      FULL STACK DEV
                    </p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-600 font-medium">
                  I use <span className="font-bold text-black">Vitra</span>{" "}
                  and it's been doing wonders. The Roadmap generator completely
                  structured my transition into Next.js. I used the Resume
                  Architect right before applying to roles and it caught three
                  critical ATS errors I had missed entirely.
                </p>
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="max-w-4xl mx-auto text-center px-4 mb-20 pt-10">
            <h2 className="font-display text-4xl md:text-5xl font-light tracking-wide text-[#1A1A1A] mb-8">
              Start building your future.
            </h2>
            <button
              onClick={handleGetStarted}
              className="bg-[#2563EB] text-white text-sm font-bold tracking-wide py-4 px-10 rounded-full shadow-[0_10px_30px_-5px_rgba(37,99,235,0.4)] hover:-translate-y-1 transition-all duration-300"
            >
              {user ? "OPEN WORKSPACE" : "GET STARTED FOR FREE"}
            </button>
          </section>

          {/* Footer */}
          <footer className="max-w-7xl mx-auto px-6 py-12 border-t border-slate-200/60 mt-20">
            <div className="flex flex-col md:flex-row justify-between items-center pt-8">
              <div className="flex items-center gap-2 mb-4 md:mb-0">
                <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white font-black text-sm">
                  L
                </div>
                <span className="font-display text-xl font-bold tracking-tight text-slate-900">
                  Vitra
                </span>
              </div>
              <div className="flex gap-6 text-xs text-slate-400 font-bold tracking-wider">
                <Link to="/" className="hover:text-slate-900 transition">
                  TERMS
                </Link>
                <Link to="/" className="hover:text-slate-900 transition">
                  PRIVACY
                </Link>
                <Link to="/" className="hover:text-slate-900 transition">
                  CONTACT
                </Link>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </>
  );
};

export default Home;
