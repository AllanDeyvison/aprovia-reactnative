import { Platform, type ImageSourcePropType } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { authApi, AUTH_API_URL } from "./api";
import { AuthClientError } from "./authErrors";
import { getSessionToken } from "./sessionToken";
import type { User } from "../models/User";

const MAX_BYTES = 5 * 1024 * 1024;
const MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
export type ProfilePictureAsset = { uri: string; fileName?: string | null; mimeType?: string | null; fileSize?: number | null; file?: unknown };

function picturePath(userId: number) { return `/user/${userId}/picture`; }
function fileName(asset: ProfilePictureAsset) { return asset.fileName?.trim() || "profile-picture"; }
function typeFor(asset: ProfilePictureAsset) {
  if (asset.mimeType) return asset.mimeType.toLowerCase();
  const lower = fileName(asset).toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "";
}

export const ProfilePictureService = {
  async pick(): Promise<ProfilePictureAsset | null> {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsEditing: false, quality: 1 });
    if (result.canceled || !result.assets?.[0]) return null;
    const asset = result.assets[0] as ProfilePictureAsset;
    this.validate(asset);
    return asset;
  },
  validate(asset: ProfilePictureAsset) {
    const type = typeFor(asset);
    if (!MIME_TYPES.has(type)) throw new AuthClientError("Use uma imagem PNG, JPEG ou WebP.");
    if (typeof asset.fileSize === "number" && asset.fileSize > MAX_BYTES) throw new AuthClientError("A imagem é maior que o limite de 5 MB.");
    return type;
  },
  async upload(userId: number, asset: ProfilePictureAsset): Promise<User> {
    const type = this.validate(asset);
    const form = new FormData();
    if (Platform.OS === "web") {
      const blob = asset.file instanceof Blob ? asset.file : await (await fetch(asset.uri)).blob();
      if (blob.size > MAX_BYTES) throw new AuthClientError("A imagem é maior que o limite de 5 MB.");
      form.append("file", blob, fileName(asset));
    } else {
      form.append("file", { uri: asset.uri, name: fileName(asset), type } as any);
    }
    return (await authApi.put<User>(picturePath(userId), form)).data;
  },
  async remove(userId: number): Promise<User> { return (await authApi.delete<User>(picturePath(userId))).data; },
  nativeSource(userId: number): ImageSourcePropType {
    const token = getSessionToken();
    if (!token || !AUTH_API_URL) return undefined as any;
    return { uri: `${AUTH_API_URL}${picturePath(userId)}`, headers: { Authorization: `Bearer ${token}` }, cache: "reload" };
  },
  async webObjectUrl(userId: number): Promise<string> {
    if (typeof URL === "undefined" || typeof URL.createObjectURL !== "function") throw new AuthClientError("Navegador não suporta a visualização da foto.");
    const response = await authApi.get<Blob>(picturePath(userId), { responseType: "blob" });
    return URL.createObjectURL(response.data);
  },
};
