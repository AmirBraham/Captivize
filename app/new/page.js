"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useRef, useState } from 'react';
import SidebarHeader from '@/components/SidebarHeader';

const tus = require('tus-js-client')
const projectId = 'mlgnxubgmzngsecafkgr'

export default function New() {
    // Creating a new project here
    const [file, setFile] = useState();
    const [fileEnter, setFileEnter] = useState(false);
    const fileInput = useRef(null)
    const [user, setUser] = useState(null)
    const [fileUploadProgress, setFileUploadProgress] = useState(0)
    const [videoStatus, setVideoStatus] = useState("")
    const supabase = createClientComponentClient();
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

    const fetchThumbnail = async (video_name, videoUrl) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const userFolderPath = `${user.id}`; // Construct the folder path for the user
            console.log(videoUrl)
            const response = await fetch(`http://localhost:5050/api/generate_thumbnail?video_url=${encodeURIComponent(videoUrl)}`)
            if (!response.ok) {
                throw new Error('Failed to generate thumbnail');
            }
            const blob = await response.blob();
            const fileName = userFolderPath + `/thumbnail-${video_name}.png`;
            const { data, error } = await supabase.storage.from('videos').upload(fileName, blob, {
                contentType: "image/png",
            });

            if (error) {
                console.log(error)
            }
            return data
        } catch (error) {
            console.error(error);
        }
    }
    const fetchCaptions = (videoUrl) => {
        return new Promise((resolve, reject) => {
            try {
                const captionsUrl = `http://localhost:5050/api/generate_captions?video_url=${encodeURIComponent(videoUrl)}`;
                const eventSource = new EventSource(captionsUrl);

                eventSource.addEventListener("progress", (event) => {
                    console.log(event.data);
                });

                eventSource.addEventListener("result", (event) => {
                    console.log(JSON.parse(event.data));
                    eventSource.close(); // Close the connection once the result is received
                    resolve(JSON.parse(event.data)); // Resolve the promise with the received data
                });

                eventSource.onerror = function (error) {
                    console.error('Error fetching captions:', error);
                    eventSource.close(); // Ensure the connection is closed on error
                    reject(error); // Reject the promise on error
                };
            } catch (error) {
                console.error('Error fetching captions:', error);
                reject(error); // Reject the promise if there is a catch block error
            }
        });
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
                    console.log(upload)
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
                        setVideoStatus("generating thumbnail...");
                        const thumbnail = await fetchThumbnail(upload.file.name, data.signedUrl)
                        console.log(thumbnail)
                        // Adding captions to project
                        setVideoStatus("generating captions...");

                        // const captions = await fetchCaptions(data.signedUrl)
                        // console.log(captions)
                        /* const { error } = await supabase.from("projects").update({
                            "captions": captions,
                        }).eq('id', projectData[0].id)
                        */
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
        <div className="flex flex-row h-screen">
            <SidebarHeader />
            <div className="flex  flex-col basis-[60%] p-8 bg-grey">
                <div className='basis-[60%] '>
                    <p className="text-3xl font-bold">Upload New Video</p>
                    <p className="text-base font-semibold text-gray-500">Upload a video and we will add captions to it.</p>
                    <div className="container rounded-xl bg-white p-2">


                        <form >
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
                                <div className='bg-white p-2'>
                                    <p className='text-lg text-off-black font-bold mb-2'>Upload your video file</p>
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
                                            }  bg-[#FBFBFB]  bg-white flex flex-col w-full w-5/6 mx-auto h-72 border-dashed rounded-xl items-center justify-center`}
                                    >

                                        <label
                                            htmlFor="file"
                                            className="h-full flex flex-col justify-center text-center text-slate"
                                        >
                                            <div className='self-center'>

                                                <svg width="41" height="33" viewBox="0 0 41 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M10.5415 25.25C8.30602 25.25 6.16208 24.4006 4.58134 22.8885C3.0006 21.3765 2.11255 19.3258 2.11255 17.1875C2.11255 15.0492 3.0006 12.9985 4.58134 11.4865C6.16208 9.97444 8.30602 9.125 10.5415 9.125C11.0695 6.77286 12.6141 4.70583 14.8354 3.37862C15.9353 2.72145 17.1683 2.26569 18.4639 2.03737C19.7595 1.80905 21.0924 1.81263 22.3864 2.04792C23.6805 2.2832 24.9104 2.74558 26.0059 3.40865C27.1014 4.07172 28.0411 4.9225 28.7713 5.91241C29.5015 6.90233 30.0079 8.01198 30.2616 9.17803C30.5153 10.3441 30.5113 11.5437 30.2499 12.7083H32.0415C33.7047 12.7083 35.2997 13.369 36.4757 14.545C37.6517 15.721 38.3124 17.316 38.3124 18.9792C38.3124 20.6423 37.6517 22.2373 36.4757 23.4133C35.2997 24.5893 33.7047 25.25 32.0415 25.25H30.2499" stroke="#49DE80" stroke-width="3.58333" stroke-linecap="round" stroke-linejoin="round" />
                                                    <path d="M14.125 19.875L19.5 14.5M19.5 14.5L24.875 19.875M19.5 14.5V30.625" stroke="#49DE80" stroke-width="3.58333" stroke-linecap="round" stroke-linejoin="round" />
                                                </svg>
                                            </div>

                                            Drop your video file or <span className='font-bold' >click here</span> to browse files.
                                        </label>

                                    </div>
                                </div>

                            ) : (

                                <div className="flex flex-col items-center">
                                    <video width="200" height="240" controls preload="none">
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
                    </div>
                </div>

            </div>
        </div>

    );
}