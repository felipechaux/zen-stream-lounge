"use client";

import dynamic from "next/dynamic";

const StreamingRoom = dynamic(() => import("@/components/streaming/StreamingRoom"), { ssr: false });

export default function StreamingRoomClient(props: any) {
  return <StreamingRoom {...props} />;
}