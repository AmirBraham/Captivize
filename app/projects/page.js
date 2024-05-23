"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { useForm, SubmitHandler } from 'react-hook-form';
import { Suspense, useRef } from 'react'
export default function Projects() {
    const fileInput = useRef(null);
    async function uploadFile(
        evt
    ) {
        evt.preventDefault();

        const formData = new FormData();
        formData.append("file", fileInput.current.files[0]);

        const response = await fetch("/api/uploadVideo", {
            method: "POST",
            body: formData,
        });
        const result = await response.json();
        console.log(result);
    }


    return (
        <>
            <Suspense>
                <Header />
            </Suspense>
            <form className="flex flex-col gap-4">
                <label>
                    <span>Upload a file</span>
                    <input type="file" name="file" ref={fileInput} />
                </label>
                <button type="submit" onClick={uploadFile}>
                    Submit
                </button>
            </form>
            <Footer />
        </>
    );
}
