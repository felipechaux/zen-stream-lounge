'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'

type AuthFormValues = {
    email: string
    password: string
    fullName?: string
    role: 'user' | 'model'
}

export default function AuthForm() {
    const [isLogin, setIsLogin] = useState(() => searchParams.get('mode') !== 'signup')
    const [showPassword, setShowPassword] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const searchParams = useSearchParams()
    const { signIn, signUp } = useAuth()
    const { t } = useLanguage()

    const authSchema = z.object({
        email: z.string().email(t('authEmailInvalid')),
        password: z.string().min(6, t('authPasswordMin')),
        fullName: z.string().optional(),
        role: z.enum(['user', 'model']).default('user'),
    })

    useEffect(() => {
        const callbackError = searchParams.get('error')
        if (callbackError) {
            setError(t('authExpiredLink'))
        }
    }, [searchParams])

    const form = useForm<AuthFormValues>({
        resolver: zodResolver(authSchema),
        defaultValues: {
            email: '',
            password: '',
            fullName: '',
            role: 'user',
        },
    })

    const onSubmit = async (values: AuthFormValues) => {
        setIsLoading(true)
        setError(null)

        try {
            if (isLogin) {
                const { error } = await signIn(values.email, values.password)
                if (error) throw error
                router.push('/')
            } else {
                if (!values.fullName) {
                    form.setError('fullName', { message: t('authFullNameRequired') })
                    throw new Error('Full name is required')
                }
                const { error } = await signUp(values.email, values.password, values.role, values.fullName)
                if (error) throw error
                // You might want to show a success message or redirect
            }
        } catch (err: any) {
            setError(err.message || t('authUnexpectedError'))
        } finally {
            setIsLoading(false)
        }
    }

    const toggleMode = () => {
        setIsLogin(!isLogin)
        setError(null)
        form.reset()
    }

    return (
        <div className="w-full max-w-md space-y-6">
            <Link
                href="/"
                className="inline-flex items-center text-sm text-zinc-400 hover:text-amber-500 transition-colors"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('authBackLink')}
            </Link>

            <Card className="shadow-2xl bg-zinc-900 border-zinc-800">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold text-white">
                        {isLogin ? t('authWelcomeBack') : t('authCreateAccount')}
                    </CardTitle>
                    <CardDescription className="text-zinc-400">
                        {isLogin ? `${t('authSignInTo')} ` : `${t('authJoin')} `}
                        <span className="text-amber-500 font-medium">ZenStream Lounge</span>
                        {isLogin ? ` ${t('authAccount')}` : ` ${t('authToday')}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            {error && (
                                <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            {!isLogin && (
                                <FormField
                                    control={form.control}
                                    name="fullName"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-300">{t('authFullName')}</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder={t('authFullNamePlaceholder')}
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="bg-zinc-950 border-zinc-800 text-white focus:ring-amber-500/50 focus:border-amber-500"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-300">{t('authEmail')}</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="email"
                                                placeholder={t('authEmailPlaceholder')}
                                                {...field}
                                                disabled={isLoading}
                                                className="bg-zinc-950 border-zinc-800 text-white focus:ring-amber-500/50 focus:border-amber-500"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-zinc-300">{t('authPassword')}</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Input
                                                    type={showPassword ? 'text' : 'password'}
                                                    placeholder={isLogin ? t('authPasswordPlaceholder') : t('authPasswordCreate')}
                                                    {...field}
                                                    disabled={isLoading}
                                                    className="bg-zinc-950 border-zinc-800 text-white focus:ring-amber-500/50 focus:border-amber-500 pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-zinc-400 hover:text-white"
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    disabled={isLoading}
                                                >
                                                    {showPassword ? (
                                                        <EyeOff className="h-4 w-4" />
                                                    ) : (
                                                        <Eye className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {!isLogin && (
                                <FormField
                                    control={form.control}
                                    name="role"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-zinc-300">{t('authIWantTo')}</FormLabel>
                                            <FormControl>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={`h-auto py-3 border transition-all ${field.value === 'user'
                                                            ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-700 hover:text-white'
                                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                                                            }`}
                                                        onClick={() => field.onChange('user')}
                                                        disabled={isLoading}
                                                    >
                                                        {t('authWatchStreams')}
                                                    </Button>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        className={`h-auto py-3 border transition-all ${field.value === 'model'
                                                            ? 'bg-amber-600 border-amber-500 text-white hover:bg-amber-700 hover:text-white'
                                                            : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                                                            }`}
                                                        onClick={() => field.onChange('model')}
                                                        disabled={isLoading}
                                                    >
                                                        {t('authBroadcast')}
                                                    </Button>
                                                </div>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white font-semibold"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        {isLogin ? t('authSigningIn') : t('authCreatingAccount')}
                                    </>
                                ) : (
                                    isLogin ? t('authSignIn') : t('authCreateAccount')
                                )}
                            </Button>
                        </form>
                    </Form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-zinc-400">
                            {isLogin ? `${t('authNoAccount')} ` : `${t('authHaveAccount')} `}
                            <button
                                type="button"
                                onClick={toggleMode}
                                className="font-medium text-amber-500 hover:text-amber-400 hover:underline focus:outline-none"
                            >
                                {isLogin ? t('authSignUp') : t('authSignIn')}
                            </button>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
