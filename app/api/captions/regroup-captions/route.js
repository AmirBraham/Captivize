import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

export async function POST(req) {
    const body = await req.json();
    console.log(body)
    if (!body.max_words) {
        return NextResponse.json({ error: "max_words param is required" }, { status: 400 });
    }

    if (!body.captions) {
        return NextResponse.json({ error: "captions param is required" }, { status: 400 });
    }

    try {
        const response = await fetch("http://localhost:5050/api/regroup_captions", {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
            },
            body:JSON.stringify(body)
        });
        console.log(response)
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        return NextResponse.json(data);
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }

}
