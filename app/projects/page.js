import Footer from "@/components/Footer";
import Header from "@/components/Header";
import { Suspense } from 'react'

export const dynamic = "force-dynamic";

// This is a private page: It's protected by the layout.js component which ensures the user is authenticated.
// It's a server compoment which means you can fetch data (like the user profile) before the page is rendered.
// See https://shipfa.st/docs/tutorials/private-page
export default async function Projects() {
    return (
        <>
            <Suspense>
                <Header />
            </Suspense>
            <main className="min-h-screen p-8 pb-24">
                <section className="max-w-xl mx-auto space-y-8">
                    <h1 className="text-3xl md:text-4xl font-extrabold">Projects page</h1>
                </section>
                <button className="bg-teal-700 text-white p-2">Upload video</button>
            </main>
            <Footer />

        </>

    );
}
