export const PushNotificationService = {
  isSupported: false,
  async requestAndRegister() { return { ok: false, token: null, reason: "Notificações push não estão disponíveis na web." }; },
  async unregister() {},
  subscribe() { return () => {}; },
};
