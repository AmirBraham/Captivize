from fastapi import FastAPI, HTTPException, Query
from pydantic import AnyUrl
import requests
from api.captions import transcribe
from fastapi.middleware.cors import CORSMiddleware
from tqdm import tqdm
from supabase import create_client, Client
import os
from dotenv import load_dotenv
import threading
from sse_starlette.sse import EventSourceResponse
import asyncio
import progressbar
import json
import stable_whisper
from pydantic import BaseModel
from moviepy.editor import VideoFileClip
from PIL import Image
from fastapi.responses import StreamingResponse


load_dotenv(".env.local")  # Make sure to have a .env.local at the root of the project
url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)
app = FastAPI()
RETRY_TIMEOUT = 15000  # milisecond


# add CORS so our web page can connect to our api
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/healthchecker")
def healthchecker():
    return {"status": "success", "message": "Integrate FastAPI Framework with Next.js"}


class MyProgressBar:
    def __init__(self):
        self.pbar = None
        self.progress = 0

    def __call__(self, block_num, block_size, total_size):
        # Visual progress bar on the server side
        if not self.pbar:
            self.pbar = progressbar.ProgressBar(maxval=total_size)
            self.pbar.start()

        downloaded = block_num * block_size
        if downloaded < total_size:
            self.pbar.update(downloaded)
        else:
            self.pbar.finish()
        # Updating progress attribute to send it to the frontend
        self.progress = block_num * block_size / total_size * 100


def download_video(url, local_path):
    with requests.get(url, stream=True) as r:
        r.raise_for_status()
        total_size = int(r.headers.get("Content-Length", 0))

        with open(local_path, "wb") as f, tqdm(
            desc=local_path,
            total=total_size,
            unit="B",
            unit_scale=True,
            unit_divisor=1024,
        ) as bar:
            for chunk in r.iter_content(chunk_size=1024):
                if chunk:
                    size = f.write(chunk)
                    progress_bar.progress = size / total_size
                    bar.update(size)


progress_bar = MyProgressBar()


@app.get("/api/generate_thumbnail")
async def generate_thumbnail(video_url: AnyUrl = Query(
        ..., description="The URL of the video to generate thumbnail for"
    )):
    print("generating thumbnails")
    # Route to generate a small thumbnail from a video_url
    video_path = "video_thumbnail.mp4"
    thumbnail_path = "thumbnail.png"
    resized_thumbnail_path = "resized_thumbnail.png"
    download_video(str(video_url), local_path=video_path)
    video = VideoFileClip(video_path)
    frame = video.get_frame(video.duration / 2)
    # Convert the frame to an image
    image = Image.fromarray(frame)
    image.save(thumbnail_path)
    os.remove(video_path)
    # Resize the image to a width of 200 pixels, maintaining aspect ratio
    image = Image.open(thumbnail_path)
    aspect_ratio = image.height / image.width
    new_width = 200
    new_height = int(new_width * aspect_ratio)
    resized_image = image.resize((new_width, new_height), Image.ANTIALIAS)
    resized_image.save(resized_thumbnail_path)
    os.remove(thumbnail_path)
    return StreamingResponse(open(resized_thumbnail_path, "rb"), media_type="image/png")


@app.get("/api/generate_captions")
async def generate_captions(
    video_url: AnyUrl = Query(
        ..., description="The URL of the video to generate captions for"
    )
):
    local_path = "video.mp4"
    transcription_result = {}

    def run_download():
        nonlocal transcription_result
        try:
            download_video(str(video_url), local_path=local_path)
            transcription_result = transcribe(file_path="video.mp4")
            progress_bar.progress = 100  # Enforcing the progress to be set to 100
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error retrieving video: {e}")

    threading.Thread(target=run_download).start()

    async def event_generator():
        while True:
            await asyncio.sleep(1)
            yield {
                "event": "progress",
                "retry": RETRY_TIMEOUT,
                "data": progress_bar.progress,
            }

            if progress_bar.progress >= 100:
                yield {"event": "result", "data": transcription_result}
                break

    return EventSourceResponse(event_generator())


class CaptionRegroupRequest(BaseModel):
    captions: str
    max_words: int


@app.post("/api/regroup_captions")
async def regroup_captions(request: CaptionRegroupRequest):
    file_path = "captions.json"
    with open(file_path, "w") as f:
        f.write(request.captions)

    result = stable_whisper.WhisperResult(result=file_path)
    result = result.split_by_length(max_words=request.max_words)
    result.save_as_json("captions.json")
    with open("captions.json", "r") as f:
        modified_captions = json.load(f)
    return modified_captions
