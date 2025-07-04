import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast, Toaster } from 'react-hot-toast';
import { 
  Download, 
  Play, 
  Clock, 
  Eye, 
  User,
  Link,
  FileVideo,
  FileAudio,
  Music,
  Video,
  Loader2,
  CheckCircle,
  XCircle,
  Copy,
  ExternalLink,
  List,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  HelpCircle,
  Settings,
  Zap,
  Film,
  Headphones,
  MonitorPlay,
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  WifiOff,
  Star,
  TrendingUp,
  FileText,
  Info
} from 'lucide-react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

// URL validation patterns
const YOUTUBE_URL_PATTERNS = [
  /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?v=.+$/,
  /^(https?:\/\/)?(www\.)?youtube\.com\/playlist\?list=.+$/,
  /^(https?:\/\/)?(www\.)?youtu\.be\/.+$/
];

// Format configurations with enhanced metadata
const FORMATS = [
  {
    value: 'mp4',
    label: 'MP4 Video',
    icon: Video,
    description: 'High quality video, widely compatible',
    color: 'from-blue-500 to-blue-600',
    recommended: true,
    fileSize: 'Large',
    compatibility: 'Excellent'
  },
  {
    value: 'webm',
    label: 'WebM Video',
    icon: MonitorPlay,
    description: 'Modern web video format, smaller size',
    color: 'from-green-500 to-green-600',
    recommended: false,
    fileSize: 'Medium',
    compatibility: 'Good'
  },
  {
    value: 'mp3',
    label: 'MP3 Audio',
    icon: Headphones,
    description: 'Audio only, perfect for music',
    color: 'from-purple-500 to-purple-600',
    recommended: false,
    fileSize: 'Small',
    compatibility: 'Excellent'
  }
];

// Quality configurations with file size estimates
const QUALITIES = [
  {
    value: '360p',
    label: '360p',
    description: 'Good for mobile',
    icon: Smartphone,
    size: 'Small',
    bandwidth: 'Low',
    recommended: false
  },
  {
    value: '480p',
    label: '480p',
    description: 'Standard quality',
    icon: Tablet,
    size: 'Medium',
    bandwidth: 'Medium',
    recommended: false
  },
  {
    value: '720p',
    label: '720p HD',
    description: 'High definition',
    icon: Monitor,
    size: 'Large',
    bandwidth: 'High',
    recommended: true
  },
  {
    value: '1080p',
    label: '1080p Full HD',
    description: 'Best quality',
    icon: Film,
    size: 'Very Large',
    bandwidth: 'Very High',
    recommended: false
  }
];

function App() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState(null);
  const [playlistInfo, setPlaylistInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState('mp4');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [downloads, setDownloads] = useState([]);
  const [showDownloads, setShowDownloads] = useState(false);
  const [isPlaylist, setIsPlaylist] = useState(false);
  const [urlValidation, setUrlValidation] = useState({ isValid: null, message: '' });
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [showHelp, setShowHelp] = useState(false);
  const urlInputRef = useRef(null);

  // Enhanced URL validation
  const validateUrl = (inputUrl) => {
    if (!inputUrl.trim()) {
      return { isValid: null, message: '' };
    }
    
    const isValid = YOUTUBE_URL_PATTERNS.some(pattern => pattern.test(inputUrl));
    const isPlaylistUrl = inputUrl.includes('playlist?') || inputUrl.includes('&list=');
    
    if (isValid) {
      return {
        isValid: true,
        message: isPlaylistUrl ? 'Valid playlist URL detected' : 'Valid video URL detected',
        type: isPlaylistUrl ? 'playlist' : 'video'
      };
    } else {
      return {
        isValid: false,
        message: 'Please enter a valid YouTube URL'
      };
    }
  };

  // Real-time URL validation
  useEffect(() => {
    const validation = validateUrl(url);
    setUrlValidation(validation);
    setIsPlaylist(validation.type === 'playlist');
  }, [url]);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(true);
      toast.success('Connection restored');
    };
    const handleOffline = () => {
      setNetworkStatus(false);
      toast.error('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-refresh downloads status
  useEffect(() => {
    const interval = setInterval(() => {
      if (networkStatus) {
        refreshDownloads();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [networkStatus]);

  const refreshDownloads = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/downloads`);
      if (response.data.success) {
        setDownloads(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching downloads:', error);
    }
  };

  const handleUrlSubmit = async (e) => {
    e.preventDefault();
    
    if (!networkStatus) {
      toast.error('Please check your internet connection');
      return;
    }

    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      urlInputRef.current?.focus();
      return;
    }

    if (!urlValidation.isValid) {
      toast.error('Please enter a valid YouTube URL');
      urlInputRef.current?.focus();
      return;
    }

    setLoading(true);
    setVideoInfo(null);
    setPlaylistInfo(null);
    
    try {
      const loadingToast = toast.loading('Analyzing video...');
      
      if (isPlaylist) {
        const response = await axios.post(`${API_BASE_URL}/api/playlist-info`, { url });
        if (response.data.success) {
          setPlaylistInfo(response.data.data);
          toast.success('Playlist analyzed successfully!', { id: loadingToast });
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/video-info`, { url });
        if (response.data.success) {
          setVideoInfo(response.data.data);
          toast.success('Video analyzed successfully!', { id: loadingToast });
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to analyze video';
      toast.error(errorMessage);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo && !playlistInfo) {
      toast.error('Please analyze a video first');
      return;
    }

    if (!networkStatus) {
      toast.error('Please check your internet connection');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/download`, {
        url,
        format: selectedFormat,
        quality: selectedQuality
      });
      
      if (response.data.success) {
        toast.success('Download started successfully!');
        setShowDownloads(true);
        refreshDownloads();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.detail || 'Failed to start download';
      toast.error(errorMessage);
    }
  };

  const handleFileDownload = async (downloadId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/download/${downloadId}/file`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `video.${selectedFormat}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Failed to download file');
    }
  };

  const deleteDownload = async (downloadId) => {
    try {
      await axios.delete(`${API_BASE_URL}/api/download/${downloadId}`);
      toast.success('Download deleted successfully');
      refreshDownloads();
    } catch (error) {
      toast.error('Failed to delete download');
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return hrs > 0 ? `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}` 
                   : `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatNumber = (num) => {
    if (!num) return 'Unknown';
    return num.toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const getSelectedFormat = () => FORMATS.find(f => f.value === selectedFormat);
  const getSelectedQuality = () => QUALITIES.find(q => q.value === selectedQuality);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: 'rgba(0, 0, 0, 0.8)',
            color: 'white',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
          }
        }}
      />
      
      {/* Network status indicator */}
      <AnimatePresence>
        {!networkStatus && (
          <motion.div
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 z-50"
          >
            <WifiOff size={16} />
            No internet connection
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Header */}
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-7xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
            YouTube Downloader
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-4">
            Download YouTube videos and playlists with the highest quality and best experience
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <Zap size={16} />
              Lightning fast
            </div>
            <div className="flex items-center gap-1">
              <Star size={16} />
              Premium quality
            </div>
            <div className="flex items-center gap-1">
              <Check size={16} />
              Always free
            </div>
          </div>
        </motion.div>

        {/* URL Input Section */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 mb-8 border border-white/20 shadow-2xl">
            <form onSubmit={handleUrlSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-white font-semibold text-lg">
                  Enter YouTube URL
                </label>
                <div className="relative">
                  <input
                    ref={urlInputRef}
                    type="text"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className={`w-full px-6 py-4 bg-white/10 border-2 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-lg transition-all duration-300 ${
                      urlValidation.isValid === true ? 'border-green-500' : 
                      urlValidation.isValid === false ? 'border-red-500' : 
                      'border-white/30'
                    }`}
                    disabled={loading}
                    aria-describedby="url-help"
                  />
                  
                  {/* URL validation indicator */}
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {urlValidation.isValid === true && (
                      <CheckCircle className="text-green-500" size={20} />
                    )}
                    {urlValidation.isValid === false && (
                      <XCircle className="text-red-500" size={20} />
                    )}
                  </div>
                </div>
                
                {/* URL validation message */}
                <AnimatePresence>
                  {urlValidation.message && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={`flex items-center gap-2 text-sm ${
                        urlValidation.isValid ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {urlValidation.isValid ? (
                        <CheckCircle size={16} />
                      ) : (
                        <AlertCircle size={16} />
                      )}
                      {urlValidation.message}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading || !urlValidation.isValid}
                  className="flex-1 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 text-lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <TrendingUp size={20} />
                      Analyze Video
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setShowHelp(!showHelp)}
                  className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <HelpCircle size={20} />
                  Help
                </button>
              </div>
            </form>
          </div>

          {/* Help section */}
          <AnimatePresence>
            {showHelp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 overflow-hidden"
              >
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
                  <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
                    <Info size={20} />
                    How to Use
                  </h3>
                  <div className="space-y-3 text-gray-300">
                    <p>• Copy any YouTube video or playlist URL</p>
                    <p>• Paste it in the input field above</p>
                    <p>• Choose your preferred format and quality</p>
                    <p>• Click download and enjoy!</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-blue-500/20">
                    <h4 className="text-white font-medium mb-2">Supported URLs:</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      <p>• https://www.youtube.com/watch?v=...</p>
                      <p>• https://youtu.be/...</p>
                      <p>• https://www.youtube.com/playlist?list=...</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Video Info Card */}
        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto mb-8"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="grid lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="aspect-video rounded-2xl overflow-hidden shadow-lg">
                      <img 
                        src={videoInfo.thumbnail} 
                        alt={videoInfo.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-gray-300 mb-2">
                          <Clock size={16} />
                          <span className="text-sm">Duration</span>
                        </div>
                        <div className="text-white font-bold text-lg">
                          {formatDuration(videoInfo.duration)}
                        </div>
                      </div>
                      
                      <div className="bg-white/10 rounded-2xl p-4">
                        <div className="flex items-center gap-2 text-gray-300 mb-2">
                          <Eye size={16} />
                          <span className="text-sm">Views</span>
                        </div>
                        <div className="text-white font-bold text-lg">
                          {formatNumber(videoInfo.view_count)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-3">
                        {videoInfo.title}
                      </h3>
                      <div className="flex items-center gap-2 text-gray-300 mb-4">
                        <User size={16} />
                        <span>{videoInfo.uploader}</span>
                      </div>
                      <p className="text-gray-300 leading-relaxed line-clamp-3">
                        {videoInfo.description}
                      </p>
                    </div>
                    
                    {/* Enhanced Format Selection */}
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-white font-bold text-lg">Format</h4>
                          <button
                            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1"
                          >
                            <Settings size={16} />
                            <span className="text-sm">Advanced</span>
                          </button>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          {FORMATS.map((format) => {
                            const Icon = format.icon;
                            return (
                              <motion.button
                                key={format.value}
                                onClick={() => setSelectedFormat(format.value)}
                                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                                  selectedFormat === format.value 
                                    ? `bg-gradient-to-r ${format.color} border-white/30 text-white shadow-lg` 
                                    : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon size={24} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold">{format.label}</span>
                                      {format.recommended && (
                                        <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                                          Recommended
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-sm opacity-80">{format.description}</p>
                                    <div className="flex items-center gap-4 text-xs mt-2">
                                      <span>Size: {format.fileSize}</span>
                                      <span>Compatibility: {format.compatibility}</span>
                                    </div>
                                  </div>
                                </div>
                                {selectedFormat === format.value && (
                                  <div className="absolute top-2 right-2">
                                    <Check size={16} />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-white font-bold text-lg mb-4">Quality</h4>
                        <div className="grid grid-cols-2 gap-3">
                          {QUALITIES.map((quality) => {
                            const Icon = quality.icon;
                            return (
                              <motion.button
                                key={quality.value}
                                onClick={() => setSelectedQuality(quality.value)}
                                className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                                  selectedQuality === quality.value 
                                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-white/30 text-white shadow-lg' 
                                    : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center gap-3">
                                  <Icon size={20} />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold">{quality.label}</span>
                                      {quality.recommended && (
                                        <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                                          Recommended
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-xs opacity-80">{quality.description}</p>
                                    <div className="flex items-center gap-3 text-xs mt-1">
                                      <span>Size: {quality.size}</span>
                                      <span>Bandwidth: {quality.bandwidth}</span>
                                    </div>
                                  </div>
                                </div>
                                {selectedQuality === quality.value && (
                                  <div className="absolute top-2 right-2">
                                    <Check size={16} />
                                  </div>
                                )}
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                    
                    {/* Download Button */}
                    <motion.button
                      onClick={handleDownload}
                      className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Download size={24} />
                      Download {getSelectedFormat()?.label} - {getSelectedQuality()?.label}
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Playlist Info Card */}
        <AnimatePresence>
          {playlistInfo && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto mb-8"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="mb-8">
                  <h3 className="text-3xl font-bold text-white mb-4">
                    {playlistInfo.title}
                  </h3>
                  <div className="flex items-center gap-6 text-gray-300">
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{playlistInfo.uploader}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <List size={16} />
                      <span>{playlistInfo.entries?.length || 0} videos</span>
                    </div>
                  </div>
                </div>
                
                {/* Format Selection for Playlist */}
                <div className="space-y-6 mb-8">
                  <div>
                    <h4 className="text-white font-bold text-lg mb-4">Format</h4>
                    <div className="grid grid-cols-1 gap-3">
                      {FORMATS.map((format) => {
                        const Icon = format.icon;
                        return (
                          <motion.button
                            key={format.value}
                            onClick={() => setSelectedFormat(format.value)}
                            className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                              selectedFormat === format.value 
                                ? `bg-gradient-to-r ${format.color} border-white/30 text-white shadow-lg` 
                                : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={24} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold">{format.label}</span>
                                  {format.recommended && (
                                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm opacity-80">{format.description}</p>
                              </div>
                            </div>
                            {selectedFormat === format.value && (
                              <div className="absolute top-2 right-2">
                                <Check size={16} />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-white font-bold text-lg mb-4">Quality</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {QUALITIES.map((quality) => {
                        const Icon = quality.icon;
                        return (
                          <motion.button
                            key={quality.value}
                            onClick={() => setSelectedQuality(quality.value)}
                            className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left relative overflow-hidden ${
                              selectedQuality === quality.value 
                                ? 'bg-gradient-to-r from-indigo-500 to-purple-500 border-white/30 text-white shadow-lg' 
                                : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                            }`}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3">
                              <Icon size={20} />
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold">{quality.label}</span>
                                  {quality.recommended && (
                                    <span className="bg-yellow-500 text-black text-xs px-2 py-1 rounded-full">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs opacity-80">{quality.description}</p>
                              </div>
                            </div>
                            {selectedQuality === quality.value && (
                              <div className="absolute top-2 right-2">
                                <Check size={16} />
                              </div>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Download Playlist Button */}
                <motion.button
                  onClick={handleDownload}
                  className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 text-lg shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Download size={24} />
                  Download Playlist ({playlistInfo.entries?.length || 0} videos)
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Downloads Toggle */}
        <div className="flex justify-center mb-8">
          <motion.button
            onClick={() => setShowDownloads(!showDownloads)}
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 backdrop-blur-xl border border-white/20"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <List size={20} />
            {showDownloads ? 'Hide' : 'Show'} Downloads ({downloads.length})
          </motion.button>
        </div>

        {/* Downloads List */}
        <AnimatePresence>
          {showDownloads && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="max-w-6xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-white">Download History</h3>
                  <motion.button
                    onClick={refreshDownloads}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-2xl font-semibold transition-all duration-300 flex items-center gap-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <RefreshCw size={16} />
                    Refresh
                  </motion.button>
                </div>
                
                <div className="space-y-4">
                  {downloads.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-center py-12"
                    >
                      <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-400 text-lg">No downloads yet</p>
                      <p className="text-gray-500 text-sm mt-2">Your downloads will appear here</p>
                    </motion.div>
                  ) : (
                    downloads.map((download, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/10 rounded-2xl p-6 flex items-center justify-between hover:bg-white/20 transition-all duration-300"
                      >
                        <div className="flex-1">
                          <h4 className="text-white font-bold text-lg mb-2">{download.title}</h4>
                          <p className="text-gray-300 text-sm mb-3">
                            {download.format?.toUpperCase()} - {download.quality}
                          </p>
                          
                          {download.status === 'downloading' && (
                            <div className="space-y-2">
                              <div className="w-full bg-gray-700 rounded-full h-3">
                                <div 
                                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full transition-all duration-500"
                                  style={{ width: `${download.progress || 0}%` }}
                                />
                              </div>
                              <p className="text-sm text-gray-400">
                                {download.progress || 0}% complete
                              </p>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {download.status === 'pending' && (
                            <div className="flex items-center gap-2 text-yellow-400 bg-yellow-400/20 px-4 py-2 rounded-full">
                              <Loader2 className="animate-spin" size={16} />
                              <span>Pending</span>
                            </div>
                          )}
                          {download.status === 'downloading' && (
                            <div className="flex items-center gap-2 text-blue-400 bg-blue-400/20 px-4 py-2 rounded-full">
                              <Loader2 className="animate-spin" size={16} />
                              <span>Downloading</span>
                            </div>
                          )}
                          {download.status === 'completed' && (
                            <motion.button
                              onClick={() => handleFileDownload(download.id)}
                              className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-2xl transition-all duration-300"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Download size={16} />
                              <span>Download</span>
                            </motion.button>
                          )}
                          {download.status === 'error' && (
                            <div className="flex items-center gap-2 text-red-400 bg-red-400/20 px-4 py-2 rounded-full">
                              <XCircle size={16} />
                              <span>Error</span>
                            </div>
                          )}
                          
                          <motion.button
                            onClick={() => deleteDownload(download.id)}
                            className="p-3 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded-full transition-all duration-300"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;