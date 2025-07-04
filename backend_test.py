import requests
import unittest
import os
import time
from urllib.parse import urlparse

# Get the backend URL from the frontend .env file
with open('/app/frontend/.env', 'r') as f:
    for line in f:
        if line.startswith('REACT_APP_BACKEND_URL='):
            BACKEND_URL = line.strip().split('=')[1]
            break

class YouTubeDownloaderAPITest(unittest.TestCase):
    """Test suite for YouTube Downloader API"""
    
    def setUp(self):
        """Setup for each test"""
        self.api_url = BACKEND_URL
        self.valid_youtube_url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"  # Rick Astley - Never Gonna Give You Up
        self.valid_playlist_url = "https://www.youtube.com/playlist?list=PLFgquLnL59alCl_2TQvOiD5Vgm1hCaGSI"  # Short playlist
        self.invalid_url = "https://example.com/not-a-youtube-video"
        
    def test_01_root_endpoint(self):
        """Test the root endpoint"""
        response = requests.get(self.api_url)
        self.assertEqual(response.status_code, 200)
        self.assertIn("message", response.json())
        print("✅ Root endpoint test passed")
        
    def test_02_video_info_valid_url(self):
        """Test video info extraction with valid URL"""
        response = requests.post(f"{self.api_url}/api/video-info", json={"url": self.valid_youtube_url})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertIn("title", data["data"])
        self.assertIn("uploader", data["data"])
        self.assertIn("duration", data["data"])
        self.assertIn("formats", data["data"])
        print(f"✅ Video info test passed - Title: {data['data']['title']}")
        
    def test_03_video_info_invalid_url(self):
        """Test video info extraction with invalid URL"""
        response = requests.post(f"{self.api_url}/api/video-info", json={"url": self.invalid_url})
        self.assertNotEqual(response.status_code, 200)
        print("✅ Invalid URL handling test passed")
        
    def test_04_playlist_info_valid_url(self):
        """Test playlist info extraction with valid URL"""
        response = requests.post(f"{self.api_url}/api/playlist-info", json={"url": self.valid_playlist_url})
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertIn("title", data["data"])
        self.assertIn("entries", data["data"])
        print(f"✅ Playlist info test passed - Title: {data['data']['title']}")
        
    def test_05_download_initiation(self):
        """Test download initiation"""
        response = requests.post(
            f"{self.api_url}/api/download", 
            json={
                "url": self.valid_youtube_url,
                "format": "mp4",
                "quality": "360p"
            }
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("download_id", data)
        
        # Store download_id for next test
        self.download_id = data["download_id"]
        print(f"✅ Download initiation test passed - ID: {self.download_id}")
        
        # Wait a bit for download to start
        time.sleep(2)
        
    def test_06_download_status(self):
        """Test download status endpoint"""
        if not hasattr(self, 'download_id'):
            self.test_05_download_initiation()
            
        response = requests.get(f"{self.api_url}/api/download/{self.download_id}/status")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertIn("status", data["data"])
        self.assertIn("progress", data["data"])
        print(f"✅ Download status test passed - Status: {data['data']['status']}, Progress: {data['data']['progress']}%")
        
    def test_07_downloads_list(self):
        """Test downloads list endpoint"""
        response = requests.get(f"{self.api_url}/api/downloads")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        self.assertIn("data", data)
        self.assertIsInstance(data["data"], list)
        print(f"✅ Downloads list test passed - Count: {len(data['data'])}")
        
    def test_08_delete_download(self):
        """Test delete download endpoint"""
        if not hasattr(self, 'download_id'):
            self.test_05_download_initiation()
            
        response = requests.delete(f"{self.api_url}/api/download/{self.download_id}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data["success"])
        print(f"✅ Delete download test passed")
        
    def test_09_invalid_download_id(self):
        """Test invalid download ID handling"""
        invalid_id = "non-existent-id"
        response = requests.get(f"{self.api_url}/api/download/{invalid_id}/status")
        self.assertEqual(response.status_code, 404)
        print("✅ Invalid download ID handling test passed")

if __name__ == "__main__":
    print(f"🚀 Testing YouTube Downloader API at {BACKEND_URL}")
    unittest.main(verbosity=2)