import { AbsoluteFill, Video } from "remotion";


export const MyComponent = ({ videoURL }) => {
    return (
        <AbsoluteFill>
            <Video src={videoURL} />
        </AbsoluteFill>
    );
};