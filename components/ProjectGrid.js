import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TimeDisplay from './TimeDisplay';


export default function ProjectsGrid({ user }) {
    const supabase = createClientComponentClient()
    const [projects, setProjects] = useState([]);


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
                            <button>
                                <p>...</p>
                            </button>

                        </div>
                        <TimeDisplay createdAt={project.created_at} />
                    </div>


                ))}
            </div>
        </div>
    );
}