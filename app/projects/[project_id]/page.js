"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import config from "@/config";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Suspense, useEffect, useState } from 'react';
import { Player } from "@remotion/player";
import { MyComposition } from "@/app/remotion/Composition";
import apiClient from "@/libs/api";

export default function Project({ params }) {
    const supabase = createClientComponentClient();
    const { project_id } = params // fetching project_id from url params
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);
    const [error, setError] = useState(null);
    const [videoUrl, setVideoUrl] = useState(null)
    const [captions, setCaptions] = useState(null)
    const [maxWords, setMaxWords] = useState(3)

    useEffect(() => {
        if (captions && maxWords > 0) {
            console.log(maxWords)
            apiClient.post("/captions/regroup-captions",{
                captions: JSON.stringify(captions),
                max_words: maxWords
            }).then(data=>{
                setCaptions(data)
            })
        }
    }, [maxWords])
    useEffect(() => {
        const getProject = async () => {
            try {
                const { data: projectData, error: projectError } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', parseInt(project_id))
                    .single();

                if (projectError) {
                    setError('Error fetching project: ' + projectError.message);
                } else {
                    setProject(projectData);
                    setCaptions(projectData.captions)
                    const user_id = projectData.user_id;

                    // Fetching the corresponding video
                    const { data: signedUrlData, error: videoError } = await supabase
                        .storage
                        .from('videos')
                        .createSignedUrl(`${user_id}/${projectData.video_name}`, config.sessionDuration);

                    if (videoError) {
                        setError('Error fetching video: ' + videoError.message);
                    } else {
                        setVideoUrl(signedUrlData.signedUrl);
                    }
                }
            } catch (err) {
                setError('An unexpected error occurred: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (project_id) {
            getProject();
        } else {
            setError('Project ID is missing');
            setLoading(false);
        }
    }, [project_id]);


    return (
        <>
            <Suspense>
                <Header />
            </Suspense>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {
                project && (<>
                    <h2>{project.video_name}</h2>
                </>)
            }
            <input value={maxWords} onChange={e => {
                setMaxWords(e.target.value)

            }}>
            </input>
            <div className="flex flex-row w-10/12 mx-auto justify-between ">
                <div>
                    {captions === null ? null :
                        <div className="flex flex-col bg-slate-50">
                            {

                                captions["segments"].map((segment, i) =>
                                (<div key={i} className="">
                                    <p>{segment["start"]} - {segment["end"]}</p>

                                    <p>{segment["text"]}</p>
                                </div>)
                                )
                            }
                        </div>
                    }
                </div>
                {
                    /*
                    <div>
                    {videoUrl === null ? null : (
                        <Player
                            component={MyComposition}
                            durationInFrames={2000}
                            compositionWidth={281}
                            compositionHeight={500}
                            fps={24}
                            controls
                            inputProps={{ videoUrl, captions }}
                        />
                    )}
                </div>
                    */
                }
            </div>


            <Footer />
        </>
    );
}