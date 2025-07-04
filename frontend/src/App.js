import React, { useState, useEffect } from 'react';
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
  RefreshCw
} from 'lucide-react';
import axios from 'axios';
import './App.css';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

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

  // Auto-refresh downloads status
  useEffect(() => {
    const interval = setInterval(() => {
      refreshDownloads();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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
    if (!url.trim()) {
      toast.error('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setVideoInfo(null);
    setPlaylistInfo(null);
    
    try {
      // Check if it's a playlist
      const isPlaylistUrl = url.includes('playlist?') || url.includes('&list=');
      setIsPlaylist(isPlaylistUrl);
      
      if (isPlaylistUrl) {
        const response = await axios.post(`${API_BASE_URL}/api/playlist-info`, { url });
        if (response.data.success) {
          setPlaylistInfo(response.data.data);
          toast.success('Playlist info loaded successfully!');
        }
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/video-info`, { url });
        if (response.data.success) {
          setVideoInfo(response.data.data);
          toast.success('Video info loaded successfully!');
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to load video info');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!videoInfo && !playlistInfo) {
      toast.error('Please load video info first');
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
      toast.error(error.response?.data?.detail || 'Failed to start download');
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <Toaster position="top-right" />
      
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-bold text-white mb-4 bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
            YouTube Downloader
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Download YouTube videos and playlists in high quality with multiple format options
          </p>
        </motion.div>

        {/* URL Input Form */}
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20"
        >
          <form onSubmit={handleUrlSubmit} className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="url"
                  placeholder="Paste YouTube URL here..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-6 py-4 bg-white/20 border border-white/30 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Loading...
                  </>
                ) : (
                  <>
                    <Link size={20} />
                    Get Info
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>

        {/* Video Info Card */}
        <AnimatePresence>
          {videoInfo && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="aspect-video rounded-lg overflow-hidden">
                    <img 
                      src={videoInfo.thumbnail} 
                      alt={videoInfo.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-300 mb-1">
                        <Clock size={16} />
                        Duration
                      </div>
                      <div className="text-white font-semibold">
                        {formatDuration(videoInfo.duration)}
                      </div>
                    </div>
                    
                    <div className="bg-white/10 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-gray-300 mb-1">
                        <Eye size={16} />
                        Views
                      </div>
                      <div className="text-white font-semibold">
                        {formatNumber(videoInfo.view_count)}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {videoInfo.title}
                    </h3>
                    <div className="flex items-center gap-2 text-gray-300 mb-4">
                      <User size={16} />
                      {videoInfo.uploader}
                    </div>
                    <p className="text-gray-300 leading-relaxed">
                      {videoInfo.description}
                    </p>
                  </div>
                  
                  {/* Format Selection */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-white font-semibold mb-2">Format:</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { value: 'mp4', label: 'MP4', icon: Video },
                          { value: 'webm', label: 'WebM', icon: FileVideo },
                          { value: 'mp3', label: 'MP3', icon: Music }
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => setSelectedFormat(value)}
                            className={`p-3 rounded-lg border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                              selectedFormat === value 
                                ? 'bg-purple-500 border-purple-400 text-white' 
                                : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            <Icon size={16} />
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-white font-semibold mb-2">Quality:</label>
                      <div className="grid grid-cols-4 gap-2">
                        {['360p', '480p', '720p', '1080p'].map((quality) => (
                          <button
                            key={quality}
                            onClick={() => setSelectedQuality(quality)}
                            className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                              selectedQuality === quality 
                                ? 'bg-purple-500 border-purple-400 text-white' 
                                : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                            }`}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Download Button */}
                  <button
                    onClick={handleDownload}
                    className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
                  >
                    <Download size={20} />
                    Download {selectedFormat.toUpperCase()} - {selectedQuality}
                  </button>
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
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8 border border-white/20"
            >
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {playlistInfo.title}
                </h3>
                <div className="flex items-center gap-2 text-gray-300 mb-4">
                  <User size={16} />
                  {playlistInfo.uploader}
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <List size={16} />
                  {playlistInfo.entries?.length || 0} videos
                </div>
              </div>
              
              {/* Format Selection for Playlist */}
              <div className="grid md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-white font-semibold mb-2">Format:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { value: 'mp4', label: 'MP4', icon: Video },
                      { value: 'webm', label: 'WebM', icon: FileVideo },
                      { value: 'mp3', label: 'MP3', icon: Music }
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedFormat(value)}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 flex items-center justify-center gap-2 ${
                          selectedFormat === value 
                            ? 'bg-purple-500 border-purple-400 text-white' 
                            : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        <Icon size={16} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-white font-semibold mb-2">Quality:</label>
                  <div className="grid grid-cols-4 gap-2">
                    {['360p', '480p', '720p', '1080p'].map((quality) => (
                      <button
                        key={quality}
                        onClick={() => setSelectedQuality(quality)}
                        className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                          selectedQuality === quality 
                            ? 'bg-purple-500 border-purple-400 text-white' 
                            : 'bg-white/10 border-white/30 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Download Playlist Button */}
              <button
                onClick={handleDownload}
                className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2 text-lg"
              >
                <Download size={20} />
                Download Playlist ({playlistInfo.entries?.length || 0} videos)
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Downloads Toggle */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setShowDownloads(!showDownloads)}
            className="px-6 py-3 bg-white/20 hover:bg-white/30 text-white rounded-xl font-semibold transition-all duration-300 flex items-center gap-2"
          >
            <List size={20} />
            {showDownloads ? 'Hide' : 'Show'} Downloads ({downloads.length})
          </button>
        </div>

        {/* Downloads List */}
        <AnimatePresence>
          {showDownloads && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">Download History</h3>
                <button
                  onClick={refreshDownloads}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition-all duration-300 flex items-center gap-2"
                >
                  <RefreshCw size={16} />
                  Refresh
                </button>
              </div>
              
              <div className="space-y-4">
                {downloads.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">No downloads yet</p>
                ) : (
                  downloads.map((download, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <h4 className="text-white font-semibold mb-1">{download.title}</h4>
                        <p className="text-gray-300 text-sm">
                          {download.format?.toUpperCase()} - {download.quality}
                        </p>
                        
                        {download.status === 'downloading' && (
                          <div className="mt-2">
                            <div className="w-full bg-gray-700 rounded-full h-2">
                              <div 
                                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${download.progress || 0}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-400 mt-1">
                              {download.progress || 0}% complete
                            </p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {download.status === 'pending' && (
                          <div className="flex items-center gap-2 text-yellow-400">
                            <Loader2 className="animate-spin" size={16} />
                            Pending
                          </div>
                        )}
                        {download.status === 'downloading' && (
                          <div className="flex items-center gap-2 text-blue-400">
                            <Loader2 className="animate-spin" size={16} />
                            Downloading
                          </div>
                        )}
                        {download.status === 'completed' && (
                          <button
                            onClick={() => handleFileDownload(download.id)}
                            className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-all duration-300"
                          >
                            <Download size={16} />
                            Download
                          </button>
                        )}
                        {download.status === 'error' && (
                          <div className="flex items-center gap-2 text-red-400">
                            <XCircle size={16} />
                            Error
                          </div>
                        )}
                        
                        <button
                          onClick={() => deleteDownload(download.id)}
                          className="p-2 text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default App;