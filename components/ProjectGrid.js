import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


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
                    <Link key={project.id} href={`/projects/${project.id}`}>
                        <div className="border rounded p-4">
                            <h4>{project.video_name}</h4>
                            <p>Created at: {project.created_at}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}