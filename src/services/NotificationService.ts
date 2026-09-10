import { Alert } from "react-native";

type ToastType = "success" | "error" | "info" | "warning";

export const NotificationService = {
  /**
   * Show an alert dialog
   */
  alert(title: string, message: string, buttons?: any[]): void {
    Alert.alert(title, message, buttons);
  },

  /**
   * Show a success message
   */
  success(message: string): void {
    Alert.alert("Sucesso", message, [{ text: "OK" }]);
  },

  /**
   * Show an error message
   */
  error(message: string): void {
    Alert.alert("Erro", message, [{ text: "OK" }]);
  },

  /**
   * Show a warning message
   */
  warning(message: string): void {
    Alert.alert("Aviso", message, [{ text: "OK" }]);
  },

  /**
   * Show an info message
   */
  info(message: string): void {
    Alert.alert("Informação", message, [{ text: "OK" }]);
  },

  /**
   * Show a confirmation dialog
   */
  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    Alert.alert(title, message, [
      {
        text: "Cancelar",
        onPress: onCancel || (() => {}),
        style: "cancel",
      },
      {
        text: "Confirmar",
        onPress: onConfirm,
      },
    ]);
  },
};
