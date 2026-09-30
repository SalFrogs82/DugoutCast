# DugoutCast AI — Softball Play-by-Play Announcer & Computer Vision Studio

DugoutCast AI is an AI-powered sports broadcasting production system designed for fastpitch softball games (such as GameChanger live streams and archived footage). It performs real-time visual tracking of players and balls, analyzes game context, and generates synchronized, professional audio commentary tailored to customizable commentator styles.

---

## ⚡ Core Features

- **Computer Vision & Ball Tracking**:
  - Optic yellow softball tracer with flight trajectory arcs and velocity telemetry (release speed, exit velocity, vertical break).
  - Bounding box tracking for pitcher windmill release, batter swing path, catcher framing, and middle-infield defensive coverage.
  - Authentic GameChanger scorebug HUD overlay (inning, count, pitch count, and team scoreline).

- **Multi-Model Gemini Intelligence**:
  - **`gemini-3.1-pro-preview` (Thinking Mode HIGH)**: In-depth tactical softball reasoning, pitch tunneling analysis, situational count pressure, and fielding geometry.
  - **`gemini-3.1-flash-lite`**: Ultra-low-latency, punchy play-by-play calls generated in sub-300ms for live streaming moments.
  - **`gemini-3.5-flash`**: Scripted dialogue and booth banter between lead play-by-play announcer Dan Miller and color analyst Jessica Vance.
  - **`gemini-3.8-live` (Live API)**: Real-time two-way voice conversation with the broadcast booth over WebSocket.
  - **`gemini-3.8-flash-lite-tts`**: Broadcast-grade text-to-speech commentary.

- **Broadcast Realism Audio Engine**:
  - Web Audio API acoustic synthesis:
    - Composite carbon fiber bat crack (`1400Hz -> 160Hz` rapid transient).
    - Dynamic stadium crowd roars with resonant bandpass rumble.
    - Ballpark organ fanfare ("Charge!").
    - Catcher and infielder leather glove catch pops.
  - Instant Web Speech API fallback for zero-latency, cross-browser compatibility.

- **Customizable Announcer Styles**:
  - **National Championship TV**: High-energy, soaring vocal crescendos with collegiate softball jargon.
  - **Hometown Dugout Booster**: Fan-favorite team loyalist with passionate rally calls.
  - **Pitching Lab Specialist**: Analytical breakdown of spin rate, arm slot, and exit angles.
  - **1980s Retro Radio Legend**: Nostalgic, rhythmic AM radio cadence.

---

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, HTML5 Canvas
- **Backend**: Express, WebSocket Server (`ws`), Node.js / `tsx`
- **AI SDK**: `@google/genai` TypeScript SDK
- **Audio**: Web Audio API, Web Speech API, Gemini Speech Synthesis

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory:

```env
GEMINI_API_KEY="your-gemini-api-key-here"
PORT=3000
```

### 3. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Building for Production

```bash
npm run build
npm start
```

---

## 📄 License

Apache-2.0
