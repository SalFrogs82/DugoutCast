import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Radio,
  X,
  Volume2,
  Sparkles,
  Send,
  MessageSquare,
} from 'lucide-react';
import { dugoutAudio } from '../utils/audioEngine';

interface LiveVoiceBoothModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'booth';
  text: string;
  timestamp: string;
}

export const LiveVoiceBoothModal: React.FC<LiveVoiceBoothModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init_1',
      sender: 'booth',
      text: "Dan Miller here in the DugoutCast broadcast booth! We're watching the 7th inning tie game live. Ask me anything about the pitch, the play at second, or game strategy!",
      timestamp: '00:00',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isBoothSpeaking, setIsBoothSpeaking] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize WebSocket connection to /api/live-booth
  useEffect(() => {
    if (!isOpen) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/live-booth`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'text_response' && data.text) {
            setMessages((prev) => [
              ...prev,
              {
                id: `msg_${Date.now()}`,
                sender: 'booth',
                text: data.text,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
            // Speak text response
            setIsBoothSpeaking(true);
            dugoutAudio.speakFallback(data.text, { speaker: 'play_by_play', rate: 1.1 }).finally(() => {
              setIsBoothSpeaking(false);
            });
          } else if (data.type === 'audio' && data.audio) {
            setIsBoothSpeaking(true);
            dugoutAudio.playBase64Audio(data.audio).finally(() => {
              setIsBoothSpeaking(false);
            });
          }
        } catch {}
      };

      ws.onclose = () => {
        setIsConnected(false);
      };

      return () => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.close();
        }
      };
    } catch {
      setIsConnected(false);
    }
  }, [isOpen]);

  // Send typed query to the booth
  const handleSendQuery = (textToSend?: string) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'text_query', text }));
    } else {
      // Fallback response if offline
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `fb_${Date.now()}`,
            sender: 'booth',
            text: "That was a blistering 63.4 MPH riseball up the middle! Vasquez beat the throw by a fraction of a step!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        dugoutAudio.speakFallback(
          "That was a blistering 63.4 MPH riseball up the middle! Vasquez beat the throw by a fraction of a step!",
          { speaker: 'play_by_play' }
        );
      }, 600);
    }
  };

  // Toggle live microphone audio capture
  const toggleRecording = async () => {
    if (isRecording) {
      setIsRecording(false);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
      }
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        setIsRecording(true);

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        let ctx: AudioContext;
        try {
          ctx = new AudioCtx({ sampleRate: 16000 });
        } catch {
          ctx = new AudioCtx();
        }
        audioContextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const processor = ctx.createScriptProcessor(4096, 1, 1);
        source.connect(processor);
        processor.connect(ctx.destination);

        processor.onaudioprocess = (e) => {
          if (!isRecording) return;
          const input = e.inputBuffer.getChannelData(0);
          // Convert float to 16-bit PCM
          const pcm = new Int16Array(input.length);
          for (let i = 0; i < input.length; i++) {
            pcm[i] = Math.max(-1, Math.min(1, input[i])) * 0x7fff;
          }
          // Convert to base64
          let binary = '';
          const bytes = new Uint8Array(pcm.buffer);
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'audio_input', audio: base64 }));
          }
        };
      } catch {
        setIsRecording(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <Radio className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
                <span>Live Broadcast Booth Intercom</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  gemini-3.8-live
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Real-time voice conversation with lead announcer Dan Miller
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Audio Visualizer Banner */}
        <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-emerald-400' : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {isConnected ? 'Connected to Booth Live API' : 'Connecting to Live Booth...'}
            </span>
          </div>

          {isBoothSpeaking && (
            <div className="flex items-center gap-1.5 text-amber-400 font-mono text-[11px]">
              <Volume2 className="w-3.5 h-3.5 animate-bounce" />
              <span>DAN TRANSMITTING AUDIO...</span>
            </div>
          )}
        </div>

        {/* Conversation Stream */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 bg-slate-900/60">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${
                m.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-[85%] rounded-xl p-3.5 text-xs leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-slate-950 font-medium rounded-br-none shadow-sm'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none'
                }`}
              >
                <div className="flex items-center gap-2 mb-1 opacity-70 text-[10px]">
                  <span>{m.sender === 'user' ? 'You (Viewer)' : 'Dan Miller (PBP)'}</span>
                  <span>·</span>
                  <span>{m.timestamp}</span>
                </div>
                <p>{m.text}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Suggested Prompts */}
        <div className="px-6 py-2 bg-slate-950/70 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-400">
          <span className="shrink-0 text-slate-500 font-medium">Ask:</span>
          <button
            onClick={() => handleSendQuery('Was Vasquez really safe at second base?')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            "Was Vasquez safe at 2nd?"
          </button>
          <button
            onClick={() => handleSendQuery('What kind of spin did Clincy have on that pitch?')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            "What spin was on that pitch?"
          </button>
          <button
            onClick={() => handleSendQuery('How does this affect the 7th inning tie game strategy?')}
            className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0 transition-colors"
          >
            "Strategy impact?"
          </button>
        </div>

        {/* Input & Mic Bar */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2.5">
          <button
            onClick={toggleRecording}
            className={`p-3 rounded-xl transition-all shadow-md ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
            title={isRecording ? 'Mute Microphone' : 'Talk into Live Mic'}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendQuery()}
            placeholder="Talk or type question to the broadcast booth..."
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />

          <button
            onClick={() => handleSendQuery()}
            className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
