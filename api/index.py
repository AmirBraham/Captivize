from fastapi import FastAPI, BackgroundTasks, Query
from pydantic import AnyUrl
import requests
from api.captions import transcribe
from fastapi.middleware.cors import CORSMiddleware
from tqdm import tqdm
from supabase import create_client, Client
import os
import time

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)


app = FastAPI()


# add CORS so our web page can connect to our api
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/healthchecker")
def healthchecker():
    return {"status": "success", "message": "Integrate FastAPI Framework with Next.js"}


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
                    bar.update(size)


@app.get("/api/generate_captions")
async def generate_captions(
    video_url: AnyUrl = Query(
        ..., description="The URL of the video to generate captions for"
    )
):
    local_path = "video.mov"
    download_video(str(video_url), local_path)
    transcription_result = transcribe(file_path=local_path)
    return transcription_result
