from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.security import HTTPBearer
import yt_dlp
import os
import json
import asyncio
import uuid
from datetime import datetime
from typing import Optional, List
import firebase_admin
from firebase_admin import credentials, firestore
from pydantic import BaseModel
import tempfile
import shutil
from pathlib import Path

app = FastAPI(title="YouTube Downloader API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Firebase Admin SDK setup
if not firebase_admin._apps:
    # For now, we'll use a dummy certificate - user needs to add their service account key
    try:
        cred = credentials.Certificate("firebase-admin.json")
        firebase_admin.initialize_app(cred)
        db = firestore.client()
        firebase_enabled = True
    except:
        print("Firebase not configured - running without database")
        firebase_enabled = False
        db = None

# Security
security = HTTPBearer()

# Models
class VideoInfo(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    format: str = "mp4"
    quality: str = "720p"

class PlaylistRequest(BaseModel):
    url: str
    format: str = "mp4"
    quality: str = "720p"

# Global variables for download management
downloads = {}
download_folder = "/tmp/downloads"
os.makedirs(download_folder, exist_ok=True)

# Helper functions
def get_video_info(url: str):
    """Get video information using yt-dlp"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': False,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                'id': info.get('id'),
                'title': info.get('title'),
                'uploader': info.get('uploader'),
                'duration': info.get('duration'),
                'view_count': info.get('view_count'),
                'thumbnail': info.get('thumbnail'),
                'description': info.get('description', '')[:500] + '...' if info.get('description') else '',
                'upload_date': info.get('upload_date'),
                'formats': [
                    {
                        'format_id': f.get('format_id'),
                        'ext': f.get('ext'),
                        'quality': f.get('quality'),
                        'filesize': f.get('filesize'),
                        'vcodec': f.get('vcodec'),
                        'acodec': f.get('acodec'),
                        'format_note': f.get('format_note')
                    }
                    for f in info.get('formats', [])
                    if f.get('ext') in ['mp4', 'webm', 'mp3', 'm4a']
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting video info: {str(e)}")

def get_playlist_info(url: str):
    """Get playlist information using yt-dlp"""
    ydl_opts = {
        'quiet': True,
        'no_warnings': True,
        'extract_flat': True,
    }
    
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            return {
                'id': info.get('id'),
                'title': info.get('title'),
                'uploader': info.get('uploader'),
                'entries': [
                    {
                        'id': entry.get('id'),
                        'title': entry.get('title'),
                        'url': entry.get('url'),
                        'duration': entry.get('duration')
                    }
                    for entry in info.get('entries', [])
                ]
            }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error extracting playlist info: {str(e)}")

async def download_video(download_id: str, url: str, format: str, quality: str):
    """Download video in background"""
    try:
        downloads[download_id]['status'] = 'downloading'
        downloads[download_id]['progress'] = 0
        
        # Set up download options
        output_path = os.path.join(download_folder, f"{download_id}.%(ext)s")
        
        def progress_hook(d):
            if d['status'] == 'downloading':
                if d.get('total_bytes'):
                    progress = (d['downloaded_bytes'] / d['total_bytes']) * 100
                    downloads[download_id]['progress'] = round(progress, 2)
                elif d.get('total_bytes_estimate'):
                    progress = (d['downloaded_bytes'] / d['total_bytes_estimate']) * 100
                    downloads[download_id]['progress'] = round(progress, 2)
            elif d['status'] == 'finished':
                downloads[download_id]['status'] = 'completed'
                downloads[download_id]['progress'] = 100
                downloads[download_id]['filename'] = d['filename']
        
        ydl_opts = {
            'format': f'best[height<={quality[:-1]}]' if quality != 'best' else 'best',
            'outtmpl': output_path,
            'progress_hooks': [progress_hook],
            'quiet': True,
            'no_warnings': True,
        }
        
        if format == 'mp3':
            ydl_opts.update({
                'format': 'bestaudio/best',
                'postprocessors': [{
                    'key': 'FFmpegExtractAudio',
                    'preferredcodec': 'mp3',
                    'preferredquality': '192',
                }],
            })
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        
        # Save download history to Firebase
        if firebase_enabled and db:
            try:
                doc_ref = db.collection('downloads').document(download_id)
                doc_ref.set({
                    'url': url,
                    'format': format,
                    'quality': quality,
                    'status': 'completed',
                    'created_at': datetime.now(),
                    'title': downloads[download_id].get('title', 'Unknown')
                })
            except Exception as e:
                print(f"Error saving to Firebase: {e}")
        
    except Exception as e:
        downloads[download_id]['status'] = 'error'
        downloads[download_id]['error'] = str(e)

# API Routes
@app.get("/")
async def root():
    return {"message": "YouTube Downloader API is running! 🚀"}

@app.post("/api/video-info")
async def get_video_info_endpoint(video_info: VideoInfo):
    """Get video information"""
    try:
        info = get_video_info(video_info.url)
        return {"success": True, "data": info}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/playlist-info")
async def get_playlist_info_endpoint(video_info: VideoInfo):
    """Get playlist information"""
    try:
        info = get_playlist_info(video_info.url)
        return {"success": True, "data": info}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.post("/api/download")
async def download_video_endpoint(download_request: DownloadRequest, background_tasks: BackgroundTasks):
    """Start video download"""
    try:
        # Get video info first
        video_info = get_video_info(download_request.url)
        
        # Generate download ID
        download_id = str(uuid.uuid4())
        
        # Initialize download tracking
        downloads[download_id] = {
            'status': 'pending',
            'progress': 0,
            'url': download_request.url,
            'format': download_request.format,
            'quality': download_request.quality,
            'title': video_info.get('title', 'Unknown'),
            'created_at': datetime.now().isoformat()
        }
        
        # Start download in background
        background_tasks.add_task(
            download_video,
            download_id,
            download_request.url,
            download_request.format,
            download_request.quality
        )
        
        return {
            "success": True,
            "download_id": download_id,
            "message": "Download started successfully!"
        }
    
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/download/{download_id}/status")
async def get_download_status(download_id: str):
    """Get download status"""
    if download_id not in downloads:
        raise HTTPException(status_code=404, detail="Download not found")
    
    return {"success": True, "data": downloads[download_id]}

@app.get("/api/download/{download_id}/file")
async def download_file(download_id: str):
    """Download the completed file"""
    if download_id not in downloads:
        raise HTTPException(status_code=404, detail="Download not found")
    
    download_info = downloads[download_id]
    
    if download_info['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Download not completed")
    
    if 'filename' not in download_info:
        raise HTTPException(status_code=404, detail="File not found")
    
    filename = download_info['filename']
    if not os.path.exists(filename):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Get the original title for filename
    title = download_info.get('title', 'download')
    ext = os.path.splitext(filename)[1]
    safe_filename = f"{title}{ext}".replace('/', '_').replace('\\', '_')
    
    return FileResponse(
        filename,
        media_type='application/octet-stream',
        filename=safe_filename
    )

@app.get("/api/downloads")
async def get_downloads():
    """Get all download history"""
    return {"success": True, "data": list(downloads.values())}

@app.delete("/api/download/{download_id}")
async def delete_download(download_id: str):
    """Delete a download"""
    if download_id not in downloads:
        raise HTTPException(status_code=404, detail="Download not found")
    
    # Delete file if exists
    download_info = downloads[download_id]
    if 'filename' in download_info and os.path.exists(download_info['filename']):
        try:
            os.remove(download_info['filename'])
        except Exception as e:
            print(f"Error deleting file: {e}")
    
    # Remove from tracking
    del downloads[download_id]
    
    return {"success": True, "message": "Download deleted successfully"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)