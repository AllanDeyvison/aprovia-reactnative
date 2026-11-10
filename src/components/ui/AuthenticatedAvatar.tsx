import React, { useEffect, useState } from "react";
import { Platform } from "react-native";
import { Avatar } from "./Avatar";
import { ProfilePictureService } from "@/services/ProfilePictureService";
import { useProfilePicture } from "@/contexts/ProfilePictureContext";

export function AuthenticatedAvatar({ userId, initials, size = "medium" }: { userId?: number; initials?: string; size?: "small" | "medium" | "large" }) {
  const { revision } = useProfilePicture();
  const [webUrl, setWebUrl] = useState<string>();
  useEffect(() => {
    let active = true;
    let url: string | undefined;
    if (!userId || Platform.OS !== "web") { setWebUrl(undefined); return; }
    void ProfilePictureService.webObjectUrl(userId).then((next) => { if (active) { url = next; setWebUrl(next); } else URL.revokeObjectURL(next); }).catch(() => active && setWebUrl(undefined));
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [userId, revision]);
  if (!userId) return <Avatar initials={initials} size={size} />;
  return <Avatar initials={initials} size={size} source={Platform.OS === "web" ? (webUrl ? { uri: webUrl } : undefined) : ProfilePictureService.nativeSource(userId)} />;
}
