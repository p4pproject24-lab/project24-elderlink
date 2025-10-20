import { TouchableOpacity, StyleSheet, type ViewStyle } from "react-native"
import { Ionicons } from "@expo/vector-icons"

type IconButtonProps = {
  name: keyof typeof Ionicons.glyphMap
  size?: number
  color?: string
  onPress: () => void
  style?: ViewStyle
  backgroundColor?: string
}

const IconButton = ({
  name,
  size = 24,
  color = "#5EBFB5",
  onPress,
  style,
  backgroundColor = "#E8F5F3",
}: IconButtonProps) => {
  return (
    <TouchableOpacity testID="icon-button" style={[styles.button, { backgroundColor }, style]} onPress={onPress} activeOpacity={0.7}>
      <Ionicons name={name} size={size} color={color} />
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
})

export default IconButton 