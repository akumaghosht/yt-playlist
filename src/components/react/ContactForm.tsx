import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2, RefreshCw, MessageSquare } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  subject: string;
  playlistUrl: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  subject?: string;
  message?: string;
}

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: 'General Inquiry',
    playlistUrl: '',
    message: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketId, setTicketId] = useState('');

  const validate = (): boolean => {
    const errs: FormErrors = {};

    if (!formData.name.trim()) {
      errs.name = 'Please provide your name';
    }

    if (!formData.email.trim()) {
      errs.email = 'Please provide your email address';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address';
    }

    if (!formData.subject) {
      errs.subject = 'Please select a topic';
    }

    if (!formData.message.trim()) {
      errs.message = 'Please enter your message';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Message must be at least 10 characters long';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error on edit
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    // Simulate reliable dispatch
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Generate reference ID
    const randomRef = 'YTL-' + Math.floor(100000 + Math.random() * 900000);
    setTicketId(randomRef);
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      subject: 'General Inquiry',
      playlistUrl: '',
      message: '',
    });
    setErrors({});
    setIsSubmitted(false);
    setTicketId('');
  };

  if (isSubmitted) {
    return (
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] text-center space-y-4 shadow-lg animate-in fade-in duration-200">
        <div className="w-14 h-14 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            Message Sent Successfully!
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-[#AAAAAA] max-w-md mx-auto">
            Thank you for reaching out, <span className="font-semibold text-slate-900 dark:text-white">{formData.name}</span>. We've received your inquiry and our support team will get back to you within 24 hours.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-100 dark:bg-[#222222] border border-slate-200 dark:border-[#333333] text-xs font-mono text-slate-700 dark:text-[#CCCCCC]">
          <span>Reference Ticket:</span>
          <span className="font-bold text-red-600 dark:text-red-400">{ticketId}</span>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 text-xs font-semibold tracking-wide transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Send Another Message</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="p-5 sm:p-8 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] shadow-lg space-y-5"
    >
      <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100 dark:border-[#222222]">
        <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950/50 dark:border-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            Send us a Direct Message
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#AAAAAA]">
            Fill out the form below and we'll reply to your email.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name Field */}
        <div className="space-y-1.5">
          <label htmlFor="name" className="block text-xs font-semibold text-slate-700 dark:text-[#CCCCCC]">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. Alex Johnson"
            className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#202020] border ${
              errors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-200 dark:border-[#2f2f2f] focus:border-red-500'
            } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#666666] focus:outline-none focus:ring-1 transition-all`}
          />
          {errors.name && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.name}</span>
            </p>
          )}
        </div>

        {/* Email Field */}
        <div className="space-y-1.5">
          <label htmlFor="email" className="block text-xs font-semibold text-slate-700 dark:text-[#CCCCCC]">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            value={formData.email}
            onChange={handleChange}
            placeholder="alex@example.com"
            className={`w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#202020] border ${
              errors.email
                ? 'border-red-500 focus:ring-red-500'
                : 'border-slate-200 dark:border-[#2f2f2f] focus:border-red-500'
            } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#666666] focus:outline-none focus:ring-1 transition-all`}
          />
          {errors.email && (
            <p className="text-[11px] text-red-500 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errors.email}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Subject Category */}
        <div className="space-y-1.5">
          <label htmlFor="subject" className="block text-xs font-semibold text-slate-700 dark:text-[#CCCCCC]">
            Topic Category <span className="text-red-500">*</span>
          </label>
          <select
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleChange}
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#2f2f2f] text-slate-900 dark:text-white focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all cursor-pointer"
          >
            <option value="General Inquiry">General Inquiry</option>
            <option value="Feature Suggestion">Feature Suggestion</option>
            <option value="Bug Report">Bug Report / Playlist Issue</option>
            <option value="API Key Help">YouTube API Key & Quota Help</option>
            <option value="Partnership / Feedback">Partnership or Feedback</option>
          </select>
        </div>

        {/* Optional Playlist URL */}
        <div className="space-y-1.5">
          <label htmlFor="playlistUrl" className="block text-xs font-semibold text-slate-700 dark:text-[#CCCCCC]">
            Playlist URL or ID <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <input
            id="playlistUrl"
            name="playlistUrl"
            type="text"
            value={formData.playlistUrl}
            onChange={handleChange}
            placeholder="https://youtube.com/playlist?list=PL..."
            className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#202020] border border-slate-200 dark:border-[#2f2f2f] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#666666] focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 font-mono transition-all"
          />
        </div>
      </div>

      {/* Message Field */}
      <div className="space-y-1.5">
        <label htmlFor="message" className="block text-xs font-semibold text-slate-700 dark:text-[#CCCCCC]">
          Message Details <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          rows={5}
          required
          value={formData.message}
          onChange={handleChange}
          placeholder="Please describe your question, suggested feature, or the problem you encountered..."
          className={`w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-[#202020] border ${
            errors.message
              ? 'border-red-500 focus:ring-red-500'
              : 'border-slate-200 dark:border-[#2f2f2f] focus:border-red-500'
          } text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#666666] focus:outline-none focus:ring-1 transition-all resize-y`}
        />
        {errors.message && (
          <p className="text-[11px] text-red-500 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>{errors.message}</span>
          </p>
        )}
      </div>

      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-[11px] text-slate-500 dark:text-[#888888]">
          We respect your privacy. Your information is never shared or sold.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-md shadow-red-950/20 dark:shadow-red-950/40 disabled:opacity-50 cursor-pointer touch-manipulation"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Message</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

