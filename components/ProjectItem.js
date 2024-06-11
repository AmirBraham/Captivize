import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TimeDisplay from './TimeDisplay';


const OptionsMenu = ({ project, isOpen, onToggleMenu, onEdit, onDelete }) => {
    return (
        <div className='relative'>
            <button onClick={() => onToggleMenu(project.id)}>
                <p className='font-bold text-lg text-gray-500'>...</p>
            </button>
            {isOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md'>
                    <Link href={`/projects/${project.id}`}
                        className='block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100'
                    >
                        Edit
                    </Link>
                    <button
                        onClick={() => onDelete(project)}
                        className='block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100'
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};


export default function ProjectItem({ project, user, openMenuId, toggleMenu, handleEdit, handleDelete }) {
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const supabase = createClientComponentClient();

    useEffect(() => {
        const getThumbnail = async () => {
            const userFolderPath = `${user.id}`;
            const bucketName = "videos";
            console.log(`${userFolderPath}/thumbnail-${project.video_name}.png`);

            const { data, error: signedUrlError } = await supabase
                .storage
                .from(bucketName)
                .createSignedUrl(`${userFolderPath}/thumbnail-${project.video_name}.png`, 3600 * 24); // URL valid for 24 hours
            if (signedUrlError) {
                console.log(signedUrlError);
                return "";
            }
            setThumbnailUrl(data.signedUrl);
        };

        getThumbnail();
    }, []);

    return (
        <div key={project.id} className='flex flex-col w-[300px]'>
            <Link href={`/projects/${project.id}`}>
                <div className='bg-[#ECEDEE] rounded-xl w-full h-[180px] flex justify-center items-center '>
                    {thumbnailUrl && (
                        <Image
                            src={thumbnailUrl}
                            className='h-5/6 shadow-md	rounded-xl'
                            alt="Thumbnail of the project"
                            width={90}
                            height={177}
                        />
                    )}
                </div>
            </Link>

            <div className="flex flex-row justify-between">
                <p className="text-xs text-black self-center font-semibold">{project.video_name}</p>
                <OptionsMenu
                    project={project}
                    isOpen={openMenuId === project.id}
                    onToggleMenu={toggleMenu}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            </div>
            <TimeDisplay createdAt={project.created_at} />
        </div>
    );
}