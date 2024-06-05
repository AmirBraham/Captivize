from fastapi import FastAPI, BackgroundTasks, HTTPException, Query
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
    with open(file_path,"w") as f:
        f.write(request.captions)
        
    print(request.max_words)
    result = stable_whisper.WhisperResult(result=file_path)
    result = result.split_by_length(max_words=request.max_words)
    print("Split segments by max words")
    result.save_as_json("captions.json")
    with open("captions.json", "r") as f:
        modified_captions = json.load(f)
    return modified_captions

