'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Mail, User as UserIcon, Shield, Settings } from 'lucide-react'
import Link from 'next/link'

import Header from '@/components/layout/Header'

export default function ProfilePage() {
    const { user, role, loading, profile } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth')
        }
    }, [user, loading, router])

    if (loading || !user) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center bg-zinc-950 text-amber-500">
                <div className="animate-pulse">Loading profile...</div>
            </div>
        )
    }

    // Format date safely
    const joinedDate = profile?.created_at
        ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
        : 'Recently'

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header />
            <div className="pb-12 px-4 mt-6">
                <div className="max-w-4xl mx-auto space-y-8">
                    {/* Profile Header Card */}
                    <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
                        <div className="h-32 bg-gradient-to-r from-amber-600 to-orange-600 opacity-20" />
                        <CardContent className="relative pt-0 pb-8 px-8">
                            <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-6 gap-6">
                                <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-zinc-900 shadow-xl">
                                    <AvatarImage src={profile?.avatar_url || ''} />
                                    <AvatarFallback className="bg-zinc-800 text-zinc-400 text-2xl">
                                        {profile?.full_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 space-y-2">
                                    <h1 className="text-3xl font-bold text-white">
                                        {profile?.full_name || 'Anonymous User'}
                                    </h1>
                                    <div className="flex flex-wrap gap-3">
                                        <Badge variant="outline" className="bg-zinc-950/50 border-amber-500/30 text-amber-500 hover:bg-zinc-950/70">
                                            {role === 'model' ? 'Verified Model' : 'Member'}
                                        </Badge>
                                        <div className="flex items-center text-sm text-zinc-400 bg-zinc-950/30 px-3 py-0.5 rounded-full border border-zinc-800">
                                            <CalendarDays className="w-3 h-3 mr-2" />
                                            Joined {joinedDate}
                                        </div>
                                    </div>
                                </div>
                                <Link href="/settings">
                                    <Button className="bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white border border-zinc-700 shadow-lg">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Edit Profile
                                    </Button>
                                </Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8 p-6 bg-zinc-950/50 rounded-xl border border-zinc-800/50">
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-amber-500">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Email Address</p>
                                        <p className="text-zinc-200 font-medium">{user.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-amber-500">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-wider font-medium">Account ID</p>
                                        <p className="text-zinc-200 font-medium font-mono text-sm">{user.id.slice(0, 8)}...</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {role === 'model' && (
                        <Card className="bg-zinc-900 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white">Creator Stats</CardTitle>
                                <CardDescription className="text-zinc-400">Quick overview of your channel performance</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Total Views', 'Followers', 'Stream Hours', 'Rating'].map((stat, i) => (
                                        <div key={i} className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                                            <div className="text-2xl font-bold text-white mb-1">
                                                {i === 3 ? '5.0' : '0'}
                                                {i === 3 && <span className="text-amber-500 text-sm ml-1">★</span>}
                                            </div>
                                            <div className="text-xs text-zinc-500 uppercase tracking-wide">{stat}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-8 text-center">
                                    <Link href="/dashboard">
                                        <Button variant="link" className="text-amber-500 hover:text-amber-400 p-0 h-auto">
                                            Go to dashboard for detailed analytics &rarr;
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
