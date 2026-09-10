import { useLocalSearchParams } from "expo-router";
import { ChatScreen } from "@/components/chat/ChatScreen";
export default function ExistingChatRoute() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  return <ChatScreen chatId={Array.isArray(chatId) ? chatId[0] : chatId} />;
}
