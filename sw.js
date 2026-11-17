/**
 * Service Worker ECHO H / SaniLoc.
 *
 * Rôle :
 *  - permettre l'affichage des notifications « push » même onglet fermé
 *    (obligatoire sur Chrome Android : new Notification() hors SW est interdit) ;
 *  - gérer le clic sur une notification (ouvre la bonne page de l'app) ;
 *  - recevoir un vrai push serveur (événement "push") quand un backend sera branché.
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

/** Clic sur une notification : ferme puis navigue vers la page cible. */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  let target = new URL("./", self.location.href).href;
  try {
    const data = event.notification.data || {};
    if (data.url) {
      target = new URL(data.url, self.location.origin).href;
    } else if (data.path) {
      target = `${new URL("./", self.location.href).href}#${data.path}`;
    }
  } catch {
    /* lien invalide — on garde la racine */
  }

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (new URL(client.url).origin === self.location.origin && "focus" in client) {
          client.navigate(target);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(target);
    }),
  );
});

/** Vrai push serveur (à brancher quand un backend existe). */
self.addEventListener("push", (event) => {
  let payload = {
    title: "ECHO H — SaniLoc",
    body: "Nouvelle alerte.",
    icon: "logo-fleet.png",
    badge: "logo-fleet.png",
    data: {},
  };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch {
    if (event.data) payload.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: payload.icon,
      badge: payload.badge,
      tag: payload.tag || payload.title,
      renotify: true,
      data: payload.data,
    }),
  );
});