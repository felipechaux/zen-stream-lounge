import AuthForm from '@/components/auth/AuthForm'

export default function AuthPage() {
    return (
        <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8 bg-zinc-950 flex items-center justify-center">
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-5 pointer-events-none" />
            <div className="relative z-10 w-full flex justify-center">
                <AuthForm />
            </div>
        </div>
    )
}
