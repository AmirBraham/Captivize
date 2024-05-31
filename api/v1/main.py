from moviepy.editor import (
    VideoFileClip,
    ImageClip,
    CompositeVideoClip,
    AudioFileClip,
    CompositeAudioClip,
    vfx,
)
from intro import add_text_to_video, create_background_video
import json
import os
from api.v1.captions import transcribe
from manim import *
from api.v1.CaptionsAnimation import CaptionsAnimation
from api.v1.helpers import getCoordinates, cleanup
from mutagen.mp3 import MP3
from pathlib import Path
from pydub import AudioSegment

FORMATS = ["Vertical"]  # Formats to generate : you can add
FPS = 24


def generateCaptions(filename):
    if not os.path.isfile(filename.split(".")[0] + ".srt"):
        print("Generating Lyrics")
        transcribe(filename)
    print("Done generating Lyrics")


def generateCaptionsAnimation(filename):
    if not os.path.isfile("CaptionsAnimation.mp4"):
        print("Generating Captions Animation")
        w , h = 1320,520
        frame_rate = 10
        print(f"media/videos/{h}p{frame_rate}/CaptionsAnimation.mp4")
        with tempconfig({"frame_size": (w, h), "quality": "high_quality","frame_rate":frame_rate}):
            scene = CaptionsAnimation(
                filename=filename.split(".")[0] + ".srt", songFileName=filename
            )
            scene.render()
        os.system(f"mv media/videos/{h}p{frame_rate}/CaptionsAnimation.mp4 CaptionsAnimation.mp4")
    print("done generating lyrics")


with open("config.json") as f:
    data = json.load(f)
    renderingSettings = data["Rendering"]
    video_filename = data["Video"]

audio_filename = video_filename.split(".")[0] + ".mp3"
# converting mp4 to mp3
file_ = Path(video_filename.split(".")[0] + "mp3")
if not file_.exists():
    print("converting mp4 to mp3 to transcribe")
    video = VideoFileClip(video_filename)
    AudioSegment.from_file(video_filename).export(audio_filename, format="mp3")


def generateIntroClip(intro):
    (
        title,
        subtitle,
        textDuration,
        textStart,
        fontSize,
        fontFamily,
        textColor,
        duration,
        coordinates,
        backgroundSrc,
    ) = (
        intro["Title"],
        intro["Subtitle"],
        intro["TextDuration"],
        intro["TextStart"],
        intro["FontSize"],
        intro["FontFamily"],
        intro["TextColor"],
        intro["Duration"],
        intro["Coordinates"],
        intro["BackgroundSrc"],
    )
    backgroundSrc = f"main/{format}/" + backgroundSrc
    background_video = create_background_video(
        input_file=backgroundSrc, duration=duration
    )
    output = add_text_to_video(
        background_video,
        text=f"{title}\n{subtitle}",
        x_coordinate=coordinates[0],
        y_coordinate=coordinates[1],
        font_size=fontSize,
        font_family=fontFamily,
        text_color=textColor,
        text_start=textStart,
        text_duration=textDuration,
    )
    print("done generating intro video")
    return output


generateCaptions(audio_filename)
generateCaptionsAnimation(audio_filename)

for format in FORMATS:
    clips = []
    with open(f"main/{format}/config.json") as f:
        data = json.load(f)
        intro = data["Intro"]
        outro = data["Outro"]
        main = data["Main"]
        lyrics = main["Lyrics"]


    audio_FILE = MP3(audio_filename)
    main_clip = VideoFileClip(video_filename)
    
    intro_clip = generateIntroClip(intro=intro)
    # Background Clip

    # Since song starts at 00:00 , the background should stay until the song ends
    main_clip = main_clip.set_start(intro_clip.duration)

    # Lyrics Clip
    lyrics = main["Lyrics"]
    lyrics_delay = lyrics["Delay"]
    lyrics_coordinates = lyrics["Coordinates"]
    size = lyrics["Size"]
    lyrics_clip = VideoFileClip("CaptionsAnimation.mp4", has_mask=True)
    lyrics_clip = lyrics_clip.fx(vfx.mask_color, color=[0, 0, 0], s=4, thr=20)
    lyrics_clip = lyrics_clip.resize(width=size)

    lyrics_clip = lyrics_clip.set_start(lyrics_delay+intro_clip.duration)
    x, y = getCoordinates(
        background=main_clip, input=lyrics_clip, coordinates=lyrics_coordinates
    )

    lyrics_clip = lyrics_clip.set_position((x, y))

    # Foreground Image Clip for Background Clip
    foregroundElements = main["Foreground"]  # List of foreground elements
    foreground_clips = []

    for foreground in foregroundElements:
        if foreground["Src"] != "":
            # Load the image and resize it to the desired dimensions
            image_path = f"main/{format}/" + foreground["Src"]
            foreground_clip = ImageClip(image_path)
            foreground_clip = foreground_clip.resize(
                width=foreground["Size"]
            )  # Adjust width and height as needed

            # Calculate the center position for the image on the video
            image_x = foreground["Coordinates"][0]
            image_y = foreground["Coordinates"][1]
            x, y = getCoordinates(
                background=main_clip,
                input=foreground_clip,
                coordinates=(image_x, image_y),
            )
            # Set the image position on the video
            foreground_clip = foreground_clip.set_position((x, y))
            foreground_clip = foreground_clip.set_start(intro_clip.duration)
            foreground_clip = foreground_clip.set_duration(main_clip.duration)
            foreground_clips.append(foreground_clip)

    # Outro Clip
    (
        title,
        subtitle,
        textDuration,
        textStart,
        fontSize,
        fontFamily,
        textColor,
        duration,
        coordinates,
        backgroundSrc,
    ) = (
        outro["Title"],
        outro["Subtitle"],
        outro["TextDuration"],
        outro["TextStart"],
        outro["FontSize"],
        outro["FontFamily"],
        outro["TextColor"],
        outro["Duration"],
        outro["Coordinates"],
        outro["BackgroundSrc"],
    )
    backgroundSrc = f"main/{format}/" + backgroundSrc
    background_outro_video = create_background_video(
        input_file=backgroundSrc, duration=duration
    )
    outro_clip = add_text_to_video(
        background_outro_video,
        text=f"{title}\n{subtitle}",
        x_coordinate=coordinates[0],
        y_coordinate=coordinates[1],
        font_size=fontSize,
        font_family=fontFamily,
        text_color=textColor,
        text_start=textStart,
        text_duration=textDuration,
    )

    outro_clip = outro_clip.set_start(main_clip.duration + intro_clip.duration)

    clips.append(main_clip)
    clips.append(lyrics_clip)

    # Appending different clips in the right order
    if intro_clip.duration > 0:
        clips.append(intro_clip)

    for f in foreground_clips:
        clips.append(f)
    if outro_clip.duration > 0:
        clips.append(outro_clip)

    final_clip = CompositeVideoClip(clips, size=main_clip.size)
    audio_clip = AudioFileClip(audio_filename)
    
    if(intro_clip.duration > 0):
        new_audioclip = CompositeAudioClip([audio_clip.set_start(intro_clip.duration)])
    else:
        new_audioclip = CompositeAudioClip([audio_clip])
        
    final_clip.audio = new_audioclip
    if renderingSettings["PreviewMode"]:
        FPS = renderingSettings["Fps"]
        height = renderingSettings["Height"]
        duration = renderingSettings["Duration"]
        if height != 0:
            final_clip = final_clip.resize(height=height)
        if duration != 0:
            final_clip = final_clip.set_duration(duration)
    final_clip.write_videofile(
        filename=f"{format}.mp4",
        fps=FPS,
        temp_audiofile="song_temp.m4a",
        remove_temp=True,
        codec="libx264",
        audio_codec="aac",
    )


if renderingSettings["Cleanup"]:
    cleanup()
