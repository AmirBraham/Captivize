import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export async function POST(req) {
    try {
        const supabase = createClientComponentClient();

        const formData = await req.formData();

        const file = formData.get("file");
        const bucket = "videos"
        console.log(file)
        // Call Storage API to upload file
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(file.name, file);
        console.log(data)
        // Handle error if upload failed
        if (error) {
            console.log(error)
            return;
        }

        return NextResponse.json({ status: "success" });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ status: "fail", error: e });
    }
}