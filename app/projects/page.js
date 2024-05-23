"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Suspense, useRef, useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function Projects() {

    const [file, setFile] = useState();
    const [fileEnter, setFileEnter] = useState(false);
    const fileInput = useRef(null)
    const supabase = createClientComponentClient();

    async function uploadFile(evt) {
        evt.preventDefault();

        const file = fileInput.current.files[0]

        const bucket = "videos"
        console.log(file)
        // Call Storage API to upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(file.name, file);
        console.log(data)
        // Handle error if upload failed
        if (error) {
            alert('Error uploading file.');
            return;
        }
        alert('File uploaded successfully!');
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