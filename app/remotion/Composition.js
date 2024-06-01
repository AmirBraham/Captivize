import { AbsoluteFill, Video } from "remotion";


export const MyComposition = ({videoUrl}) => {
    return (
        <AbsoluteFill>
            <Video src={videoUrl} />
            <AbsoluteFill from={2} durationInFrames={20}>
                <h1 className="text-white">Testing captions</h1>
            </AbsoluteFill>
        </AbsoluteFill>
    );
};