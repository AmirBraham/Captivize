from manim import *
from manim.camera.camera import Camera
import pysrt
import re
import json
from api.v1.helpers import convert_to_seconds
import stable_whisper
from mutagen.mp3 import MP3
import ffmpeg


def textToTextMarkup(text, highlightColor="#FF0000", one_word_only=False):
    pattern = r'<font color="(.*?)">(.*?)</font>'
    parts = re.split(pattern, text, maxsplit=1)
    if len(parts) < 4:
        return ""

    text_before_match = parts[0]
    matched_color = parts[1]
    matched_content = parts[2]
    text_after_match = parts[3]
    content = rf'<span fgcolor="{highlightColor}">{matched_content}</span>'
    return text_before_match + content + text_after_match


def cleanup_subs(subs):
    pattern = r'<font color="(.*?)">(.*?)</font>'
    threshold = 0.01
    subs = [
        sub
        for sub in subs
        if convert_to_seconds(str(sub.end)) - convert_to_seconds(str(sub.start))
        > threshold
    ]
    subs = [sub for sub in subs if bool(re.search(pattern, sub.text))]

    i = 0
    newSentence = True
    grouped_subs = []  # group subs that belong to the same sentence
    L = []
    for sub in subs:
        L.append(sub)
        if sub.text.endswith("</font>"):
            grouped_subs.append(L)
            L = []
    max_words = 3
    for grouped_sub in grouped_subs:
        if len(grouped_sub) < max_words + 2:
            # we can keep the whole grouped_subs
            continue
        else:
            text_remove_after = grouped_sub[max_words].text.split("</font>", 1)[1]
            text_remove_before = grouped_sub[max_words + 1].text.split("<font", 1)[0]
            for i in range(len(grouped_sub)):
                if i <= max_words:
                    grouped_sub[i].text = grouped_sub[i].text.replace(
                        text_remove_after, ""
                    )
                if i > max_words:
                    grouped_sub[i].text = grouped_sub[i].text.replace(
                        text_remove_before, ""
                    )

    return [item for grouped_sub in grouped_subs for item in grouped_sub]


def insert_line_break(text, words_per_line=4):
    pattern = r'<span fgcolor="(.*?)">(.*?)</span>'
    parts = re.split(pattern, text, maxsplit=1)
    if len(parts) < 4:
        return text
    text_before_match = parts[0]
    matched_color = parts[1]
    matched_content = parts[2]
    text_after_match = parts[3]
    content = rf'<span fgcolor="{matched_color}">{matched_content}</span>'

    mod_sub = re.sub(pattern, "#", text)
    words = mod_sub.split()
    lines = [
        " ".join(words[i : i + words_per_line])
        for i in range(0, len(words), words_per_line)
    ]
    result = "\r".join(lines)
    result = re.sub("#", content, result)
    return result


class CaptionsAnimation(Scene):
    def __init__(self, filename="", songFileName=""):
        super().__init__()
        self.filename = filename  # srt file
        self.songFileName = songFileName

    def construct(self):
        f = open("config.json")
        data = json.load(f)
        lyricsConfig = data["Captions"]
        fontFamily, fontSize, color, highlightColor, delay, wait = (
            lyricsConfig["FontFamily"],
            lyricsConfig["FontSize"],
            lyricsConfig["Color"],
            lyricsConfig["HighlightColor"],
            lyricsConfig["Delay"],
            lyricsConfig["Wait"],
        )
        renderingConfig = data["Rendering"]
        previewMode, duration = (
            renderingConfig["PreviewMode"],
            renderingConfig["Duration"],
        )
        if self.filename == "":
            print("no srt file provided. Exiting")
            return
        if self.songFileName != "":
            self.add_sound(self.songFileName)

        result = stable_whisper.WhisperResult(self.filename.split(".")[0] + ".json")
        (
            result.clamp_max()
            .split_by_punctuation([(".", " "), "。", "?", "？", (",", " "), "，"])
            .split_by_gap(0.2)
            .merge_by_gap(.3, max_words=3)
            .split_by_punctuation([(".", " "), "。", "?", "？"])
        )
        print("modifying results")
        result.save_as_json("results.json")
        result.to_srt_vtt("results.srt")
        subs = pysrt.open("results.srt")
        subs = cleanup_subs(subs)
        lyrics = [
            insert_line_break(textToTextMarkup(sub.text, highlightColor))
            for sub in subs
        ]
        lyrics_timestamps = [
            (convert_to_seconds(str(sub.start)), convert_to_seconds(str(sub.end)))
            for sub in subs
        ]
        lyric = MarkupText(
            "", font_size=fontSize, font=fontFamily, weight=BOLD, color=color
        )
        time = 0
        index = 0
        lyricHangTime = 1.5  # in seconds

        def update_text(obj, dt):
            nonlocal time
            nonlocal index
            time += dt
            start = lyrics_timestamps[index][0]
            end = lyrics_timestamps[index][1]
            if time >= start and time <= end:
                newLyric = MarkupText(
                    lyrics[index],
                    font=fontFamily,
                    weight=BOLD,
                    color=color,
                    line_spacing=0.4,
                    font_size=fontSize,
                    width=self.camera.frame_width * 0.8,
                )
                obj.become(newLyric)
            elif time >= start and index < len(lyrics_timestamps) - 1:
                index = index + 1
            elif (
                index + 1 < len(lyrics_timestamps) - 1
                and abs(time - lyrics_timestamps[index + 1][0]) < lyricHangTime
            ):
                obj.become(MarkupText(""))

        lyric.add_updater(update_text)
        self.add(lyric)
        audio = MP3(self.songFileName)
        audioDuration = audio.info.length
        if previewMode and duration != 0:
            self.wait(duration)
        else:
            self.wait(audioDuration)


if __name__ == "__main__":
    with tempconfig(
        {"preview": True, "frame_size": (1320, 520), "quality": "medium_quality"}
    ):
        scene = CaptionsAnimation(filename="Burn.srt", songFileName="Burn.mp3")
        scene.render()
