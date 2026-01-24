'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Save } from 'lucide-react'
import { Database } from '@/types/supabase'

const profileSchema = z.object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    avatarUrl: z.string().url().optional().or(z.literal('')),
})

type ProfileFormValues = z.infer<typeof profileSchema>

import Header from '@/components/layout/Header'

export default function SettingsPage() {
    const { user, profile, loading: authLoading } = useAuth()
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [successMessage, setSuccessMessage] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const supabase = createClient()

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            fullName: '',
            avatarUrl: '',
        },
    })

    // Load initial data
    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/auth')
        } else if (profile) {
            form.reset({
                fullName: profile.full_name || '',
                avatarUrl: profile.avatar_url || '',
            })
        }
    }, [user, profile, authLoading, router, form])

    const onSubmit = async (values: ProfileFormValues) => {
        if (!user) return

        setIsLoading(true)
        setError(null)
        setSuccessMessage(null)

        try {
            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    full_name: values.fullName,
                    avatar_url: values.avatarUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)

            if (updateError) throw updateError

            setSuccessMessage('Profile updated successfully')
            router.refresh() // Refresh to update profile context eventually
        } catch (err: any) {
            setError(err.message || 'Failed to update profile')
        } finally {
            setIsLoading(false)
        }
    }

    if (authLoading || !user) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-zinc-950 text-amber-500">
                <div className="animate-pulse">Loading settings...</div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header />
            <div className="pb-12 px-4 mt-6">
                <div className="max-w-2xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
                        <p className="text-zinc-400">Manage your profile information and preferences</p>
                    </div>

                    <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-white">Profile Information</CardTitle>
                            <CardDescription className="text-zinc-400">
                                Update your public profile details.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    {successMessage && (
                                        <Alert className="bg-emerald-900/20 border-emerald-900 text-emerald-200">
                                            <AlertDescription>{successMessage}</AlertDescription>
                                        </Alert>
                                    )}
                                    {error && (
                                        <Alert variant="destructive" className="bg-red-900/20 border-red-900 text-red-200">
                                            <AlertDescription>{error}</AlertDescription>
                                        </Alert>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="fullName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300">Display Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        className="bg-zinc-950 border-zinc-800 text-white focus:ring-amber-500/50 focus:border-amber-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="avatarUrl"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-zinc-300">Avatar URL</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="https://example.com/avatar.jpg"
                                                        className="bg-zinc-950 border-zinc-800 text-white focus:ring-amber-500/50 focus:border-amber-500"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-zinc-300">Email Address</label>
                                        <Input
                                            value={user.email || ''}
                                            disabled
                                            className="bg-zinc-950/50 border-zinc-900 text-zinc-500"
                                        />
                                        <p className="text-xs text-zinc-500">Email cannot be changed directly.</p>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="bg-amber-600 hover:bg-amber-500 text-white"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="mr-2 h-4 w-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
