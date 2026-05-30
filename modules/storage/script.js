import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ==========================================
// 🌍 LOCALIZATION & TRANSLATIONS LOGIC
// ==========================================
const DICTIONARY = {
    es: {
        appTitle: "Recursos Corporativos",
        openEdit: "Abrir para Editar",
        settings: "Configuración",
        emptyTitle: "Ninguna Carpeta Conectada",
        emptyDesc: "Integra tu carpeta de Google Drive para acceder y ver tus archivos directamente desde este panel.",
        connectBtn: "Conectar Carpeta de Drive",
        modalTitle: "Configuración de Carpeta",
        modalDesc: "Ingresa la URL de la carpeta de Google Drive que deseas integrar. Asegúrate de que la configuración de uso compartido permita que \"Cualquier persona con el enlace\" pueda verla.",
        inputLabel: "URL de la Carpeta de Google Drive",
        inputPlaceholder: "https://drive.google.com/drive/folders/...",
        errorMsg: "URL no válida. Por favor, ingresa un enlace válido a una carpeta de Google Drive.",
        videoTutorial: "Ver tutorial paso a paso",
        cancel: "Cancelar",
        save: "Integrar Carpeta",
        closeVideo: "Cerrar video"
    },
    en: {
        appTitle: "Corporate Resources",
        openEdit: "Open to Edit",
        settings: "Settings",
        emptyTitle: "No Folder Connected",
        emptyDesc: "Integrate your Google Drive folder to access and view your files directly from this dashboard.",
        connectBtn: "Connect Drive Folder",
        modalTitle: "Folder Settings",
        modalDesc: "Enter the URL of the Google Drive folder you want to integrate. Make sure the sharing settings allow \"Anyone with the link\" to view it.",
        inputLabel: "Google Drive Folder URL",
        inputPlaceholder: "https://drive.google.com/drive/folders/...",
        errorMsg: "Invalid URL. Please enter a valid Google Drive folder link.",
        videoTutorial: "Watch step-by-step tutorial",
        cancel: "Cancel",
        save: "Integrate Folder",
        closeVideo: "Close video"
    }
};

const urlParams = new URLSearchParams(window.location.search);
const currentLang = urlParams.get('lang') === 'en' ? 'en' : 'es';

function applyTranslations(lang) {
    document.getElementById('htmlTag').setAttribute('lang', lang);
    document.getElementById('pageTitle').textContent = DICTIONARY[lang].appTitle;
    
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (DICTIONARY[lang][key]) el.textContent = DICTIONARY[lang][key];
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (DICTIONARY[lang][key]) el.placeholder = DICTIONARY[lang][key];
    });

    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
        const key = el.getAttribute('data-i18n-aria');
        if (DICTIONARY[lang][key]) el.setAttribute('aria-label', DICTIONARY[lang][key]);
    });
}

applyTranslations(currentLang);

// ==========================================
// ☁️ FIREBASE & APP LOGIC
// ==========================================
let firebaseConfig = {};
try { firebaseConfig = JSON.parse(typeof __firebase_config !== 'undefined' ? __firebase_config : '{}'); } catch(e) {}

const app = Object.keys(firebaseConfig).length > 0 ? initializeApp(firebaseConfig) : null;
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
let currentUser = null;

const settingsBtn = document.getElementById('settingsBtn');
const openInDriveBtn = document.getElementById('openInDriveBtn');
const modalOverlay = document.getElementById('modalOverlay');
const modalCard = document.getElementById('modalCard');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelBtn = document.getElementById('cancelBtn');
const saveBtn = document.getElementById('saveBtn');
const driveUrlInput = document.getElementById('driveUrl');
const errorMessage = document.getElementById('errorMessage');
const emptyState = document.getElementById('emptyState');
const driveFrame = document.getElementById('driveFrame');
const connectEmptyBtn = document.getElementById('connectEmptyBtn');
const openVideoBtn = document.getElementById('openVideoBtn');
const videoModalOverlay = document.getElementById('videoModalOverlay');
const videoModalCard = document.getElementById('videoModalCard');
const closeVideoBtn = document.getElementById('closeVideoBtn');
const tutorialVideo = document.getElementById('tutorialVideo');

let currentFolderId = null;

async function init() {
    if (!auth || !db) {
        if (!currentFolderId) openModal();
        return;
    }
    try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
            await signInWithCustomToken(auth, __initial_auth_token);
        } else {
            await signInAnonymously(auth);
        }
    } catch (error) {
        console.error("Auth Error:", error);
        openModal();
    }
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        if (user) await loadSavedFolder();
    });
}

async function loadSavedFolder() {
    if (!db || !currentUser) return;
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'drive');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data().folderId) {
            currentFolderId = docSnap.data().folderId;
            driveUrlInput.value = `https://drive.google.com/drive/folders/${currentFolderId}`;
            embedDrive(currentFolderId);
        } else {
            openModal();
        }
    } catch (error) {
        console.error("Load Error:", error);
        openModal();
    }
}

async function saveFolderId(folderId) {
    if (!db || !currentUser) return;
    try {
        const docRef = doc(db, 'artifacts', appId, 'users', currentUser.uid, 'settings', 'drive');
        await setDoc(docRef, { folderId: folderId, updatedAt: new Date().toISOString() });
    } catch (error) {
        console.error("Save Error:", error);
    }
}

// Event Listeners
if (connectEmptyBtn) connectEmptyBtn.addEventListener('click', openModal);
settingsBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
cancelBtn.addEventListener('click', closeModal);
saveBtn.addEventListener('click', applyDriveUrl);
openVideoBtn.addEventListener('click', openVideoModal);
closeVideoBtn.addEventListener('click', closeVideoModal);

videoModalOverlay.addEventListener('click', (e) => {
    if (e.target === videoModalOverlay) closeVideoModal();
});

driveUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') applyDriveUrl();
});

driveUrlInput.addEventListener('input', () => {
    errorMessage.classList.add('hidden');
});

function openModal() {
    errorMessage.classList.add('hidden');
    modalOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        modalOverlay.classList.remove('opacity-0');
        modalCard.classList.remove('modal-enter');
        modalCard.classList.add('modal-enter-active');
    });
    setTimeout(() => driveUrlInput.focus(), 100);
}

function closeModal() {
    modalCard.classList.remove('modal-enter-active');
    modalCard.classList.add('modal-exit-active');
    modalOverlay.classList.add('opacity-0');
    setTimeout(() => {
        modalOverlay.classList.add('hidden');
        modalCard.classList.remove('modal-exit-active');
        modalCard.classList.add('modal-enter');
    }, 300);
}

function openVideoModal() {
    tutorialVideo.src = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1"; 
    videoModalOverlay.classList.remove('hidden');
    requestAnimationFrame(() => {
        videoModalOverlay.classList.remove('opacity-0');
        videoModalCard.classList.remove('modal-enter');
        videoModalCard.classList.add('modal-enter-active');
    });
}

function closeVideoModal() {
    videoModalCard.classList.remove('modal-enter-active');
    videoModalCard.classList.add('modal-exit-active');
    videoModalOverlay.classList.add('opacity-0');
    setTimeout(() => {
        videoModalOverlay.classList.add('hidden');
        videoModalCard.classList.remove('modal-exit-active');
        videoModalCard.classList.add('modal-enter');
        tutorialVideo.src = ""; 
    }, 300);
}

function embedDrive(folderId) {
    const embedUrl = `https://drive.google.com/embeddedfolderview?id=${folderId}#grid`;
    driveFrame.src = embedUrl;
    emptyState.classList.add('hidden');
    driveFrame.classList.remove('hidden');
    openInDriveBtn.href = `https://drive.google.com/drive/folders/${folderId}`;
    openInDriveBtn.classList.remove('hidden');
    openInDriveBtn.classList.add('flex');
}

function showConfetti() {
    if (typeof confetti !== 'undefined') {
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            zIndex: 9999,
            colors: ['#8b84f5', '#e07dd1', '#ff99cc', '#ffffff']
        });
    }
}

async function applyDriveUrl() {
    const url = driveUrlInput.value.trim();
    if (!url) {
        if (!currentFolderId) closeModal();
        return;
    }
    const folderId = extractDriveFolderId(url);
    if (folderId) {
        currentFolderId = folderId;
        embedDrive(currentFolderId);
        await saveFolderId(currentFolderId);
        showConfetti();
        closeModal();
    } else {
        errorMessage.classList.remove('hidden');
    }
}

function extractDriveFolderId(url) {
    try {
        const folderMatch = url.match(/\/folders\/([a-zA-Z0-9_-]+)/);
        if (folderMatch && folderMatch[1]) return folderMatch[1];
        const parsedUrl = new URL(url);
        const idParam = parsedUrl.searchParams.get('id');
        if (idParam) return idParam;
    } catch (error) {
        console.error("URL Parse Error:", error);
    }
    return null;
}

init();
