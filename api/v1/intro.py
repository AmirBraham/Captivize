import json
from moviepy.editor import *
import os
from api.v1.helpers import getCoordinates,getMoviePyFont   
def create_background_video(input_file, duration=60):
    _, file_extension = os.path.splitext(input_file)

    if file_extension.lower() in ['.jpg', '.jpeg', '.png', '.gif']:
        # If the input file is an image
        img = ImageClip(input_file, duration=duration)
        video = img.set_duration(duration)
    elif file_extension.lower() in ['.mp4', '.avi', '.mkv']:
        # If the input file is a video
        video = VideoFileClip(input_file)
        # Calculate the number of repetitions needed to achieve the desired loop duration
        num_repetitions = int(duration / video.duration) + 1
        # Create a looped version of the video
        video = video.loop(n=num_repetitions)

    else:
        print("Unsupported file format.")
        return

    return video
    # video.write_videofile(output_file,fps=24, codec='libx264', audio_codec='aac')


def add_text_to_video(input_video, text, x_coordinate=0, y_coordinate=0, font_size=70, font_family="Arial", text_color="yellow", text_start=1, text_duration=5):
    # Load your video clip
    video_clip = input_video
    # Create the text clip
   
    text_clip = TextClip(
        txt=text,
        fontsize=font_size,
        font=getMoviePyFont(font_family),
        color=text_color,
        size=video_clip.size
    )
    # Set the text position
    x, y = getCoordinates(background=video_clip,input=text_clip,coordinates=(x_coordinate,y_coordinate))
    text_clip = text_clip.set_position((x,y))
    text_clip = text_clip.set_start(text_start).set_duration(
        text_duration).crossfadein(1)
    text_clip = text_clip.crossfadeout(1)
    # Overlay the text clip on the video clip
    video_with_text = CompositeVideoClip([video_clip, text_clip])
    return video_with_text


