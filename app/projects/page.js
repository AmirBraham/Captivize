"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Suspense, useEffect, useRef, useState } from 'react';
import ProjectsGrid from "@/components/ProjectGrid";
import logo from "@/app/logo.png";
import Image from "next/image";
import config from "@/config";
import Link from "next/link";

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
                        console.log(captions)
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
        <div className="flex flex-row h-screen">
            <div className="basis-[20%] flex flex-col justify-start items-center py-10">
                <div className="flex items-start justify-center basis-2/12">
                    <Image
                        src={logo}
                        alt={`${config.appName} logo`}
                        priority={true}
                        className="w-2/3"
                    />
                </div>
                <div className="flex flex-col w-10/12 justify-start basis-7/12">
                    <div className="flex flex-col space-y-2  ">

                        <Link href="#" className="bg-black w-10/12 text-white font-bold text-md w-10/12 h-12 justify-center content-center text-center py-2 rounded-lg">
                            + Upload new video
                        </Link>
                        <div className="space-y-4 w-full">

                            <Link href="#" className="bg-[#FAFAFA]  w-full text-off-black font-bold p-4 rounded-md flex flex-row items-center">
                                <svg className="mr-2" width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M0.833313 3.66667C0.833313 2.91522 1.13182 2.19455 1.66318 1.6632C2.19453 1.13185 2.9152 0.833336 3.66665 0.833336H9.33331C10.0848 0.833336 10.8054 1.13185 11.3368 1.6632C11.8681 2.19455 12.1666 2.91522 12.1666 3.66667V9.33334C12.1666 10.0848 11.8681 10.8055 11.3368 11.3368C10.8054 11.8682 10.0848 12.1667 9.33331 12.1667H3.66665C2.9152 12.1667 2.19453 11.8682 1.66318 11.3368C1.13182 10.8055 0.833313 10.0848 0.833313 9.33334V3.66667Z" stroke="black" stroke-width="1.41667" stroke-linecap="round" stroke-linejoin="round" />
                                    <path d="M4.37497 3.66666C4.37497 4.23025 4.59885 4.77075 4.99737 5.16927C5.39588 5.56778 5.93638 5.79166 6.49997 5.79166C7.06355 5.79166 7.60406 5.56778 8.00257 5.16927C8.40109 4.77075 8.62497 4.23025 8.62497 3.66666" stroke="black" stroke-width="1.41667" stroke-linecap="round" stroke-linejoin="round" />
                                </svg>
                                Videos
                            </Link>
                            <Link href="#" className="bg-[#FAFAFA] w-full text-off-black font-bold	 p-4 rounded-md flex flex-row items-center">
                                <svg className="mr-2" width="17" height="13" viewBox="0 0 17 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13.7062 5.11167C13.4683 3.90589 12.8191 2.82011 11.8696 2.0398C10.92 1.25949 9.729 0.833058 8.49997 0.833336C6.45289 0.833336 4.67497 1.995 3.78955 3.695C2.74847 3.80751 1.78568 4.30077 1.08619 5.08002C0.386699 5.85927 -0.00015214 6.86952 -3.04889e-05 7.91667C-3.04889e-05 10.2613 1.90539 12.1667 4.24997 12.1667H13.4583C15.4133 12.1667 17 10.58 17 8.625C17 6.755 15.5479 5.23917 13.7062 5.11167ZM13.4583 10.75H4.24997C2.68455 10.75 1.41664 9.48209 1.41664 7.91667C1.41664 6.46459 2.50039 5.25334 3.9383 5.10459L4.69622 5.02667L5.05039 4.35375C5.37613 3.71964 5.87054 3.1877 6.47918 2.81652C7.08782 2.44534 7.78708 2.24931 8.49997 2.25C10.3558 2.25 11.9566 3.5675 12.3179 5.38792L12.5304 6.45042L13.6141 6.52834C14.1466 6.56415 14.6458 6.80033 15.0111 7.18934C15.3765 7.57836 15.5809 8.09132 15.5833 8.625C15.5833 9.79375 14.6271 10.75 13.4583 10.75ZM9.52705 5.08334H7.47289V7.20834H5.66664L8.49997 10.0417L11.3333 7.20834H9.52705V5.08334Z" fill="black" />
                                </svg>

                                Exports
                            </Link>
                            <Link href="#" className="bg-[#FAFAFA] w-full text-off-black font-bold	 p-4 rounded-md flex flex-row items-center">
                                <svg className="mr-2" width="17" height="13" viewBox="0 0 17 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13.7062 5.11167C13.4683 3.90589 12.8191 2.82011 11.8696 2.0398C10.92 1.25949 9.729 0.833058 8.49997 0.833336C6.45289 0.833336 4.67497 1.995 3.78955 3.695C2.74847 3.80751 1.78568 4.30077 1.08619 5.08002C0.386699 5.85927 -0.00015214 6.86952 -3.04889e-05 7.91667C-3.04889e-05 10.2613 1.90539 12.1667 4.24997 12.1667H13.4583C15.4133 12.1667 17 10.58 17 8.625C17 6.755 15.5479 5.23917 13.7062 5.11167ZM13.4583 10.75H4.24997C2.68455 10.75 1.41664 9.48209 1.41664 7.91667C1.41664 6.46459 2.50039 5.25334 3.9383 5.10459L4.69622 5.02667L5.05039 4.35375C5.37613 3.71964 5.87054 3.1877 6.47918 2.81652C7.08782 2.44534 7.78708 2.24931 8.49997 2.25C10.3558 2.25 11.9566 3.5675 12.3179 5.38792L12.5304 6.45042L13.6141 6.52834C14.1466 6.56415 14.6458 6.80033 15.0111 7.18934C15.3765 7.57836 15.5809 8.09132 15.5833 8.625C15.5833 9.79375 14.6271 10.75 13.4583 10.75ZM9.52705 5.08334H7.47289V7.20834H5.66664L8.49997 10.0417L11.3333 7.20834H9.52705V5.08334Z" fill="black" />
                                </svg>

                                Archive
                            </Link>
                        </div>
                    </div>

                </div>
                <div className="flex flex-col w-11/12 justify-between basis-3/12 space-y-4 ">
                    <div className="flex flex-col space-y-4 w-full align-center  ">
                            <div className="w-9/12 mx-auto bg-transparent ">

                            <div className="flex  w-[170px] bg-transparent	 items-center  shadow-custom-2  rounded-xl ">
                                <button className="flex font-bold items-center  flex-row bg-black shadow-custom-1 text-white w-full p-3  rounded-xl ">
                                    <svg className="mr-2" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M16.1735 7.16637L11.9972 5.12849C11.9476 5.1037 11.9221 5.05341 11.8966 5.00312L9.83395 0.826782C9.4812 0.0971989 8.57595 -0.20526 7.84566 0.146782C7.55022 0.292033 7.31131 0.53119 7.16637 0.826782L5.1037 5.00312C5.0763 5.04947 5.04243 5.09169 5.00312 5.12849L0.826782 7.19187C0.0971989 7.54391 -0.20526 8.44987 0.146782 9.17945C0.291906 9.47515 0.531077 9.71432 0.826782 9.85945L5.00312 11.8966C5.0527 11.9221 5.0782 11.9724 5.1037 11.9972L7.19187 16.1735C7.54391 16.9031 8.44987 17.2056 9.17945 16.8535C9.47489 16.7083 9.7138 16.4691 9.85874 16.1735L11.8966 11.9972C11.9221 11.9476 11.9724 11.8966 11.9972 11.8966L16.1735 9.83395C16.9031 9.4812 17.2056 8.57595 16.8535 7.84637C16.7274 7.54391 16.476 7.31795 16.1735 7.16637ZM13.0795 7.46882L11.1422 9.15466C10.7647 9.5067 10.4877 9.95932 10.3872 10.4629L9.88424 12.9782C9.85874 13.0795 9.75816 13.1553 9.65757 13.1298C9.60728 13.1298 9.58178 13.1043 9.55699 13.054L7.87116 11.1167C7.51912 10.7392 7.06578 10.4629 6.56287 10.3617L4.04686 9.85874C3.94628 9.83395 3.87049 9.73266 3.89599 9.63207C3.89599 9.58249 3.92078 9.55699 3.97107 9.53149L5.90837 7.84566C6.28591 7.49362 6.56287 7.04099 6.66345 6.53737L7.16637 4.02207C7.19187 3.92078 7.29245 3.84499 7.39303 3.87049C7.43084 3.8768 7.46589 3.89432 7.49362 3.92078L9.17945 5.85807C9.53149 6.23562 9.98482 6.51257 10.4877 6.61316L13.0037 7.11607C13.1043 7.14157 13.1801 7.24216 13.1546 7.34274C13.1411 7.39063 13.1152 7.43412 13.0795 7.46882Z" fill="white" />
                                    </svg>

                                    Upgrade Now
                                </button>
                            </div>
                            </div>

                        <Link href="#" className="flex text-gray-400 font-bold w-9/12 mx-auto text-lg items-center  ">
                            <svg className="mr-2" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M10.25 7.24998V7.25748M2.87974 5.28348C2.55079 5.03066 2.29815 4.69181 2.14974 4.30438C2.00133 3.91695 1.96293 3.49603 2.03878 3.08814C2.11463 2.68025 2.30179 2.30128 2.57956 1.9931C2.85733 1.68493 3.2149 1.45956 3.61275 1.34189C4.01059 1.22423 4.43323 1.21886 4.83394 1.32638C5.23465 1.43389 5.59783 1.65011 5.88334 1.95112C6.16885 2.25214 6.36557 2.62624 6.45176 3.03207C6.53796 3.4379 6.51026 3.85966 6.37174 4.25073" stroke="#89949E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                                <path d="M11 2V4.85225C11.9282 5.38939 12.6349 6.23937 12.9935 7.25H13.9993C14.1982 7.25 14.3889 7.32902 14.5296 7.46967C14.6702 7.61032 14.7493 7.80109 14.7493 8V9.5C14.7493 9.69891 14.6702 9.88968 14.5296 10.0303C14.3889 10.171 14.1982 10.25 13.9993 10.25H12.9928C12.7408 10.9625 12.3125 11.6 11.7493 12.1047V13.625C11.7493 13.9234 11.6307 14.2095 11.4198 14.4205C11.2088 14.6315 10.9226 14.75 10.6243 14.75C10.3259 14.75 10.0397 14.6315 9.82877 14.4205C9.61779 14.2095 9.49926 13.9234 9.49926 13.625V13.1877C9.25144 13.2294 9.00056 13.2502 8.74926 13.25H5.74926C5.49796 13.2502 5.24708 13.2294 4.99926 13.1877V13.625C4.99926 13.9234 4.88073 14.2095 4.66976 14.4205C4.45878 14.6315 4.17263 14.75 3.87426 14.75C3.57589 14.75 3.28974 14.6315 3.07877 14.4205C2.86779 14.2095 2.74926 13.9234 2.74926 13.625V12.1047C2.06973 11.4972 1.59072 10.6977 1.37562 9.8119C1.16053 8.92613 1.21949 7.99593 1.54472 7.14442C1.86994 6.2929 2.44608 5.56023 3.19689 5.04337C3.94769 4.52652 4.83775 4.24985 5.74926 4.25H7.62426L11 2Z" stroke="#89949E" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                            Affilate Program
                        </Link>
                        <Link href="#" className="flex text-gray-400 font-bold w-9/12 mx-auto text-lg items-center ">
                            <svg className="mr-2" width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M8.15406 4.84374C7.43092 4.84374 6.72402 5.05818 6.12275 5.45993C5.52149 5.86169 5.05286 6.43271 4.77612 7.10081C4.49939 7.7689 4.42698 8.50405 4.56806 9.21329C4.70914 9.92254 5.05736 10.574 5.5687 11.0854C6.08003 11.5967 6.73152 11.9449 7.44076 12.086C8.15 12.2271 8.88515 12.1547 9.55324 11.8779C10.2213 11.6012 10.7924 11.1326 11.1941 10.5313C11.5959 9.93003 11.8103 9.22313 11.8103 8.49999C11.8092 7.53064 11.4236 6.60131 10.7382 5.91587C10.0527 5.23043 9.12341 4.84486 8.15406 4.84374ZM8.15406 10.4687C7.76468 10.4687 7.38404 10.3533 7.06028 10.1369C6.73652 9.92062 6.48418 9.61314 6.33517 9.2534C6.18616 8.89366 6.14717 8.49781 6.22314 8.11591C6.2991 7.73401 6.48661 7.38321 6.76194 7.10788C7.03728 6.83254 7.38807 6.64504 7.76997 6.56907C8.15187 6.49311 8.54772 6.5321 8.90747 6.68111C9.26721 6.83012 9.57468 7.08246 9.79101 7.40621C10.0073 7.72997 10.1228 8.11061 10.1228 8.49999C10.1228 9.02214 9.91539 9.5229 9.54618 9.89211C9.17696 10.2613 8.6762 10.4687 8.15406 10.4687ZM16.1598 6.98335C16.136 6.86451 16.0869 6.75218 16.0158 6.65403C15.9447 6.55587 15.8533 6.47418 15.7478 6.41452L13.7938 5.30007L13.7861 3.09859C13.7857 2.97644 13.7587 2.85584 13.7071 2.74513C13.6555 2.63442 13.5805 2.53622 13.4873 2.45734C12.6998 1.79111 11.7932 1.28028 10.8154 0.951947C10.7038 0.914323 10.5857 0.900454 10.4685 0.911231C10.3512 0.922009 10.2376 0.957194 10.1348 1.01452L8.15406 2.12054L6.17336 1.01382C6.07041 0.956175 5.95653 0.920759 5.83905 0.909859C5.72157 0.898959 5.60311 0.912817 5.49132 0.95054C4.51327 1.28031 3.60663 1.79256 2.81945 2.46015C2.7265 2.53895 2.65172 2.63694 2.60026 2.7474C2.54879 2.85785 2.52187 2.97814 2.52132 3.09999L2.51148 5.30359L0.560308 6.41523C0.454776 6.47511 0.363401 6.55705 0.292417 6.65546C0.221432 6.75387 0.172507 6.86643 0.14898 6.98546C-0.0496599 7.98609 -0.0496599 9.01601 0.14898 10.0166C0.172694 10.1354 0.221705 10.2477 0.292681 10.3459C0.363657 10.444 0.454934 10.5257 0.560308 10.5855L2.5164 11.6999L2.52414 13.9014C2.52456 14.0235 2.5515 14.1441 2.6031 14.2549C2.65469 14.3656 2.72971 14.4638 2.82296 14.5427C3.61039 15.2089 4.51704 15.7197 5.49484 16.048C5.60638 16.0857 5.72455 16.0995 5.84177 16.0888C5.95899 16.078 6.07266 16.0428 6.17546 15.9855L8.15406 14.8794L10.1327 15.9862C10.2356 16.0438 10.3495 16.0792 10.467 16.0901C10.5844 16.101 10.7029 16.0872 10.8147 16.0494C11.7927 15.7197 12.6994 15.2074 13.4866 14.5398C13.5795 14.461 13.6543 14.363 13.7057 14.2526C13.7572 14.1421 13.7841 14.0218 13.7847 13.9L13.7945 11.6964L15.7499 10.5848C15.8554 10.5249 15.9468 10.4429 16.0178 10.3445C16.0888 10.2461 16.1377 10.1336 16.1612 10.0145C16.3594 9.0138 16.3589 7.98389 16.1598 6.98335ZM14.5687 9.31632L12.6787 10.3907C12.5444 10.4668 12.4337 10.5785 12.3587 10.7134C12.3208 10.7837 12.2807 10.8491 12.2392 10.9159C12.1559 11.049 12.1113 11.2026 12.1105 11.3596L12.1007 13.4922C11.6458 13.8345 11.1477 14.1151 10.6192 14.3268L8.71023 13.2587C8.58434 13.1882 8.44248 13.1512 8.2982 13.1512H8.03593C7.88516 13.1477 7.73617 13.1843 7.60421 13.2573L5.69312 14.3233C5.16379 14.1126 4.6645 13.8332 4.20812 13.4922L4.20039 11.3659C4.19973 11.2087 4.15517 11.0548 4.07171 10.9216C4.03093 10.8555 3.99015 10.7873 3.95218 10.7191C3.87724 10.5849 3.76679 10.474 3.63296 10.3984L1.74156 9.31773C1.66805 8.77552 1.66805 8.22587 1.74156 7.68367L3.63156 6.60929C3.76561 6.53319 3.87626 6.42181 3.95148 6.28726C3.98945 6.21695 4.02953 6.15085 4.07101 6.08406C4.15434 5.95101 4.1989 5.79737 4.19968 5.64038L4.20742 3.50781C4.66244 3.16647 5.16058 2.88679 5.6889 2.67601L7.59789 3.74406C7.72972 3.8181 7.87916 3.85503 8.03031 3.85093H8.27218C8.42296 3.85443 8.57195 3.81779 8.7039 3.74476L10.615 2.67671C11.1443 2.88736 11.6436 3.1668 12.1 3.50781L12.1077 5.63406C12.1084 5.79128 12.1529 5.94519 12.2364 6.07843C12.2772 6.14452 12.318 6.21273 12.3559 6.28093C12.4309 6.41509 12.5413 6.52602 12.6752 6.60156L14.5666 7.67945C14.641 8.22248 14.6417 8.77309 14.5687 9.31632Z" fill="#89949E" />
                            </svg>
                            Settings
                        </Link>
                    </div>

                    <div className="flex flex-row w-full bg-[#FAFAFA] justify-between px-4 py-3 rounded-lg  items-center">
                        <div className="flex flex-col">
                            <p className="text-black font-bold">tonyconte95@gm..</p>
                            <p className="text-xs font-semibold text-gray-500">Total Credits: 3</p>
                        </div>
                        <svg width="19" height="16" viewBox="0 0 19 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11.25 4.5V2.75C11.25 2.28587 11.0656 1.84075 10.7374 1.51256C10.4092 1.18437 9.96413 1 9.5 1H3.375C2.91087 1 2.46575 1.18437 2.13756 1.51256C1.80937 1.84075 1.625 2.28587 1.625 2.75V13.25C1.625 13.7141 1.80937 14.1592 2.13756 14.4874C2.46575 14.8156 2.91087 15 3.375 15H9.5C9.96413 15 10.4092 14.8156 10.7374 14.4874C11.0656 14.1592 11.25 13.7141 11.25 13.25V11.5" stroke="#89949E" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
                            <path d="M6.875 8H17.375M17.375 8L14.75 5.375M17.375 8L14.75 10.625" stroke="#89949E" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>

                </div>
            </div>
            <div className="basis-[80%] p-8 bg-grey">
                <h1 className="text-3xl font-bold">Your Videos</h1>
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

            </div>
        </div>

    );
}


// We are now transcribing the video , takes about 30 seconds on my computer