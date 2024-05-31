import { useState, useEffect } from 'react';

function CaptionGenerator({ videoUrl }) {
    const [progress, setProgress] = useState(0);
    const [transcription, setTranscription] = useState(null);

    useEffect(() => {
        const eventSource = new EventSource(`/api/generate_captions?video_url=${encodeURIComponent(videoUrl)}`);

        eventSource.onmessage = (event) => {
            const { data } = event;
            const parsedData = JSON.parse(data);
            if (event.type === "progress") {
                setProgress(parseFloat(parsedData));
            } else if (event.type === "result") {
                setTranscription(parsedData);
                setProgress(100);
                eventSource.close();
            }
        };

        eventSource.onerror = (error) => {
            console.error('EventSource failed:', error);
            eventSource.close();
        };

        return () => {
            eventSource.close();
        };
    }, [videoUrl]);

    return (
        <div>
            <p>Caption Generation Progress: {progress.toFixed(2)}%</p>
            <progress value={progress} max="100" />
            {transcription && (
                <div>
                    <h2>Transcription Result:</h2>
                    <pre>{JSON.stringify(transcription, null, 2)}</pre>
                </div>
            )}
        </div>
    );
}

export default CaptionGenerator;