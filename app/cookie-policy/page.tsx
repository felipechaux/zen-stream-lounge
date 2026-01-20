'use client';

import React from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function CookiePolicyPage() {
    const categories = [
        "Featured", "Top Rated", "New Models", "Latina", "Blonde", "Ebony", "Asian", "Couples"
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-300 font-sans">
            <Header
                searchQuery=""
                setSearchQuery={() => { }}
                categories={categories}
            />

            <main className="container mx-auto px-4 py-16 max-w-4xl">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500 mb-8">
                    Cookie Policy
                </h1>

                <div className="space-y-8 bg-zinc-900/50 p-8 rounded-2xl border border-zinc-800">
                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
                        <p className="leading-relaxed">
                            Welcome to ZenStream Lounge. This Cookie Policy explains how we use cookies and similar technologies
                            (collectively, &quot;Cookies&quot;) when you visit our website. As a premium streaming platform, we use these technologies
                            to ensure the functionality of our high-definition video services, including real-time streaming via Ant Media Server.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">2. What are Cookies?</h2>
                        <p className="leading-relaxed">
                            Cookies are small text files that are placed on your device by websites that you visit. They are widely used
                            in order to make websites work, or work more efficiently, as well as to provide information to the owners of the site.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Cookies</h2>
                        <p className="leading-relaxed mb-4">
                            We use Cookies for the following purposes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>
                                <strong className="text-amber-500">Essential & Functional Cookies:</strong> These are strictly necessary for
                                the operation of our website. They include cookies that enable you to log into secure areas of our website,
                                verify your age (18+), and maintain your session during live streams. Without these, services like Ant Media WebRTC streaming cannot function properly.
                            </li>
                            <li>
                                <strong className="text-amber-500">Performance & Analytics Cookies:</strong> These allow us to recognize and
                                count the number of visitors and to see how visitors move around our website when they are using it. This helps us
                                improve the way our website works, for example, by ensuring that users are finding what they are looking for easily.
                            </li>
                            <li>
                                <strong className="text-amber-500">Streaming & Technology Cookies (Ant Media):</strong> We utilize Ant Media Server
                                and WebRTC technologies to provide low-latency live streaming. These services may store session identifiers and
                                network preference cookies to optimize the video connection quality (bitrate adatpation) based on your internet speed.
                            </li>
                            <li>
                                <strong className="text-amber-500">Marketing & Promotion Cookies:</strong> These cookies record your visit to our website,
                                the pages you have visited, and the links you have followed. We may use this information to make our website
                                and the advertising displayed on it more relevant to your interests.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">4. Managing Your Cookies</h2>
                        <p className="leading-relaxed">
                            You have the right to accept or reject cookies. You can exercise your cookie rights by setting your preferences in the Cookie Consent banner
                            when you first visit our site. Additionally, most web browsers allow some control of most cookies through the browser settings.
                            Please note that blocking essential cookies may impact your ability to view live streams or access your account.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">5. Age Restriction & Compliance</h2>
                        <p className="leading-relaxed">
                            ZenStream Lounge is an adults-only platform. By using our site and accepting cookies, you confirm that you are at least 18 years of age
                            (or the age of majority in your jurisdiction). We do not knowingly collect personal data or cookies from minors.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-semibold text-white mb-4">6. Updates to This Policy</h2>
                        <p className="leading-relaxed">
                            We may update this Cookie Policy from time to time in order to reflect, for example, changes to the cookies we use
                            or for other operational, legal, or regulatory reasons. Please re-visit this Cookie Policy regularly to stay informed about our use of cookies and related technologies.
                        </p>
                    </section>
                </div>
            </main>

            <Footer />
        </div>
    );
}
