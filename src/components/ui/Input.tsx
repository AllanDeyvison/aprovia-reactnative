import React, { forwardRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from "react-native";
import { Eye, EyeOff } from "lucide-react-native";
import { useTheme } from "@/contexts/ThemeContext";

interface InputProps
  extends Omit<TextInputProps, "style" | "value" | "onChangeText"> {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;

  /**
   * Deixe false enquanto testamos o problema do Android.
   * Depois pode ser ativado somente nos campos de senha.
   */
  showPasswordToggle?: boolean;
}

export const Input = forwardRef<TextInput, InputProps>(
  (
    {
      value,
      onChangeText,
      label,
      error,
      containerStyle,
      secureTextEntry = false,
      showPasswordToggle = false,
      editable = true,
      autoCapitalize,
      autoCorrect,
      autoComplete = "off",
      importantForAutofill = "no",
      placeholder,
      multiline = false,
      numberOfLines,
      onFocus,
      onBlur,
      ...textInputProps
    },
    ref
  ) => {
    const { theme } = useTheme();
    const [passwordVisible, setPasswordVisible] = useState(false);

    const passwordToggleEnabled =
      secureTextEntry && showPasswordToggle;

    const passwordIsHidden =
      secureTextEntry &&
      (!passwordToggleEnabled || !passwordVisible);

    return (
      <View style={[styles.container, containerStyle]}>
        {label ? (
          <Text
            style={[
              styles.label,
              { color: theme.colors.text },
            ]}
          >
            {label}
          </Text>
        ) : null}

        <View
          style={[
            styles.inputWrapper,
            {
              borderColor: error
                ? theme.colors.error
                : theme.colors.border,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <TextInput
            ref={ref}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={theme.colors.textSecondary}
            editable={editable}
            secureTextEntry={passwordIsHidden}
            autoCapitalize={
              autoCapitalize ??
              (secureTextEntry ? "none" : "sentences")
            }
            autoCorrect={
              autoCorrect ?? !secureTextEntry
            }
            autoComplete={autoComplete}
            importantForAutofill={importantForAutofill}
            multiline={multiline}
            numberOfLines={numberOfLines}
            onFocus={onFocus}
            onBlur={onBlur}
            accessibilityLabel={label ?? placeholder}
            accessibilityState={{ disabled: !editable }}
            style={[
              styles.input,
              multiline && styles.multilineInput,
              {
                color: theme.colors.text,
              },
            ]}
            {...textInputProps}
          />

          {passwordToggleEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                passwordVisible
                  ? "Ocultar senha"
                  : "Mostrar senha"
              }
              accessibilityState={{
                expanded: passwordVisible,
              }}
              hitSlop={8}
              onPress={() => {
                setPasswordVisible((current) => !current);
              }}
              style={styles.iconButton}
            >
              {passwordVisible ? (
                <EyeOff
                  size={20}
                  color={theme.colors.textSecondary}
                />
              ) : (
                <Eye
                  size={20}
                  color={theme.colors.textSecondary}
                />
              )}
            </Pressable>
          ) : null}
        </View>

        {error ? (
          <Text
            accessibilityRole="alert"
            style={[
              styles.error,
              { color: theme.colors.error },
            ]}
          >
            {error}
          </Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = "Input";

const styles = StyleSheet.create({
  container: {
    marginBottom: 14,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 7,
  },

  inputWrapper: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 15,
  },

  input: {
    flex: 1,
    minHeight: 52,
    fontSize: 16,
    paddingVertical: Platform.OS === "android" ? 10 : 13,
  },

  multilineInput: {
    minHeight: 110,
    paddingTop: 14,
    textAlignVertical: "top",
  },

  iconButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    marginLeft: 4,
  },

  error: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 5,
  },
});
// import React, { useState } from "react";
// import {
//   TextInput,
//   StyleSheet,
//   View,
//   Text,
//   Pressable,
//   ViewStyle,
//   TextStyle,
//   TextInputProps,
// } from "react-native";
// import { Eye, EyeOff } from "lucide-react-native";
// import { useTheme } from "@/contexts/ThemeContext";

// interface InputProps {
//   autoCapitalize?: TextInputProps["autoCapitalize"];
//   autoCorrect?: boolean;
//   placeholder?: string;
//   value: string;
//   onChangeText: (text: string) => void;
//   secureTextEntry?: boolean;
//   keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
//   editable?: boolean;
//   multiline?: boolean;
//   numberOfLines?: number;
//   error?: string;
//   label?: string;
//   style?: ViewStyle;
//   inputStyle?: TextStyle;
//   maxLength?: number;
// }

// export const Input: React.FC<InputProps> = ({
//   placeholder,
//   value,
//   onChangeText,
//   secureTextEntry = false,
//   keyboardType = "default",
//   editable = true,
//   multiline = false,
//   numberOfLines = 1,
//   error,
//   label,
//   style,
//   inputStyle,
//   maxLength,
//   autoCapitalize,
//   autoCorrect,
// }) => {
//   const { theme } = useTheme();
//   const [isFocused, setIsFocused] = useState(false);
//   const [showPassword, setShowPassword] = useState(!secureTextEntry);

//   return (
//     <View style={[styles.container, style]}>
//       {label ? <Text style={[styles.label, { color: theme.colors.text }]}>{label}</Text> : null}
//       <View
//         style={[
//           styles.inputWrapper,
//           {
//             borderColor: error ? theme.colors.error : isFocused ? theme.colors.primary : theme.colors.border,
//             backgroundColor: theme.colors.surface,
//             shadowColor: isFocused ? theme.colors.primary : "transparent",
//           },
//         ]}
//       >
//         <TextInput
//           accessibilityLabel={label}
//           autoCapitalize={autoCapitalize}
//           autoCorrect={autoCorrect}
//           placeholder={placeholder}
//           value={value}
//           onChangeText={onChangeText}
//           secureTextEntry={secureTextEntry && !showPassword}
//           keyboardType={keyboardType}
//           editable={editable}
//           multiline={multiline}
//           numberOfLines={numberOfLines}
//           maxLength={maxLength}
//           onFocus={() => setIsFocused(true)}
//           onBlur={() => setIsFocused(false)}
//           style={[styles.input, { color: theme.colors.text }, inputStyle]}
//           placeholderTextColor={theme.colors.textSecondary}
//         />
//         {secureTextEntry ? (
//           <Pressable
//             accessibilityRole="button"
//             accessibilityLabel={showPassword ? "Ocultar senha" : "Mostrar senha"}
//             onPress={() => setShowPassword(!showPassword)}
//             style={styles.iconButton}
//           >
//             {showPassword ? <Eye size={19} color={theme.colors.textSecondary} /> : <EyeOff size={19} color={theme.colors.textSecondary} />}
//           </Pressable>
//         ) : null}
//       </View>
//       {error ? <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text> : null}
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { marginBottom: 14 },
//   label: { fontSize: 14, fontWeight: "700", marginBottom: 7 },
//   inputWrapper: {
//     flexDirection: "row",
//     alignItems: "center",
//     borderWidth: 1,
//     borderRadius: 16,
//     paddingHorizontal: 15,
//     minHeight: 54,
//     shadowOpacity: 0.12,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 0 },
//   },
//   input: { flex: 1, fontSize: 16, paddingVertical: 13, outlineStyle: "none" } as any,
//   iconButton: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12 },
//   error: { fontSize: 12, fontWeight: "600", marginTop: 5 },
// });
