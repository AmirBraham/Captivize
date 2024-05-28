"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Suspense, useRef, useState } from 'react';
import { useRouter } from 'next/navigation'
import ButtonAccount from "@/components/ButtonAccount";

const tus = require('tus-js-client')
const projectId = 'mlgnxubgmzngsecafkgr'

export default function Projects() {

    const [file, setFile] = useState();
    const [fileEnter, setFileEnter] = useState(false);
    const fileInput = useRef(null)
    const [fileUploadProgress, setFileUploadProgress] = useState(0)
    const [videoStatus,setVideoStatus] = useState("")
    const supabase = createClientComponentClient();




    async function uploadFile(evt) {
        evt.preventDefault();

        const file = fileInput.current.files[0]

        const bucket = "videos"
        console.log(file)
        // Call Storage API to upload file
        const res = await resumableUploadFile(bucket, file.name, file)
        console.log(res)
    }

    async function resumableUploadFile(bucketName, fileName, file) {
        const { data: { session } } = await supabase.auth.getSession()
        const {data:{user},error} = await supabase.auth.getUser()
        
        return new Promise((resolve, reject) => {
            var upload = new tus.Upload(file, {
                endpoint: `https://${projectId}.supabase.co/storage/v1/upload/resumable`,
                retryDelays: [0, 3000, 5000, 10000, 20000],
                headers: {
                    authorization: `Bearer ${session.access_token}`,
                    'x-upsert': 'true', // optionally set upsert to true to overwrite existing files
                },
                uploadDataDuringCreation: true,
                removeFingerprintOnSuccess: true, // Important if you want to allow re-uploading the same file https://github.com/tus/tus-js-client/blob/main/docs/api.md#removefingerprintonsuccess
                metadata: {
                    bucketName: bucketName,
                    objectName: fileName,
                    contentType: 'video/mp4',
                    cacheControl: 3600,
                },
                chunkSize: 6 * 1024 * 1024, // NOTE: it must be set to 6MB (for now) do not change it
                onError: function (error) {
                    console.log('Failed because: ' + error)
                    setVideoStatus(error)
                    reject(error)
                },
                onProgress: function (bytesUploaded, bytesTotal) {
                    var percentage = ((bytesUploaded / bytesTotal) * 100).toFixed(2) 
                    console.log(bytesUploaded, bytesTotal, percentage + '%')
                    setVideoStatus("uploading : " + percentage)
                    setFileUploadProgress(percentage)
                },
                onSuccess: async function () {
                    console.log('Download %s from %s', upload.file.name, upload.url)
                    setVideoStatus("success , creating new project that belong to : " + user.id)

                    try {
                        const {error} =  await supabase.from('projects').insert({
                            user_id:user.id,
                            video_name: upload.file.name
                        })
                        if(error) {
                            console.log(error)
                        }
                        resolve()
                    } catch (error) {
                        console.log('Error inserting data after video upload : ')
                        reject(error)
                    }

                },
            })


            // Check if there are any previous uploads to continue.
            return upload.findPreviousUploads().then(function (previousUploads) {
                // Found previous uploads so we select the first one.
                if (previousUploads.length) {
                    upload.resumeFromPreviousUpload(previousUploads[0])
                }

                // Start the upload
                upload.start()
            })
        })
    }

    return (
        <>
            <Suspense>
                <Header />
            </Suspense>
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