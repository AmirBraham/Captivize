import React, { useState, useEffect } from 'react';

function CaptionGenerator({ videoUrl }) {
    const [transcription, setTranscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const fetchCaptions = async () => {
            try {
                const captionsUrl = `/api/generate_captions?video_url=${encodeURIComponent(videoUrl)}`;
                setLoading(true);

                const response = await fetch(captionsUrl);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }

                const data = await response.json();
                setTranscription(data);
            } catch (error) {
                console.error('Error fetching captions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCaptions();
    }, [videoUrl]);

    return (
        <div>
            {loading ? (
                <p>Loading...</p>
            ) : (
                <>
                    <p>Caption Generation Progress: {progress.toFixed(2)}%</p>
                    <progress value={progress} max="100" />
                    {transcription && (
                        <div>
                            <h2>Transcription Result:</h2>
                            <pre>{JSON.stringify(transcription, null, 2)}</pre>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default CaptionGenerator;