import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import TimeDisplay from './TimeDisplay';
import Image from 'next/image'
import ProjectItem from './ProjectItem';

export default function ProjectsGrid({ user }) {
    const supabase = createClientComponentClient();
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
    }, [user.id, supabase]);

    return (
        <div>
            <div className="grid grid-cols-3 gap-4 mt-4">
                {projects.map(project => (
                    <ProjectItem
                        key={project.id}
                        project={project}
                        user={user}
                        openMenuId={openMenuId}
                        toggleMenu={toggleMenu}
                        handleEdit={handleEdit}
                        handleDelete={handleDelete}
                    />
                ))}
            </div>
        </div>
    );
}
