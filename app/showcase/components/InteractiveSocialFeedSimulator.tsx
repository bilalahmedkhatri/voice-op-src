'use client';

import React, { useState } from 'react';
import {
  FaFacebook,
  FaInstagram,
  FaThumbsUp,
  FaRegCommentAlt,
  FaShare,
  FaMusic,
  FaHeart,
  FaRegBookmark,
  FaBookmark,
  FaYoutube,
} from 'react-icons/fa';
import {
  FiGlobe,
  FiMoreHorizontal,
  FiX,
  FiWifi,
  FiBattery,
  FiLink,
} from 'react-icons/fi';
import { MdVerified } from 'react-icons/md';
import Link from 'next/link';

type PlatformType = 'fb-feed' | 'fb-reel' | 'ig-reel';

const DEFAULT_16_9_VIDEO = 'https://www.youtube.com/watch?v=LXb3EKWsInQ';
const DEFAULT_9_16_SHORT = 'https://www.youtube.com/shorts/tFn3PLVvv8M';

const QUICK_HASHTAGS = [
  '#VoiceAI',
  '#VideoMarketing',
  '#ShortsHooks',
  '#CreatorTools',
  '#ElevenLabs',
];

function extractYouTubeId(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // If already a clean 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // /shorts/{id}
  const shortsMatch = trimmed.match(/\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // ?v={id} or &v={id}
  const vMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch && vMatch[1]) return vMatch[1];

  // youtu.be/{id}
  const beMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (beMatch && beMatch[1]) return beMatch[1];

  // /embed/{id}
  const embedMatch = trimmed.match(/\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  return '';
}

export default function InteractiveSocialFeedSimulator() {
  const [platform, setPlatform] = useState<PlatformType>('fb-feed');
  const [pageName, setPageName] = useState('GenZee Creator Lab');
  const [caption, setCaption] = useState(
    'Never spend 5 hours recording and editing voiceovers again. Turn any script into natural speech and schedule your entire weekly Reels feed with 1-click publishing.'
  );
  const [hashtags, setHashtags] = useState('#VoiceAI #VideoMarketing #ShortsHooks #CreatorTools');
  const [youtubeUrl, setYoutubeUrl] = useState(DEFAULT_16_9_VIDEO);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Parse hashtags into array for rich render
  const hashtagList = hashtags
    .split(/[\s,]+/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));

  const videoId = extractYouTubeId(youtubeUrl);
  const embedUrl = videoId
    ? `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`
    : '';

  const handlePlatformChange = (newPlatform: PlatformType) => {
    setPlatform(newPlatform);
    if (newPlatform === 'fb-feed' && youtubeUrl === DEFAULT_9_16_SHORT) {
      setYoutubeUrl(DEFAULT_16_9_VIDEO);
    } else if ((newPlatform === 'fb-reel' || newPlatform === 'ig-reel') && youtubeUrl === DEFAULT_16_9_VIDEO) {
      setYoutubeUrl(DEFAULT_9_16_SHORT);
    }
  };

  const addHashtag = (tagToAdd: string) => {
    if (!hashtags.toLowerCase().includes(tagToAdd.toLowerCase())) {
      setHashtags((prev) => (prev.trim() ? `${prev.trim()} ${tagToAdd}` : tagToAdd));
    }
  };

  return (
    <section id="social-mockup" className="py-12 sm:py-16 lg:py-20 bg-slate-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-slate-900">
            Preview Posts in Real Feed Environments Before You Publish
          </h2>
          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Test captions, hashtags, and real YouTube videos across authentic Facebook and Instagram feeds.
            Edit live below to see how your content renders for real audiences.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          <button
            type="button"
            onClick={() => handlePlatformChange('fb-feed')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              platform === 'fb-feed'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <FaFacebook className="text-sm" />
            <span>Facebook Feed (16:9 Video)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlatformChange('fb-reel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              platform === 'fb-reel'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <FaFacebook className="text-sm" />
            <span>Facebook Reel (9:16 Short)</span>
          </button>

          <button
            type="button"
            onClick={() => handlePlatformChange('ig-reel')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              platform === 'ig-reel'
                ? 'bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-2xs'
            }`}
          >
            <FaInstagram className="text-sm" />
            <span>Instagram Reel (9:16 Short)</span>
          </button>
        </div>

        {/* Split Live Editor & Device Simulator - Balanced 50/50 Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Comprehensive Post Controls (col-span-6) */}
          <div className="lg:col-span-6 bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Live Post Settings</h3>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Feed Sync
              </span>
            </div>

            {/* Account / Page Name Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Account / Page Name</label>
              <input
                type="text"
                value={pageName}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="e.g. GenZee Creator Lab"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ff7d6e] focus:bg-white transition-all font-medium text-slate-900"
              />
            </div>

            {/* Post Caption */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Post Caption</label>
              <textarea
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your main post caption here..."
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ff7d6e] focus:bg-white transition-all leading-relaxed resize-none text-slate-800"
              />
            </div>

            {/* Hashtags & Tags */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Hashtags &amp; Tags</label>
                <span className="text-[11px] text-slate-400">Separate with space or comma</span>
              </div>
              <input
                type="text"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#VoiceAI #VideoMarketing #ShortsHooks"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ff7d6e] focus:bg-white transition-all font-mono text-xs text-[#c83a2a]"
              />

              {/* Quick Hashtag Suggestions - Compact Pill Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400">Suggestions:</span>
                {QUICK_HASHTAGS.map((quickTag) => (
                  <button
                    key={quickTag}
                    type="button"
                    onClick={() => addHashtag(quickTag)}
                    className="px-2 py-0.5 rounded-full bg-orange-50 hover:bg-orange-100/80 text-[#c83a2a] text-[11px] font-mono font-medium border border-[#ff9b8f]/40 hover:border-[#ff7d6e]/70 transition-colors cursor-pointer leading-tight inline-flex items-center"
                  >
                    {quickTag}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct YouTube Video & Shorts Embed Input */}
            <div className="pt-3 border-t border-slate-100">
              <div className="relative">
                <input
                  type="text"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... or https://youtube.com/shorts/..."
                  className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#ff7d6e] focus:bg-white transition-all font-mono text-slate-800"
                />
                <FiLink className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
                {youtubeUrl && (
                  <button
                    type="button"
                    onClick={() => setYoutubeUrl('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Clear URL"
                  >
                    <FiX className="text-xs" />
                  </button>
                )}
              </div>
            </div>

            {/* Direct Studio Bridge CTA */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <span>💡 1-Click direct social publishing and automated calendar scheduling.</span>
              </div>
              <Link
                href="/facebook/integration"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs"
              >
                <span>Connect Page in GenZee Studio</span>
              </Link>
            </div>
          </div>

          {/* Right: Authentic Social Media Feed / Reel Mockup (col-span-6) */}
          <div className="lg:col-span-6 flex justify-center w-full">
            {/* 1. Authentic Facebook Feed Post (Clean 16:9 Embedded Player) */}
            {platform === 'fb-feed' && (
              <div className="w-full max-w-lg bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden text-slate-900 animate-fadeIn">
                {/* Facebook Header */}
                <div className="p-3.5 sm:p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#e04836] to-[#ff7d6e] text-white font-bold text-sm flex items-center justify-center ring-2 ring-white shadow-2xs">
                      GZ
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900 flex items-center gap-1">
                        <span>{pageName || 'GenZee Creator Lab'}</span>
                        <MdVerified className="text-[#1877F2] text-sm shrink-0" title="Verified Creator" />
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-1">
                        <span>Just now</span>
                        <span>•</span>
                        <FiGlobe className="text-[11px] text-slate-500" title="Public Post" />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-slate-500">
                    <button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                      <FiMoreHorizontal className="text-base" />
                    </button>
                    <button type="button" className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                      <FiX className="text-base" />
                    </button>
                  </div>
                </div>

                {/* Post Caption + Hashtags */}
                <div className="px-3.5 sm:px-4 pb-3 space-y-2 text-sm text-slate-800 leading-relaxed font-sans">
                  <p className="whitespace-pre-wrap">{caption}</p>
                  {hashtagList.length > 0 && (
                    <p className="space-x-1.5 font-medium">
                      {hashtagList.map((tag, idx) => (
                        <span key={idx} className="text-[#1877F2] hover:underline cursor-pointer">
                          {tag}
                        </span>
                      ))}
                    </p>
                  )}
                </div>

                {/* Clean 16:9 YouTube Video Embed Area */}
                <div className="relative aspect-video w-full bg-black overflow-hidden select-none">
                  {embedUrl ? (
                    <iframe
                      src={embedUrl}
                      title="Facebook Feed Video Player"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                      <FaYoutube className="text-3xl text-red-500" />
                      <p className="text-xs">Paste a YouTube link on the left to preview video playback</p>
                      <button
                        type="button"
                        onClick={() => setYoutubeUrl(DEFAULT_16_9_VIDEO)}
                        className="text-[11px] px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors cursor-pointer"
                      >
                        Load Sample 16:9 Video
                      </button>
                    </div>
                  )}
                </div>

                {/* Facebook Engagement Stats Counter */}
                <div className="px-4 py-2.5 border-b border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <div className="flex -space-x-1 items-center">
                      <span className="w-4 h-4 rounded-full bg-[#1877F2] text-white flex items-center justify-center text-[8px] ring-2 ring-white">
                        <FaThumbsUp />
                      </span>
                      <span className="w-4 h-4 rounded-full bg-[#FA383E] text-white flex items-center justify-center text-[8px] ring-2 ring-white">
                        <FaHeart />
                      </span>
                    </div>
                    <span>{isLiked ? '143' : '142'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>28 comments</span>
                    <span>14 shares</span>
                  </div>
                </div>

                {/* Facebook 3-Button Action Row */}
                <div className="px-2 py-1.5 grid grid-cols-3 text-xs font-semibold text-slate-600">
                  <button
                    type="button"
                    onClick={() => setIsLiked(!isLiked)}
                    className={`py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100/70 transition-colors cursor-pointer ${
                      isLiked ? 'text-[#1877F2] font-bold' : ''
                    }`}
                  >
                    <FaThumbsUp className="text-sm" />
                    <span>Like</span>
                  </button>
                  <button type="button" className="py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100/70 transition-colors cursor-pointer">
                    <FaRegCommentAlt className="text-sm" />
                    <span>Comment</span>
                  </button>
                  <button type="button" className="py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-slate-100/70 transition-colors cursor-pointer">
                    <FaShare className="text-sm" />
                    <span>Share</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Authentic Facebook Reel (9:16 YouTube Short Embed) */}
            {platform === 'fb-reel' && (
              <div className="w-full max-w-[320px] aspect-[9/16] bg-slate-950 rounded-[36px] overflow-hidden relative shadow-2xl flex flex-col justify-between p-4 text-white border-4 border-slate-900 animate-fadeIn">
                {/* Embedded 9:16 YouTube Short */}
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="Facebook Reel Short Player"
                    className="absolute inset-0 w-full h-full object-cover border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                    <FaYoutube className="text-3xl text-red-500" />
                    <p className="text-xs">Paste a YouTube Short link on the left</p>
                  </div>
                )}

                {/* Subtle Top & Bottom Gradient Shadows for Readability */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                {/* Phone Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 z-20 px-2 pt-1 pointer-events-none">
                  <span>9:41</span>
                  <div className="w-20 h-4 bg-black/60 rounded-full mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <FiWifi className="text-xs" />
                    <FiBattery className="text-xs" />
                  </div>
                </div>

                {/* Top Reel Navigation */}
                <div className="flex items-center justify-between z-20 pt-1 pointer-events-none">
                  <span className="text-xs font-bold uppercase tracking-wider bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 pointer-events-auto">
                    <FaFacebook className="text-[#1877F2]" /> Reel
                  </span>
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <FiMoreHorizontal className="text-lg cursor-pointer" />
                  </div>
                </div>

                {/* Right Side Engagement Column */}
                <div className="absolute right-3 bottom-16 flex flex-col items-center gap-3.5 z-20 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsLiked(!isLiked)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-base backdrop-blur-xs transition-colors ${
                      isLiked ? 'bg-[#1877F2] text-white' : 'bg-black/50 text-white hover:bg-black/70'
                    }`}>
                      <FaThumbsUp />
                    </div>
                    <span className="text-[11px] drop-shadow-md">{isLiked ? '4.3K' : '4.2K'}</span>
                  </button>

                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70 flex items-center justify-center text-base">
                      <FaRegCommentAlt />
                    </div>
                    <span className="text-[11px] drop-shadow-md">186</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70 flex items-center justify-center text-base">
                      <FaShare />
                    </div>
                    <span className="text-[11px] drop-shadow-md">Share</span>
                  </div>

                  {/* Spinning Audio Disc */}
                  <div className="w-9 h-9 rounded-full bg-slate-900/90 border-2 border-white/60 flex items-center justify-center animate-spin [animation-duration:4s]">
                    <FaMusic className="text-[10px] text-[#ff7d6e]" />
                  </div>
                </div>

                {/* Bottom Overlay with Creator Info, Caption & Authentic Audio */}
                <div className="z-20 space-y-2 max-w-[210px] pb-1 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="w-7 h-7 rounded-full bg-[#ff7d6e] flex items-center justify-center font-bold text-xs ring-1 ring-white/50">
                      GZ
                    </div>
                    <span className="text-xs font-bold truncate drop-shadow-md">{pageName || 'GenZee Creator Lab'}</span>
                    <button
                      type="button"
                      className="text-[10px] font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-white border border-white/25 transition-colors cursor-pointer"
                    >
                      Follow
                    </button>
                  </div>

                  <p className="text-xs text-white/95 line-clamp-2 leading-snug font-sans drop-shadow-md">
                    {caption}
                  </p>

                  {hashtagList.length > 0 && (
                    <p className="text-[11px] text-[#8cb4f8] font-medium truncate drop-shadow-md">
                      {hashtagList.join(' ')}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full max-w-fit pointer-events-auto border border-white/10">
                    <FaMusic className="text-[9px] text-[#ff7d6e]" />
                    <span className="truncate">Original Audio • Creator Sounds</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Authentic Instagram Reel (9:16 YouTube Short Embed) */}
            {platform === 'ig-reel' && (
              <div className="w-full max-w-[320px] aspect-[9/16] bg-slate-950 rounded-[36px] overflow-hidden relative shadow-2xl flex flex-col justify-between p-4 text-white border-4 border-slate-900 animate-fadeIn">
                {/* Embedded 9:16 YouTube Short */}
                {embedUrl ? (
                  <iframe
                    src={embedUrl}
                    title="Instagram Reel Short Player"
                    className="absolute inset-0 w-full h-full object-cover border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                  />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center space-y-2">
                    <FaYoutube className="text-3xl text-red-500" />
                    <p className="text-xs">Paste a YouTube Short link on the left</p>
                  </div>
                )}

                {/* Subtle Top & Bottom Gradient Shadows for Readability */}
                <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none z-10" />
                <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />

                {/* Phone Status Bar */}
                <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 z-20 px-2 pt-1 pointer-events-none">
                  <span>9:41</span>
                  <div className="w-20 h-4 bg-black/60 rounded-full mx-auto" />
                  <div className="flex items-center gap-1.5">
                    <FiWifi className="text-xs" />
                    <FiBattery className="text-xs" />
                  </div>
                </div>

                {/* Top Instagram Reel Navigation */}
                <div className="flex items-center justify-between z-20 pt-1 pointer-events-none">
                  <span className="text-sm font-bold flex items-center gap-1 tracking-tight drop-shadow-md">
                    <span>Reels</span>
                  </span>
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <span className="text-xs font-semibold bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md">Shorts</span>
                  </div>
                </div>

                {/* Right Side Engagement Column */}
                <div className="absolute right-3 bottom-16 flex flex-col items-center gap-3.5 z-20 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setIsLiked(!isLiked)}
                    className="flex flex-col items-center gap-1 cursor-pointer group"
                  >
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70 flex items-center justify-center text-lg transition-transform group-hover:scale-110">
                      <FaHeart className={isLiked ? 'text-[#FF3040]' : 'text-white'} />
                    </div>
                    <span className="text-[11px] drop-shadow-md">{isLiked ? '12.9K' : '12.8K'}</span>
                  </button>

                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70 flex items-center justify-center text-base">
                      <FaRegCommentAlt />
                    </div>
                    <span className="text-[11px] drop-shadow-md">492</span>
                  </div>

                  <div className="flex flex-col items-center gap-1 cursor-pointer">
                    <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70 flex items-center justify-center text-base">
                      <FaShare />
                    </div>
                    <span className="text-[11px] drop-shadow-md">Share</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsSaved(!isSaved)}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-xs hover:bg-black/70 flex items-center justify-center text-base cursor-pointer"
                  >
                    {isSaved ? <FaBookmark className="text-amber-400" /> : <FaRegBookmark />}
                  </button>

                  {/* Spinning Audio Track Artwork */}
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 border border-white/80 flex items-center justify-center shadow-lg">
                    <FaMusic className="text-[10px] text-white" />
                  </div>
                </div>

                {/* Bottom Overlay with Caption & Hashtags */}
                <div className="z-20 space-y-2 max-w-[210px] pb-1 pointer-events-none">
                  <div className="flex items-center gap-2 pointer-events-auto">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-purple-600 flex items-center justify-center font-bold text-xs ring-1 ring-white">
                      GZ
                    </div>
                    <span className="text-xs font-bold truncate drop-shadow-md">
                      @{pageName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'genzeecreator'}
                    </span>
                    <button
                      type="button"
                      className="text-[10px] font-semibold bg-white/20 hover:bg-white/30 backdrop-blur-xs px-2.5 py-0.5 rounded-full text-white border border-white/25 transition-colors cursor-pointer"
                    >
                      Follow
                    </button>
                  </div>

                  <p className="text-xs text-white/95 line-clamp-2 leading-snug font-sans drop-shadow-md">
                    {caption}
                  </p>

                  {hashtagList.length > 0 && (
                    <p className="text-[11px] text-white/90 font-medium truncate drop-shadow-md">
                      {hashtagList.join(' ')}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 text-[10px] text-white/90 bg-black/50 backdrop-blur-xs px-2.5 py-1 rounded-full max-w-fit pointer-events-auto border border-white/10">
                    <FaMusic className="text-[9px] text-[#ff7d6e]" />
                    <span className="truncate">Original Audio • Creator Sounds</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
