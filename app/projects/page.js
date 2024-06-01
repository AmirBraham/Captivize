"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Suspense, useEffect, useRef, useState } from 'react';
import ProjectsGrid from "@/components/ProjectGrid";
import CaptionGenerator from "@/components/CaptionGenerator"
import axios from "axios";
const tus = require('tus-js-client')
const projectId = 'mlgnxubgmzngsecafkgr'

export default function Projects() {

    const [file, setFile] = useState();
    const [fileEnter, setFileEnter] = useState(false);
    const fileInput = useRef(null)
    const [user, setUser] = useState(null)
    const [fileUploadProgress, setFileUploadProgress] = useState(0)
    const [videoStatus, setVideoStatus] = useState("")
    const supabase = createClientComponentClient();
    const [videoUploadUrl, setVideoUploadUrl] = useState(null)
    useEffect(() => {
        const fetchUser = async () => {
            try {
                const { data: { user }, error } = await supabase.auth.getUser()
                if (error) {
                    throw error;
                }
                setUser(user);
            } catch (error) {
                console.error('Error fetching user:', error.message);
            }
        };
        fetchUser()

    }, [])


    async function uploadFile(evt) {
        evt.preventDefault();
        const file = fileInput.current.files[0]
        const bucket = "videos"

        if (!user) {
            console.log("failed to upload , user issue")
        } else {
            await resumableUploadFile(bucket, file.name, file, user)
        }
    }
    const fetchCaptions = async (videoUrl) => {
        const timeout = 60000 * 60; // 1 hour
        try {
            const captionsUrl = `/api/generate_captions?video_url=${encodeURIComponent(videoUrl)}`;
            const response = await axios({
                url: captionsUrl, timeout: timeout, method: "get", headers: {
                    'Content-Type': 'application/json',
                }
            });
            const data = response.data
            console.log(data);
            return data;
        } catch (error) {
            console.error('Error fetching captions:', error);
        }
    };

    async function resumableUploadFile(bucketName, fileName, file, user) {
        const { data: { session } } = await supabase.auth.getSession();
        const userFolderPath = `${user.id}`; // Construct the folder path for the user
        return new Promise((resolve, reject) => {

            var upload = new tus.Upload(file, {
                endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable/${userFolderPath}`,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${session.access_token}`,
                    'x-upsert': 'true',
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true,
                metadata: {
                    bucketName: bucketName,
                    objectName: `${userFolderPath}/${fileName}`,
                    contentType: file.type,
                    cacheControl: 3600,
                },
                chunkSize: 6 * 1024 * 1024,
                onError: function (error) {
                    console.log('Failed because: ' + error);
                    setVideoStatus(error);
                    reject(error);
                },
                onProgress: function (bytesUploaded, bytesTotal) {
                    var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2);
                    setVideoStatus("uploading : " + percentage);
                    setFileUploadProgress(percentage);
                },
                onSuccess: async function () {
                    console.log('Download %s from %s', upload.file.name, upload.url);
                    setVideoStatus("success , creating new project that belongs to : " + user.id);

                    try {
                        const { data: projectData, error: projectError } = await supabase.from('projects').insert({
                            user_id: user.id,
                            video_name: upload.file.name
                        }).select();
                        if (projectError) {
                            console.log(projectError);
                        }
                        const { data, error: signedUrlError } = await supabase
                            .storage
                            .from(bucketName)
                            .createSignedUrl(`${userFolderPath}/${fileName}`, 3600 * 24); // URL valid for 24 hours
                        if (signedUrlError) {
                            console.log('Error creating signed URL:', signedUrlError);
                            reject(signedUrlError);
                            return;
                        }
                        // Adding captions to project
                        setVideoStatus("generating captions...");

                        const captions = await fetchCaptions(data.signedUrl)
                        const { error } = await supabase.from("projects").update({
                            "captions": captions,
                        }).eq('id', projectData[0].id)
                        console.log(error)
                        resolve();
                    } catch (error) {
                        console.log('Error inserting data after video upload : ');
                        reject(error);
                    }
                },
            });

            // Check if there are any previous uploads to continue.
            return upload.findPreviousUploads().then(function (previousUploads) {
                // Found previous uploads so we select the first one.
                if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0]);
                }

                // Start the upload
                upload.start();
            });
        });
    }

    return (
        <>
            <Suspense>
                <Header />
            </Suspense>
            {user && <ProjectsGrid user={user} />}
            <form className="container px-4 max-w-5xl mx-auto">
                <input
                    id="file"
                    type="file"
                    ref={fileInput}
                    className="hidden"
                    onChange={(e) => {
                        let files = e.target.files;
                        if (files && files[0]) {
                            let blobUrl = URL.createObjectURL(files[0]);
                            setFile(blobUrl);

                        }
                    }}
                />
                {!file ? (
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            setFileEnter(true);
                        }}
                        onDragLeave={(e) => {
                            setFileEnter(false);
                        }}
                        onDragEnd={(e) => {
                            e.preventDefault();
                            setFileEnter(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setFileEnter(false);
                            if (e.dataTransfer.items) {
                                [...e.dataTransfer.items].forEach((item, i) => {
                                    if (item.kind === "file") {
                                        const file = item.getAsFile();
                                        if (file) {
                                            let blobUrl = URL.createObjectURL(file);
                                            setFile(blobUrl);
                                        }
                                        console.log(`items file[${i}].name = ${file?.name}`);
                                    }
                                });
                            } else {
                                [...e.dataTransfer.files].forEach((file, i) => {
                                    console.log(`… file[${i}].name = ${file.name}`);
                                });
                            }
                        }}
                        className={`${fileEnter ? "border-4" : "border-2"
                            } mx-auto  bg-white flex flex-col w-full max-w-xs h-72 border-dashed items-center justify-center`}
                    >
                        <label
                            htmlFor="file"
                            className="h-full flex flex-col justify-center text-center"
                        >
                            Click to upload or drag and drop
                        </label>

                    </div>
                ) : (

                    <div className="flex flex-col items-center">
                        <video width="320" height="240" controls preload="none">
                            <source src={file} type="video/mp4" />

                            Your browser does not support the video tag.
                        </video>
                        <button
                            type="submit"
                            onClick={uploadFile}
                            className="px-4 mt-10 uppercase py-2 tracking-widest outline-none bg-green-600 text-white rounded"
                        >
                            Upload
                        </button>
                        {fileUploadProgress > 0 && <p>{fileUploadProgress} %</p>}
                        {videoStatus != "" && <p>{videoStatus} %</p>}

                        <button
                            onClick={() => setFile("")}
                            className="px-4 mt-10 uppercase py-2 tracking-widest outline-none bg-red-600 text-white rounded"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </form>
            );
            <Footer />
        </>
    );
}
