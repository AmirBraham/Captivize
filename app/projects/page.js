"use client";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useEffect, useRef, useState } from 'react';
import ProjectsGrid from "@/components/ProjectGrid";
import SidebarHeader from '@/components/SidebarHeader';

const tus = require('tus-js-client')
const projectId = 'mlgnxubgmzngsecafkgr'

export default function Projects() {
    const [user, setUser] = useState(null)
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

    return (
        <div className="flex flex-row h-screen">
            <SidebarHeader />
            <div className="basis-[80%] p-8 bg-grey">
                <h1 className="text-3xl font-bold">Your Videos</h1>
                {user && <ProjectsGrid user={user} />}
            </div>
        </div>

    );
}