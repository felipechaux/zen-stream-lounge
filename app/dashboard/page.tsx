'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, Users, DollarSign, Clock, Video, Radio, Activity, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const analyticsData = [
    { name: 'Day 1', viewers: 400 },
    { name: 'Day 5', viewers: 300 },
    { name: 'Day 10', viewers: 550 },
    { name: 'Day 15', viewers: 450 },
    { name: 'Day 20', viewers: 700 },
    { name: 'Day 25', viewers: 600 },
    { name: 'Day 30', viewers: 900 },
]

import Header from '@/components/layout/Header'

export default function DashboardPage() {
    const { user, role, loading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth')
            } else if (role !== 'model') {
                router.push('/')
            }
        }
    }, [user, role, loading, router])

    if (loading || !user || role !== 'model') {
        return (
            <div className="min-h-screen pt-24 px-4 flex items-center justify-center bg-zinc-950">
                <div className="text-amber-500 animate-pulse flex items-center">
                    <Activity className="w-5 h-5 mr-2 animate-spin" />
                    Loading studio...
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-zinc-950">
            <Header />
            <div className="pb-12 px-4 sm:px-6 lg:px-8 mt-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Dashboard Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-zinc-800 pb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-white mb-2">Creator Studio</h1>
                            <p className="text-zinc-400">Manage your streams, view analytics, and grow your audience.</p>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/profile">
                                <Button variant="outline" className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                    View Profile
                                </Button>
                            </Link>
                            <Link href="/streaming">
                                <Button className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold shadow-lg shadow-amber-900/20">
                                    <Radio className="w-4 h-4 mr-2" />
                                    Go Live Now
                                </Button>
                            </Link>
                        </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard
                            title="Total Views"
                            value="12.5k"
                            change="+12%"
                            icon={<BarChart3 className="w-5 h-5 text-amber-500" />}
                        />
                        <StatCard
                            title="Active Followers"
                            value="843"
                            change="+5%"
                            icon={<Users className="w-5 h-5 text-blue-500" />}
                        />
                        <StatCard
                            title="Total Earnings"
                            value="$1,240.50"
                            change="+8.2%"
                            icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
                        />
                        <StatCard
                            title="Stream Hours"
                            value="48.5h"
                            change="+2.1h"
                            icon={<Clock className="w-5 h-5 text-purple-500" />}
                        />
                    </div>

                    {/* Main Content Area */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Analytics Section - Takes 2 columns */}
                        <div className="lg:col-span-2 space-y-6">
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center">
                                        <TrendingUp className="w-5 h-5 mr-2 text-amber-500" />
                                        Viewer Engagement
                                    </CardTitle>
                                    <CardDescription className="text-zinc-400">Live viewer trends over the last 30 days</CardDescription>
                                </CardHeader>
                                <CardContent className="h-80 w-full pt-4">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart
                                            data={analyticsData}
                                            margin={{
                                                top: 5,
                                                right: 10,
                                                left: 0,
                                                bottom: 0,
                                            }}
                                        >
                                            <defs>
                                                <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <XAxis
                                                dataKey="name"
                                                stroke="#52525b"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                            />
                                            <YAxis
                                                stroke="#52525b"
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `${value}`}
                                            />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px' }}
                                                itemStyle={{ color: '#fbbf24' }}
                                                labelStyle={{ color: '#a1a1aa' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="viewers"
                                                stroke="#f59e0b"
                                                fillOpacity={1}
                                                fill="url(#colorViewers)"
                                                strokeWidth={2}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-zinc-900 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white">Recent Sessions</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="p-2 bg-zinc-900 rounded-md">
                                                            <Video className="w-4 h-4 text-zinc-400" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">Chill Stream #{i}</p>
                                                            <p className="text-xs text-zinc-500">2 days ago • 2h 15m</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-white">1.2k</p>
                                                        <p className="text-xs text-zinc-500">Views</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="bg-zinc-900 border-zinc-800">
                                    <CardHeader>
                                        <CardTitle className="text-lg text-white">Top Donators</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {[1, 2, 3].map((i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-bold text-white">
                                                            U{i}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-white">User_{i * 99}</p>
                                                            <p className="text-xs text-zinc-500">Total Tips</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-emerald-400">${(i * 50) + 25}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Sidebar / Quick Actions - Takes 1 column */}
                        <div className="space-y-6">
                            <Card className="bg-zinc-900 border-zinc-800">
                                <CardHeader>
                                    <CardTitle className="text-white">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                        <Settings className="w-4 h-4 mr-2" />
                                        Stream Settings
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                        <Video className="w-4 h-4 mr-2" />
                                        Schedule Stream
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                                        <Users className="w-4 h-4 mr-2" />
                                        Manage Moderators
                                    </Button>
                                </CardContent>
                            </Card>

                            <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border border-indigo-500/20">
                                <h3 className="text-lg font-bold text-white mb-2">Pro Tips</h3>
                                <p className="text-sm text-indigo-200 mb-4">Engage with your audience by setting up a poll in your next stream!</p>
                                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white border-none w-full">
                                    Learn More
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function StatCard({ title, value, change, icon }: { title: string, value: string, change: string, icon: React.ReactNode }) {
    return (
        <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800">
                        {icon}
                    </div>
                    <span className="text-xs font-medium text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/50">
                        {change}
                    </span>
                </div>
                <div>
                    <p className="text-zinc-400 text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold text-white mt-1">{value}</h3>
                </div>
            </CardContent>
        </Card>
    )
}

import { Settings } from 'lucide-react'
