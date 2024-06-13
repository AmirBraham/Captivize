import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
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

    const handleDelete = async (project) => {
        const userFolderPath = user.id
        const video_path = `${userFolderPath}/${project.video_name}`
        const video_thumbnail_path = `${userFolderPath}/thumbnail-${project.video_name}.png`
         
         // Delete project
         const { data: projectData, error: projectError } = await supabase
         .from('projects')
         .delete()
         .eq('id', project.id)
         .select()
        console.log(projectData)
        // Delete video and thumbnail from videos bucket
        const { data: storageData, error: storageError } = await supabase
            .storage
            .from('videos')
            .remove([video_path,video_thumbnail_path])
        if(storageError) {
            console.log("could not delete storage : ", storageError)
            return
        }
        if (projectError) {
            console.log("could not delete project : ", projectError)
            return
        }
        // Update projects state after successful deletion
        if (projectData && storageData) {
            setProjects(prevProjects => prevProjects.filter(p => p.id !== project.id));
        }
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
