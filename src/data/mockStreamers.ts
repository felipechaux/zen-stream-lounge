
export interface Streamer {
    id: string;
    name: string;
    age: number;
    location: string;
    image: string;
    tags: string[];
    viewers: number;
    isLive: boolean;
    isPremium: boolean;
    status: 'free' | 'private' | 'ticket';
    rating: number;
}

export const MOCK_STREAMERS: Streamer[] = [
    {
        id: "stream-1",
        name: "Valentina Rose",
        age: 23,
        location: "Colombia",
        image: "/latina.png",
        tags: ["Latina", "Curvy", "Bedroom", "Oil"],
        viewers: 2420,
        isLive: true,
        isPremium: true,
        status: 'ticket',
        rating: 4.9
    },
    {
        id: "stream-2",
        name: "Sapphire Blue",
        age: 21,
        location: "USA",
        image: "/blonde.png",
        tags: ["Gamer Girl", "Blonde", "Tease", "Interactive"],
        viewers: 1856,
        isLive: true,
        isPremium: false,
        status: 'free',
        rating: 4.8
    },
    {
        id: "stream-3",
        name: "Velvet Red",
        age: 25,
        location: "Russia",
        image: "/redhead.png",
        tags: ["Redhead", "Silk Robe", "Mature", "Private"],
        viewers: 3100,
        isLive: true,
        isPremium: true,
        status: 'private',
        rating: 5.0
    },
    {
        id: "stream-4",
        name: "Yuki Moon",
        age: 20,
        location: "Japan",
        image: "/asian.png",
        tags: ["Asian", "Student", "Cute", "Cosplay"],
        viewers: 1540,
        isLive: true,
        isPremium: false,
        status: 'free',
        rating: 4.7
    },
    {
        id: "stream-5",
        name: "Isabella L",
        age: 22,
        location: "Brazil",
        image: "/latina.png",
        tags: ["Latina", "Big Booty", "Twerk", "Dancing"],
        viewers: 1890,
        isLive: true,
        isPremium: true,
        status: 'ticket',
        rating: 4.8
    },
    {
        id: "stream-6",
        name: "Scarlett Fire",
        age: 24,
        location: "Ireland",
        image: "/redhead.png",
        tags: ["Pale", "Pierced", "Tattooed", "Alternative"],
        viewers: 3200,
        isLive: true,
        isPremium: true,
        status: 'private',
        rating: 4.9
    },
    {
        id: "stream-7",
        name: "Candy Sweet",
        age: 19,
        location: "Canada",
        image: "/blonde.png",
        tags: ["College", "Cheerleader", "Bubbly", "Petite"],
        viewers: 900,
        isLive: true,
        isPremium: false,
        status: 'free',
        rating: 4.6
    },
    {
        id: "stream-8",
        name: "Hana Song",
        age: 23,
        location: "Korea",
        image: "/asian.png",
        tags: ["K-Pop", "Model", "Fashion", "Feet"],
        viewers: 2140,
        isLive: true,
        isPremium: true,
        status: 'ticket',
        rating: 4.8
    }
];
