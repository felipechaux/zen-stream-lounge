import { Suspense } from 'react'
import AuthForm from '@/components/auth/AuthForm'

export default function AuthPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 flex items-center justify-center">
            <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '48px 48px', maskImage: 'linear-gradient(180deg, white, transparent)' }} />
            <div className="relative z-10 w-full flex justify-center">
                <Suspense fallback={<div className="w-full max-w-md h-96 rounded-2xl bg-zinc-900/50 animate-pulse" />}>
                    <AuthForm />
                </Suspense>
            </div>
        </div>
    )
}
