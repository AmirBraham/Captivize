import { redirect } from "next/navigation";
import config from "@/config";
import { cookies } from "next/headers";
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
// This is a server-side component to ensure the user is logged in and that the project belongs to the current user.
// If not, it will redirect to the login page.
export default async function LayoutProjectPrivate({ children, params }) {
    const supabase = createServerComponentClient({ cookies });
    const project_id = params["project_id"]
    if (!project_id) {
        console.log("missing project id ! ")
        redirect(config.auth.loginUrl);

    }
    const {
        data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
        // Redirect to login if user is not authenticated
        console.log("user not authenticated")
        redirect(config.auth.loginUrl);
    }
    const userId = session.user.id;
    const { data, projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project_id)
        .single();


    if (projectError) {
        console.error('Error fetching project:', projectError);
        redirect(config.auth.loginUrl);
    }
    if (!data) {
        console.log("project id does not exist")
        redirect(config.auth.loginUrl);
    }

    if (data && data.user_id === userId) {
        return <>{children}</>
    } else {
        console.log(data)
        redirect(config.auth.loginUrl);
    }

};

