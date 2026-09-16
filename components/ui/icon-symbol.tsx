import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconSymbolName = keyof typeof MAPPING;
type MaterialIconName = ComponentProps<typeof MaterialIcons>["name"];

const MAPPING: Record<string, MaterialIconName> = {
  "house.fill": "home",
  "book.closed.fill": "menu-book",
  "bubble.left.and.bubble.right.fill": "forum",
  "heart.fill": "favorite",
  "arrow.forward": "arrow-forward",
  "arrow.up": "arrow-upward",
  "arrow.up.right": "north-east",
  "paperclip": "attach-file",
  "share": "share",
  "volume.up": "volume-up",
  "whatsapp": "chat",
  "accessibility": "accessibility",
  "music-note": "music-note",
  "arrow.down.circle.fill": "download",
  "checkmark.circle.fill": "check-circle",
  "checkmark": "check",
  "doc.on.doc.fill": "content-copy",
  qrcode: "qr-code-2",
  "lock.fill": "lock",
  "plus.circle.fill": "add-circle",
  "info.circle.fill": "info",
  "sparkles": "auto-awesome",
  "chevron.right": "chevron-right",
  "chevron.up": "expand-less",
  "auto-stories": "auto-stories",
  "groups": "groups",
  "spa": "spa",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
};

export function IconSymbol({ name, size = 24, color, style }: { name: IconSymbolName; size?: number; color: string | OpaqueColorValue; style?: StyleProp<TextStyle>; weight?: SymbolWeight }) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
