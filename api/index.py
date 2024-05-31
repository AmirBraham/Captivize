from fastapi import FastAPI, HTTPException, Query
from pydantic import AnyUrl
from sse_starlette.sse import EventSourceResponse
import urllib.request
import time
import threading
import progressbar
import asyncio
from api.captions import transcribe

app = FastAPI(docs_url="/api/docs", openapi_url="/api/openapi.json")


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


def download_video(url, progress_bar):
    urllib.request.urlretrieve(url, "video.mp4", progress_bar.update)


@app.get("/api/generate_captions")
async def generate_captions(
    video_url: AnyUrl = Query(
        ..., description="The URL of the video to generate captions for"
    )
):
    progress_bar = MyProgressBar()
    transcription_result = {}

    def run_download():
        nonlocal transcription_result
        try:
            download_video(str(video_url), progress_bar)
            transcription_result = transcribe(file_path="video.mp4")
            progress_bar.progress = 100  # Enforcing the progress to be set to 100
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error retrieving video: {e}")

    threading.Thread(target=run_download).start()

    async def event_generator():
        while True:
            await asyncio.sleep(1)
            yield {"event": "progress", "data": f"{progress_bar.get_progress():.2f}"}
            if progress_bar.get_progress() >= 100:
                yield {"event": "result", "data": transcription_result}
                break

    return EventSourceResponse(event_generator())
