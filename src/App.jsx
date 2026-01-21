import { useState } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  MessageSquare,
  Map,
  Briefcase,
  Send,
  Sparkles,
  User,
  Bot,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import "./App.css";

// 🔴 DOUBLE CHECK YOUR KEY IS PASTED CORRECTLY 🔴
const API_KEY = "AIzaSyA_6kZu4r3IhUCxjrZVInh1ehuW92ozbdI";

function App() {
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([
    {
      role: "model",
      text: "Hi! I'm your AI Career Coach. Tell me your goals (e.g., 'I want to be a Full Stack Developer') and I'll help you.",
    },
  ]);
  const [input, setInput] = useState("");
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!input.trim()) return;

    setError(null);
    const userMsg = { role: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (!API_KEY || API_KEY.includes("YOUR_GEMINI_API_KEY")) {
        throw new Error(
          "Invalid API Key. Please paste your actual key in src/App.jsx",
        );
      }

      const genAI = new GoogleGenerativeAI(API_KEY);

      // ✅ FIXED: Using 'gemini-1.5-flash' which is the current free-tier standard.
      // If this fails with 404, your SDK is outdated (run 'npm install @google/generative-ai@latest')
      // or your API key is invalid.
      const model = genAI.getGenerativeModel({
        model: "gemini-3-flash-preview",
      });
      // model: 'gemini-3-flash-preview',

      let prompt = userMsg.text;

      if (activeTab === "roadmap" || input.toLowerCase().includes("roadmap")) {
        prompt = `Create a career roadmap for: "${input}". 
         RETURN ONLY RAW JSON. Do not use Markdown formatting (no \`\`\`json).
         Structure: { "title": "Role Title", "steps": [{ "phase": "Phase Name", "details": "Key topics to learn" }] }`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (activeTab === "roadmap" || input.toLowerCase().includes("roadmap")) {
        try {
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
              text: `I've generated a roadmap for **${json.title}**! View it in the Roadmap tab.`,
            },
          ]);
          setActiveTab("roadmap");
        } catch (e) {
          console.error("JSON Error:", e);
          setMessages((prev) => [...prev, { role: "model", text: text }]);
        }
      } else {
        setMessages((prev) => [...prev, { role: "model", text: text }]);
      }
    } catch (err) {
      console.error("API Error Details:", err);
      let errorMsg = "Failed to connect to AI.";

      if (err.message.includes("404")) {
        errorMsg =
          "Error 404: Model not found. Please run 'npm install @google/generative-ai@latest' in your terminal.";
      } else if (
        err.message.includes("403") ||
        err.message.includes("API key")
      ) {
        errorMsg =
          "Error 403: Invalid API Key. Please create a new key at aistudio.google.com.";
      }

      setError(errorMsg);
      setMessages((prev) => [
        ...prev,
        { role: "model", text: "⚠️ " + errorMsg },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="logo-area">
          <Sparkles className="icon-logo" />
          <h2>CareerAI</h2>
        </div>
        <nav>
          <button
            className={activeTab === "chat" ? "active" : ""}
            onClick={() => setActiveTab("chat")}
          >
            <MessageSquare size={20} /> Chat Guidance
          </button>
        </nav>
      </aside>

      <main className="main-content">
        {error && (
          <div className="error-banner">
            <AlertCircle size={20} />
            {error}
          </div>
        )}

        {activeTab === "chat" ? (
          <div className="chat-interface">
            <div className="messages-area">
              {messages.map((msg, idx) => (
                <div key={idx} className={`message ${msg.role}`}>
                  <div className="avatar">
                    {msg.role === "user" ? (
                      <User size={18} />
                    ) : (
                      <Bot size={18} />
                    )}
                  </div>
                  <div className="bubble">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="loading-indicator">
                  <span>●</span>
                  <span>●</span>
                  <span>●</span>
                </div>
              )}
            </div>
            <div className="input-area">
              <input
                type="text"
                placeholder="Ask about skills, jobs, or type 'Roadmap for...'"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
              />
              <button onClick={handleSend} disabled={loading}>
                <Send size={18} />
              </button>
            </div>
          </div>
        ) : (
          <div className="roadmap-interface">
            {!roadmap ? (
              <div className="empty-state">
                <Map size={48} />
                <h3>No Roadmap Generated Yet</h3>
                <p>
                  Go to Chat and ask for a "Full Stack Roadmap" to generate one.
                </p>
                <button onClick={() => setActiveTab("chat")}>Go to Chat</button>
              </div>
            ) : (
              <div className="timeline-container">
                <h1 className="roadmap-title">{roadmap.title}</h1>
                <div className="timeline">
                  {roadmap.steps?.map((step, index) => (
                    <div key={index} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <h4>{step.phase}</h4>
                        <p>{step.details}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
