import stable_whisper
import pysrt
import re
import json


def subripitem_to_dict(item):
    return {
        "index": item.index,
        "start": str(item.start),
        "end": str(item.end),
        "text": item.text,
    }


def convert_to_seconds(time_str):
    hours, minutes, seconds_ms = time_str.split(":")
    seconds, milliseconds = seconds_ms.split(",")
    hours = int(hours)
    minutes = int(minutes)
    seconds = int(seconds)
    milliseconds = int(milliseconds)
    total_seconds = (hours * 3600) + (minutes * 60) + seconds + (milliseconds / 1000)

    return total_seconds


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


def transcribe(file_path, text=""):
    model = stable_whisper.load_model("base")
    result = model.transcribe(
        file_path,
        demucs=True,
        word_timestamps=True,
        regroup=True,
        vad=True,
        vad_threshold=0.35,
    )
    if len(text) > 5:
        print("Aligning with provided lyrics")
        aligned_result = model.align(file_path, text)
        result.adjust_by_result(aligned_result)
    result = (
        result.clamp_max()
        .split_by_punctuation([(".", " "), "。", "?", "？", (",", " "), "，"])
        .split_by_gap(0.2)
        .merge_by_gap(0.3, max_words=3)
        .split_by_punctuation([(".", " "), "。", "?", "？"])
    )
    result.save_as_json("captions.json")
    with open("captions.json", "r") as f:
        captions = json.load(f)
    print("done generating captions")
    return captions


if __name__ == "__main__":
    print(
        transcribe(
            "wait-for-catwomans-entrance-batman-returns-shorts-batman-1920-1080.mov"
        )
    )
