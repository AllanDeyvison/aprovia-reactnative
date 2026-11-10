import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext";

const ProfilePictureContext = createContext<{ revision: number; invalidatePicture: () => void } | undefined>(undefined);
export function ProfilePictureProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  useEffect(() => { setRevision((value) => value + 1); }, [user?.id, user?.picture]);
  const invalidatePicture = useCallback(() => setRevision((value) => value + 1), []);
  return <ProfilePictureContext.Provider value={{ revision, invalidatePicture }}>{children}</ProfilePictureContext.Provider>;
}
export function useProfilePicture() {
  const context = useContext(ProfilePictureContext);
  if (!context) throw new Error("useProfilePicture deve ser usado dentro de ProfilePictureProvider");
  return context;
}
