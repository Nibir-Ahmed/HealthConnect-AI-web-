import { auth, firestore } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection as fsCollection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  arrayUnion,
} from 'firebase/firestore';
import { isRemotePlaceholder, resolveAvatar, resolveCover } from '../utils/avatar';

const DB_PREFIX = 'healthconnect_app_';
const OVERRIDES_KEY = 'healthconnect_app_local_overrides';

// Initial Empty Schema per database specification (No dummy/seed records)
const INITIAL_SCHEMA = {
  users: [],
  doctors: [],
  appointments: [],
  prescriptions: [],
  blogs: [],
  health_records: [],
  messages: [],
  system_config: {
    maintenanceMode: false,
    emergencyPhone: '999',
    announcement: null,
  },
};

const COLLECTIONS = [
  'users',
  'doctors',
  'appointments',
  'prescriptions',
  'blogs',
  'health_records',
  'messages',
];

function initStorage() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (
        key &&
        (key.startsWith('healthconnect_v2_') ||
          key.startsWith('healthconnect_app_usr_demo_') ||
          key === 'healthconnect_app_seeded')
      ) {
        localStorage.removeItem(key);
      }
    }
  } catch (err) {
    console.warn('Storage purge warning:', err);
  }

  for (const [key, value] of Object.entries(INITIAL_SCHEMA)) {
    const storageKey = `${DB_PREFIX}${key}`;
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, JSON.stringify(value));
    }
  }
}

initStorage();

export const dbReady = Promise.resolve(true);

function getOverrides() {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveOverride(collection, id, updates, deleted = false) {
  const all = getOverrides();
  if (!all[collection]) all[collection] = {};
  if (deleted) {
    all[collection][id] = { __deleted: true };
  } else {
    all[collection][id] = { ...(all[collection][id] || {}), ...updates };
  }
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
}

function clearOverride(collection, id) {
  const all = getOverrides();
  if (all[collection] && all[collection][id]) {
    delete all[collection][id];
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify(all));
  }
}

const AVATAR_FIELDS = {
  avatar: 'name',
  doctorAvatar: 'doctorName',
  patientAvatar: 'patientName',
  authorAvatar: 'author',
};

// Swap any old third-party placeholder image links for locally generated / bundled images
function localizeImages(item) {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
  let changed = null;
  for (const [field, nameField] of Object.entries(AVATAR_FIELDS)) {
    if (field in item && (!item[field] || isRemotePlaceholder(item[field]))) {
      changed = changed || { ...item };
      changed[field] = resolveAvatar(item[field], item[nameField] || item.email || 'User');
    }
  }
  if (typeof item.image === 'string' && isRemotePlaceholder(item.image)) {
    changed = changed || { ...item };
    changed.image = resolveCover(item.image);
  }
  return changed || item;
}

function getStore(collection) {
  const data = localStorage.getItem(`${DB_PREFIX}${collection}`);
  if (!data) return null;
  const parsed = JSON.parse(data);
  return Array.isArray(parsed) ? parsed.map(localizeImages) : parsed;
}

function setStore(collection, data) {
  localStorage.setItem(`${DB_PREFIX}${collection}`, JSON.stringify(data));
  window.dispatchEvent(new CustomEvent(`hc_db_${collection}`, { detail: data }));
  window.dispatchEvent(new Event('hc_db_any'));
}

// Merge incoming Firestore docs with existing local/override items so nothing is lost
function mergeSnapshotIntoStore(collection, docs) {
  const colOverrides = getOverrides()[collection] || {};
  const existingItems = getStore(collection) || [];
  const mergedMap = new Map();

  // Start with existing cached items (excluding deleted ones)
  for (const item of existingItems) {
    if (!item?.id) continue;
    if (colOverrides[item.id]?.__deleted) continue;
    mergedMap.set(item.id, { ...item, ...(colOverrides[item.id] || {}) });
  }

  // Overlay latest Firestore documents
  for (const d of docs) {
    const id = d.id;
    const ov = colOverrides[id];
    if (ov?.__deleted) {
      mergedMap.delete(id);
      continue;
    }
    const prev = mergedMap.get(id) || {};
    const fsData = d.data() || {};
    const mergedItem = { ...prev, id, ...fsData, ...(ov || {}) };

    // Never allow local overrides to wipe out chatMessages from Firestore
    if (collection === 'appointments') {
      const chatMap = new Map();
      for (const list of [prev.chatMessages, ov?.chatMessages, fsData.chatMessages]) {
        if (Array.isArray(list)) {
          for (const m of list) {
            if (m?.id) chatMap.set(m.id, m);
          }
        }
      }
      if (chatMap.size > 0) {
        mergedItem.chatMessages = Array.from(chatMap.values());
      }
    }

    mergedMap.set(id, mergedItem);
  }

  // Also include any override items not yet in store
  for (const [ovId, ovData] of Object.entries(colOverrides)) {
    if (!ovData.__deleted && ovData.id && !mergedMap.has(ovId)) {
      mergedMap.set(ovId, ovData);
    }
  }

  const finalItems = Array.from(mergedMap.values());
  finalItems.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  setStore(collection, finalItems);

  // If appointments updated, synchronize embedded chatMessages <-> messages store
  if (collection === 'appointments') {
    const existingMsgs = getStore('messages') || [];
    const msgMap = new Map(existingMsgs.map((m) => [m.id, m]));
    let addedToLocal = false;

    for (const apt of finalItems) {
      const aptChatIds = new Set(
        Array.isArray(apt.chatMessages) ? apt.chatMessages.map((m) => m?.id).filter(Boolean) : []
      );

      // 1. Pull incoming Firestore chatMessages into local messages store
      if (Array.isArray(apt.chatMessages)) {
        for (const m of apt.chatMessages) {
          if (m?.id && !msgMap.has(m.id)) {
            msgMap.set(m.id, m);
            addedToLocal = true;
          }
        }
      }

      // 2. Push any local messages for this appointment that aren't in Firestore yet
      if (auth.currentUser) {
        const unsynced = existingMsgs.filter(
          (m) => m?.id && m.appointmentId === apt.id && !aptChatIds.has(m.id)
        );
        if (unsynced.length > 0) {
          updateDoc(doc(firestore, 'appointments', apt.id), {
            chatMessages: arrayUnion(...unsynced.map((m) => cleanData(m))),
          }).catch(() => {});
        }
      }
    }

    if (addedToLocal) {
      setStore('messages', Array.from(msgMap.values()));
    }
  }
}

// Track active Firestore real-time unsubscribers
const activeUnsubscribers = new Map();
const requestedCollections = new Set();

function clearListener(collection) {
  if (activeUnsubscribers.has(collection)) {
    const unsub = activeUnsubscribers.get(collection);
    if (typeof unsub === 'function') unsub();
    activeUnsubscribers.delete(collection);
  }
}

// When Firestore rules block unfiltered collection queries on appointments/prescriptions/health_records
// for non-admin users, fall back to scoped queries by patientId and doctorId
function attachScopedFallbackListener(collection) {
  const currentUser = auth.currentUser;
  if (!currentUser) return;
  const uid = currentUser.uid;

  if (collection === 'appointments' || collection === 'prescriptions') {
    const qPatient = query(fsCollection(firestore, collection), where('patientId', '==', uid));
    const qDoctor = query(fsCollection(firestore, collection), where('doctorId', '==', uid));

    const unsub1 = onSnapshot(
      qPatient,
      (snap) => mergeSnapshotIntoStore(collection, snap.docs),
      () => {}
    );
    const unsub2 = onSnapshot(
      qDoctor,
      (snap) => mergeSnapshotIntoStore(collection, snap.docs),
      () => {}
    );

    activeUnsubscribers.set(collection, () => {
      unsub1();
      unsub2();
    });
  } else if (collection === 'health_records') {
    const qPatient = query(fsCollection(firestore, collection), where('patientId', '==', uid));
    const unsub = onSnapshot(
      qPatient,
      (snap) => mergeSnapshotIntoStore(collection, snap.docs),
      () => {}
    );
    activeUnsubscribers.set(collection, unsub);
  }
}

function attachFirestoreListener(collection) {
  clearListener(collection);

  if (collection === 'system_config') {
    const unsub = onSnapshot(
      doc(firestore, 'system_config', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          const overrides = getOverrides().system_config?.global || {};
          setStore('system_config', { ...docSnap.data(), ...overrides });
        }
      },
      () => {
        activeUnsubscribers.delete(collection);
      }
    );
    activeUnsubscribers.set(collection, unsub);
    return;
  }

  if (!COLLECTIONS.includes(collection)) return;

  // For collections that require authentication in firestore.rules, wait until auth.currentUser is present
  const publicCollections = ['doctors', 'blogs'];
  if (!publicCollections.includes(collection) && !auth.currentUser) {
    return;
  }

  const unsub = onSnapshot(
    fsCollection(firestore, collection),
    (snapshot) => {
      mergeSnapshotIntoStore(collection, snapshot.docs);
    },
    () => {
      activeUnsubscribers.delete(collection);
      // Automatically switch to scoped queries (where patientId/doctorId == uid)
      attachScopedFallbackListener(collection);
    }
  );
  activeUnsubscribers.set(collection, unsub);
}

function ensureFirestoreSync(collection) {
  requestedCollections.add(collection);
  if (!activeUnsubscribers.has(collection)) {
    attachFirestoreListener(collection);
  }
}

// Re-attach listeners whenever Firebase Auth user signs in/out
onAuthStateChanged(auth, () => {
  for (const col of requestedCollections) {
    attachFirestoreListener(col);
  }
});

// Sync across browser tabs immediately when localStorage changes in another tab
window.addEventListener('storage', (event) => {
  if (!event.key) return;
  if (event.key.startsWith(DB_PREFIX)) {
    const col = event.key.slice(DB_PREFIX.length);
    window.dispatchEvent(new CustomEvent(`hc_db_${col}`, { detail: getStore(col) }));
    window.dispatchEvent(new Event('hc_db_any'));
  } else if (event.key === OVERRIDES_KEY) {
    for (const col of requestedCollections) {
      attachFirestoreListener(col);
    }
  }
});

// Remove undefined fields before sending to Firestore
function cleanData(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined)
  );
}

export const db = {
  // Query collection list
  list(collection, predicate = null) {
    ensureFirestoreSync(collection);
    const items = getStore(collection) || [];
    return predicate ? items.filter(predicate) : [...items];
  },

  // Get single document by ID
  get(collection, id) {
    ensureFirestoreSync(collection);
    if (collection === 'system_config') {
      return getStore(collection);
    }
    const items = getStore(collection) || [];
    return items.find((item) => item.id === id || item.uid === id) || null;
  },

  // Add document
  add(collection, item) {
    const items = getStore(collection) || [];
    const newId = item.id || `hc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newItem = cleanData({
      ...item,
      id: newId,
      createdAt: item.createdAt || new Date().toISOString(),
    });
    saveOverride(collection, newId, newItem);
    items.unshift(newItem);
    setStore(collection, items);

    // Save to Cloud Firestore
    setDoc(doc(firestore, collection, newId), newItem)
      .then(() => clearOverride(collection, newId))
      .catch(() => {});

    // Also sync chat messages inside parent appointment document(s) so Patient & Doctor receive them in real-time via Firestore
    if (collection === 'messages' && newItem.appointmentId) {
      const allApts = getStore('appointments') || [];
      const targetAptIds = new Set([newItem.appointmentId]);
      for (const apt of allApts) {
        if (
          apt?.id &&
          newItem.patientId &&
          newItem.doctorId &&
          apt.patientId === newItem.patientId &&
          (apt.doctorId === newItem.doctorId || apt.doctorDocId === newItem.doctorId)
        ) {
          targetAptIds.add(apt.id);
        }
      }
      for (const aptId of targetAptIds) {
        updateDoc(doc(firestore, 'appointments', aptId), {
          chatMessages: arrayUnion(newItem),
        }).catch(() => {});
      }
    }

    return newItem;
  },

  // Update document
  update(collection, id, updates) {
    const cleanUpdates = cleanData(updates);

    if (collection === 'system_config') {
      const current = getStore(collection) || {};
      const updated = { ...current, ...cleanUpdates };
      saveOverride('system_config', 'global', cleanUpdates);
      setStore(collection, updated);

      setDoc(doc(firestore, 'system_config', 'global'), updated, { merge: true })
        .then(() => clearOverride('system_config', 'global'))
        .catch(() => {});
      return updated;
    }

    const items = getStore(collection) || [];
    const index = items.findIndex((item) => item.id === id || item.uid === id);
    const mergedItem = index !== -1 ? { ...items[index], ...cleanUpdates } : { id, ...cleanUpdates };
    saveOverride(collection, id, mergedItem);

    if (index !== -1) {
      items[index] = mergedItem;
      setStore(collection, items);
    }

    // Update in Cloud Firestore
    updateDoc(doc(firestore, collection, id), cleanUpdates)
      .then(() => clearOverride(collection, id))
      .catch(() =>
        setDoc(doc(firestore, collection, id), cleanUpdates, { merge: true })
          .then(() => clearOverride(collection, id))
          .catch(() => {})
      );

    return mergedItem;
  },

  // Remove document
  remove(collection, id) {
    saveOverride(collection, id, null, true);
    const items = getStore(collection) || [];
    const filtered = items.filter((item) => item.id !== id && item.uid !== id);
    setStore(collection, filtered);

    // Delete from Cloud Firestore
    deleteDoc(doc(firestore, collection, id))
      .then(() => clearOverride(collection, id))
      .catch(() => {});

    return true;
  },

  // Real-time listener subscription
  subscribe(collection, callback) {
    ensureFirestoreSync(collection);
    const handler = () => {
      callback(getStore(collection));
    };
    window.addEventListener(`hc_db_${collection}`, handler);
    // Initial emission
    callback(getStore(collection));
    return () => {
      window.removeEventListener(`hc_db_${collection}`, handler);
    };
  },
};

export default db;
