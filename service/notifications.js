// service/notifications.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { database } from "./appwrite";
import { ID, Query } from "react-native-appwrite";
const DATABASE_ID = "69f5df9e0023e090ae30";
const NOTIFICATIONS_COLLECTION = "6abbf00a00153524def7";
const NOTIF_KEY = "@user_notifications";

// ======================== 1. NOTIFICATION UUMUU ========================
export async function createNotification({
  userId, // 🔔 kan notification argatu (post owner)
  actorId, // 👤 kan hojii hojjete (current user)
  actorName, // 👤 maqaa actor
  actorAvatar, // 🖼️ avatar URL
  type, // ❤️ like | 💬 comment | 🔗 share | 💾 save | ✉️ message | 👁️ view
  postId,
  postName, // "Villa 3 Bedroom"
  postImage, // image URL
  message, // "post kee like godhe"
  extra = {}, // comment text, reaction emoji, etc.
}) {
  // Ofii of notification hin uumu
  if (userId === actorId) return null;

  const notifData = {
    userId,
    actorId,
    actorName: actorName || "User",
    actorAvatar: actorAvatar || "",
    type,
    postId,
    postName: postName || "",
    postImage: postImage || "",
    message,
    extra: JSON.stringify(extra),
    isRead: false,
  };

  try {
    // Appwrite irratti uumi
    const doc = await database.createDocument(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      ID.unique(),
      notifData,
    );

    // Local storage irrattis kuusi
    await saveLocalNotification({
      ...notifData,
      $id: doc.$id,
      $createdAt: doc.$createdAt,
    });

    return doc;
  } catch (err) {
    console.warn("Appwrite notif error, local only:", err.message);

    // Appwrite dhaan badeera taanaan, local qofa
    const localDoc = {
      ...notifData,
      $id: `local_${Date.now()}`,
      $createdAt: new Date().toISOString(),
    };
    await saveLocalNotification(localDoc);
    return localDoc;
  }
}

// ======================== 2. LOCAL STORAGE ========================
async function saveLocalNotification(notif) {
  try {
    const existing = await AsyncStorage.getItem(NOTIF_KEY);
    const list = existing ? JSON.parse(existing) : [];
    const updated = [notif, ...list].slice(0, 200);
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Local notif save error:", e);
  }
}

// ======================== 3. NOTIFICATIONS ARGACHUU ========================
export async function getNotifications() {
  try {
    // Appwrite irraa fiduu yaali
    const res = await database.listDocuments(
      DATABASE_ID,
      NOTIFICATIONS_COLLECTION,
      [Query.orderDesc("$createdAt"), Query.limit(100)],
    );

    const list = res.documents.map((d) => ({
      $id: d.$id,
      $createdAt: d.$createdAt,
      userId: d.userId,
      actorId: d.actorId,
      actorName: d.actorName || "User",
      actorAvatar: d.actorAvatar || "",
      type: d.type,
      postId: d.postId,
      postName: d.postName || "",
      postImage: d.postImage || "",
      message: d.message,
      extra: d.extra ? JSON.parse(d.extra) : {},
      isRead: d.isRead,
    }));

    // Local cache update
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(list));
    return list;
  } catch (err) {
    // Offline — local fayyadami
    const existing = await AsyncStorage.getItem(NOTIF_KEY);
    return existing ? JSON.parse(existing) : [];
  }
}

// ======================== 4. MARK AS READ ========================
export async function markAsRead(notifId) {
  // Local
  const existing = await AsyncStorage.getItem(NOTIF_KEY);
  const list = existing ? JSON.parse(existing) : [];
  const updated = list.map((n) =>
    n.$id === notifId ? { ...n, isRead: true } : n,
  );
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(updated));

  // Appwrite
  try {
    if (!notifId.startsWith("local_")) {
      await database.updateDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION,
        notifId,
        { isRead: true },
      );
    }
  } catch (e) {
    console.warn("Mark read error:", e.message);
  }
}

// ======================== 5. MARK ALL READ ========================
export async function markAllAsRead() {
  const existing = await AsyncStorage.getItem(NOTIF_KEY);
  const list = existing ? JSON.parse(existing) : [];
  await AsyncStorage.setItem(
    NOTIF_KEY,
    JSON.stringify(list.map((n) => ({ ...n, isRead: true }))),
  );

  try {
    const unread = list.filter((n) => !n.isRead && !n.$id.startsWith("local_"));
    await Promise.all(
      unread.map((n) =>
        database
          .updateDocument(DATABASE_ID, NOTIFICATIONS_COLLECTION, n.$id, {
            isRead: true,
          })
          .catch(() => {}),
      ),
    );
  } catch (e) {
    console.warn(e);
  }
}

// ======================== 6. DELETE ========================
export async function deleteNotification(notifId) {
  const existing = await AsyncStorage.getItem(NOTIF_KEY);
  const list = existing ? JSON.parse(existing) : [];
  await AsyncStorage.setItem(
    NOTIF_KEY,
    JSON.stringify(list.filter((n) => n.$id !== notifId)),
  );

  try {
    if (!notifId.startsWith("local_")) {
      await database.deleteDocument(
        DATABASE_ID,
        NOTIFICATIONS_COLLECTION,
        notifId,
      );
    }
  } catch (e) {
    console.warn(e);
  }
}

export async function clearAllNotifications() {
  await AsyncStorage.removeItem(NOTIF_KEY);
}

// ======================== 7. UNREAD COUNT ========================
export async function getUnreadCount() {
  const list = await getNotifications();
  return list.filter((n) => !n.isRead).length;
}
