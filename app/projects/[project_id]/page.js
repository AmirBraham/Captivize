"use client";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Suspense } from 'react';

export default function Project({params}) {
    const supabase = createClientComponentClient();

    return (
        <>
            <Suspense>
                <Header />
            </Suspense>
                <h2>{params.project_id}</h2> 
            <Footer />
        </>
    );
}