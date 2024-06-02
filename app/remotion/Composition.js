import { AbsoluteFill, Sequence, Video ,useCurrentFrame} from "remotion";
import React from 'react';


const styles = {
    captionContainer: {
        position: 'absolute',
        bottom: '20px', // Adjust this value to move the captions up or down
        width: '100%',
        textAlign: 'center',
    },
    captionText: {
        color: 'white',
        fontSize: '24px', // Adjust this value for font size
    },
    highlightedText: {
        color: 'yellow', // Highlight color
        fontWeight: 'bold',
    },
};

export const MyComposition = ({ videoUrl, captions }) => {
    const frame =useCurrentFrame()
    return (
        <AbsoluteFill>
            <Video src={videoUrl} />
            {
                captions["segments"].map((segment, i) => {
                    return (
                        <Sequence key={i} from={segment["start"] * 24} durationInFrames={(segment["end"] - segment["start"]) * 24}>
                            <Caption frame={frame} segment={segment} />
                        </Sequence>
                    );
                })
            }
        </AbsoluteFill>
    );
};

const Caption = ({ frame,segment }) => {
    const frameRate = 24; // Assuming a frame rate of 24fps
    const currentTime = frame / frameRate;
    console.log("current frame :" , frame)
    return (
        <div style={styles.captionContainer}>
            <h1 style={styles.captionText}>
                {segment.words.map((word, index) => {
                    console.log(word.start , word.end)
                    const isHighlighted = currentTime >= word.start && currentTime <= word.end;
                    return (
                        <span
                            key={index}
                            style={isHighlighted ? styles.highlightedText : undefined}
                        >
                            {word.word}
                        </span>
                    );
                })}
            </h1>
        </div>
    );
};