import { AbsoluteFill, Video } from "remotion";


export const MyComposition = ({videoUrl}) => {
    return (
        <AbsoluteFill>
            <Video src={videoUrl} />
            <AbsoluteFill from={10} durationInFrames={20}>
                <h1>This text appears on top of the video!</h1>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};