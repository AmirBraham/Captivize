"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Suspense, useEffect,useState } from 'react';

export default function Project({ params }) {
    const supabase = createClientComponentClient();
    const { project_id } = params // fetching project_id from url params
    const [loading, setLoading] = useState(true);
    const [project, setProject] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        const getProject = async () => {
            try {
                const { data, error } = await supabase
                    .from('projects')
                    .select('*')
                    .eq('id', project_id)
                    .single();
                console.log(data)
                if (error) {
                    setError('Error fetching project: ' + error.message);
                } else {
                    console.log(data)
                    setProject(data);
                }
            } catch (err) {
                setError('An unexpected error occurred: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        if (project_id) {
            getProject();
        } else {
            setError('Project ID is missing');
            setLoading(false);
        }
    }, [project_id]);
    return (
        <>
            <Suspense>
                <Header />
            </Suspense>
            {loading && <p>Loading...</p>}
            {error && <p>{error}</p>}
            {
                project && (<>
                    <h2>{project.video_name}</h2>
                </>)
            }

            <Footer />
        </>
    );
}