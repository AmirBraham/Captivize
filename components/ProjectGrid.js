import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TimeDisplay from './TimeDisplay';


const OptionsMenu = ({ projectId, isOpen, onToggleMenu, onEdit, onDelete }) => {
    return (
        <div className='relative'>
            <button onClick={() => onToggleMenu(projectId)}>
                <p className='font-bold text-lg text-gray-500'>...</p>
            </button>
            {isOpen && (
                <div className='absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md'>
                    <button 
                        onClick={() => onEdit(projectId)} 
                        className='block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100'
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => onDelete(projectId)} 
                        className='block w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100'
                    >
                        Delete
                    </button>
                </div>
            )}
        </div>
    );
};


export default function ProjectsGrid({ user }) {
    const supabase = createClientComponentClient()
    const [projects, setProjects] = useState([]);
    const [openMenuId, setOpenMenuId] = useState(null);

    const toggleMenu = (id) => {
        setOpenMenuId(openMenuId === id ? null : id);
    };

    const handleEdit = (id) => {
        console.log(`Editing project ${id}`);
        // Implement edit functionality here
    };

    const handleDelete = (id) => {
        console.log(`Deleting project ${id}`);
        // Implement delete functionality here
    };

    useEffect(() => {

        async function fetchProjects() {
            try {
                const { data, error } = await supabase.from('projects').select('*').eq('user_id', user.id);
                if (error) {
                    throw error;
                }
                setProjects(data || []);
            } catch (error) {
                console.error('Error fetching projects:', error.message);
            }
        }

        fetchProjects();
    }, []);

    return (
        <div>
            <div className="grid grid-cols-3 gap-4 mt-4">
                {projects.map(project => (
                    <div className='flex flex-col w-[300px]'>
                        <div className='bg-[#ECEDEE] rounded-xl w-full h-[180px]'>
                            <Link key={project.id} href={`/projects/${project.id}`}>

                            </Link>
                        </div>
                        <div className='flex flex-row'>
                            <p className='text-xs font-semibold text-black'>{project.video_name}</p>
                            
                            <OptionsMenu 
                            projectId={project.id} 
                            isOpen={openMenuId === project.id} 
                            onToggleMenu={toggleMenu} 
                            onEdit={handleEdit} 
                            onDelete={handleDelete} 
                        />
                        </div>
                        <TimeDisplay createdAt={project.created_at} />
                    </div>


                ))}
            </div>
        </div>
    );
}

