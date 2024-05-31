import stable_whisper


def transcribe(file_path, text=""):
    model = stable_whisper.load_model("large-v2")
    result = model.transcribe(
        file_path,
        demucs=True,
        word_timestamps=True,
        regroup=True,
        vad=True,
        vad_threshold=0.35,
    )
    filename = file_path.split(".")[0]
    if len(text) > 5:
        print("Aligning with provided lyrics")
        aligned_result = model.align(file_path, text)
        result.adjust_by_result(aligned_result)
    result.to_srt_vtt("{}.srt".format(filename))
    result.save_as_json(filename)
    return result
