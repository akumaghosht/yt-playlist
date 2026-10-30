import React, { useState, useEffect } from 'react';
import { Key, X, Check, ExternalLink, ShieldCheck, Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyChange: (key: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onKeyChange }) => {
  const [apiKey, setApiKey] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_yt_api_key') || localStorage.getItem('yt_custom_api_key') || '';
      setApiKey(stored);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiKey.trim();
    const defaultKey = (import.meta.env.PUBLIC_YOUTUBE_API_KEY || '').trim();

    // Prevent bypassing rate limit by pasting the site's own default key
    if (defaultKey && trimmed === defaultKey) {
      setTestStatus('error');
      setTestMessage('This is the site’s default shared key. Please enter your own personal API key to unlock unlimited requests.');
      return;
    }

    if (typeof window !== 'undefined') {
      if (trimmed) {
        localStorage.setItem('user_yt_api_key', trimmed);
        localStorage.setItem('yt_custom_api_key', trimmed);
      } else {
        localStorage.removeItem('user_yt_api_key');
        localStorage.removeItem('yt_custom_api_key');
      }
    }
    onKeyChange(trimmed);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleClear = () => {
    setApiKey('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user_yt_api_key');
      localStorage.removeItem('yt_custom_api_key');
    }
    onKeyChange('');
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleTestKey = async () => {
    const keyToTest = apiKey.trim();
    if (!keyToTest) {
      setTestStatus('error');
      setTestMessage('Please enter an API key to test.');
      return;
    }

    const defaultKey = (import.meta.env.PUBLIC_YOUTUBE_API_KEY || '').trim();
    if (defaultKey && keyToTest === defaultKey) {
      setTestStatus('error');
      setTestMessage('This is the site’s default shared key. Please enter your own personal API key to unlock unlimited requests.');
      return;
    }

    setTestStatus('testing');
    setTestMessage('Validating key with YouTube API...');

    try {
      // Test key against standard public YouTube endpoint
      const res = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=id&id=Ks-_Mh1QhMc&key=${encodeURIComponent(keyToTest)}`
      );
      const data = await res.json();

      if (res.ok) {
        setTestStatus('success');
        setTestMessage('API key is valid and working properly!');
        handleSave();
      } else {
        setTestStatus('error');
        setTestMessage(data.error?.message || 'Invalid key or YouTube Data API v3 not enabled.');
      }
    } catch {
      setTestStatus('error');
      setTestMessage('Network error while verifying key. Check connection.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-lg max-h-[90dvh] flex flex-col bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-2xl shadow-2xl overflow-hidden transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 dark:border-[#272727] bg-slate-50 dark:bg-[#121212] shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-red-50 dark:bg-[#272727] text-red-600 dark:text-red-500 shrink-0">
              <Key className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white tracking-tight">API Settings</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#AAAAAA]">Configure your YouTube Data API v3 key</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 dark:text-[#AAAAAA] hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#272727] transition-colors touch-manipulation min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable on small screens */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1 overscroll-contain">
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-wider text-slate-600 dark:text-[#AAAAAA]">
              Custom YouTube API Key
            </label>
            <div className="relative">
              <input
                type="password"
                placeholder="AIzaSy..."
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setTestStatus('idle');
                }}
                className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 dark:bg-[#0F0F0F] border border-slate-300 dark:border-[#272727] rounded-lg text-base sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#525252] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono transition-all min-h-[42px]"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#717171] hover:text-red-500 dark:hover:text-red-400 p-2 touch-manipulation"
                  title="Clear key"
                  aria-label="Clear API key input"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-[#717171] flex items-center gap-1.5 pt-0.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>Stored exclusively in your browser&apos;s localStorage. Never sent to any 3rd party.</span>
            </p>
          </div>

          {/* Test Status feedback */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2 border ${
                testStatus === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300'
                  : testStatus === 'error'
                  ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/50 text-red-800 dark:text-red-300'
                  : 'bg-slate-100 dark:bg-[#212121] border-slate-200 dark:border-[#272727] text-slate-700 dark:text-[#AAAAAA]'
              }`}
            >
              {testStatus === 'success' ? (
                <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              ) : testStatus === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin shrink-0 mt-0.5 text-red-600 dark:text-red-500" />
              )}
              <span className="leading-relaxed">{testMessage}</span>
            </div>
          )}

          {/* How to get a free key card */}
          <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 dark:bg-[#212121] border border-slate-200 dark:border-[#272727]/80 space-y-2 text-xs text-slate-600 dark:text-[#AAAAAA]">
            <div className="font-medium text-slate-900 dark:text-white flex items-center justify-between flex-wrap gap-1">
              <span>Need a free YouTube API Key?</span>
              <a
                href="https://console.cloud.google.com/apis/library/youtube.googleapis.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 inline-flex items-center gap-1 hover:underline font-normal touch-manipulation py-0.5"
              >
                <span>Google Cloud Console</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-[#AAAAAA] leading-relaxed text-[11px] sm:text-xs">
              <li>Create a free Google Cloud project.</li>
              <li>Enable the <strong>YouTube Data API v3</strong>.</li>
              <li>Go to <em>Credentials</em> &rarr; <em>Create Credentials</em> &rarr; <em>API Key</em>.</li>
              <li>Paste it here for 10,000 free quota points per day!</li>
            </ol>
          </div>
        </div>

        {/* Footer actions */}
        <div className="grid grid-cols-2 sm:flex sm:items-center sm:justify-end gap-2.5 sm:gap-3 px-4 sm:px-6 py-3.5 sm:py-4 border-t border-slate-200 dark:border-[#272727] bg-slate-50 dark:bg-[#121212] shrink-0">
          <button
            type="button"
            onClick={handleTestKey}
            disabled={testStatus === 'testing' || !apiKey.trim()}
            className="w-full sm:w-auto px-4 py-2 text-xs font-medium text-slate-700 dark:text-white bg-slate-200 dark:bg-[#272727] hover:bg-slate-300 dark:hover:bg-[#333333] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors touch-manipulation min-h-[40px] flex items-center justify-center"
          >
            {testStatus === 'testing' ? 'Testing...' : 'Test Connection'}
          </button>
          <button
            type="button"
            onClick={() => {
              handleSave();
              onClose();
            }}
            className="w-full sm:w-auto px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-500 active:bg-red-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/20 dark:shadow-red-950/40 touch-manipulation min-h-[40px]"
          >
            {isSaved ? <Check className="w-3.5 h-3.5" /> : null}
            <span>{isSaved ? 'Saved!' : 'Save & Close'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};