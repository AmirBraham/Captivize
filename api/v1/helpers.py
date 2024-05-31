import os
import shutil
from moviepy.editor import TextClip
from Levenshtein import distance


def convert_to_seconds(time_str):
    # Split the time string into its components
    hours, minutes, seconds_ms = time_str.split(":")
    seconds, milliseconds = seconds_ms.split(",")

    # Convert each component to an integer
    hours = int(hours)
    minutes = int(minutes)
    seconds = int(seconds)
    milliseconds = int(milliseconds)

    # Calculate total seconds
    total_seconds = (hours * 3600) + (minutes * 60) + \
        seconds + (milliseconds / 1000)

    return total_seconds


def getCoordinates(background,input,coordinates):
    #Calculates actual pixel value from relative (x,y) pos
    x,y = coordinates # in percentage x : 0 -> 1
    width , height = background.size
    input_w,input_h = input.size

    return (x*width-(input_w/2),y*height-(input_h/2))



def cleanup():
    print("Cleaning up ! Don't quit")
    if (os.path.isfile("SoundVisualizer.mp4")):
        print("removing visualizer.mov")
        os.remove("SoundVisualizer.mp4")
    if (os.path.isfile("sample.json")):
        print("removing sample.json")
        os.remove("sample.json")
    if (os.path.isfile("results.json")):
        print("removing results.json")
        os.remove("results.json")
    if (os.path.isfile("results.srt")):
        print("removing results.srt")
        os.remove("results.srt")
    if (os.path.isfile("CaptionsAnimation.mp4")):
        print("removing CaptionsAnimation.mp4")
        os.remove("CaptionsAnimation.mp4")
    if os.path.exists("videos"):
        shutil.rmtree("videos")
    if os.path.exists("images"):
        shutil.rmtree("images")
    if os.path.exists("texts"):
        shutil.rmtree("texts")



def getMoviePyFont(font_family):
    closest_font = ""
    minDistance = float("inf")
    font_family = "Montserrat"
    font_family = "-".join(font_family.split(" "))
    for font in TextClip.list("font"):
        d = distance(font_family,font)
        if(d <= minDistance):
            minDistance = d
            closest_font = font
    return closest_font