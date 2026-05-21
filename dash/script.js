// ==================== CONFIGURACIÓN DE ADMIN (DESDE SHEETS) ====================
// Estos valores son SOLO LECTURA para el usuario
let adminConfig = {
    primaryColor: '#f15b11',
    logoUrl: 'https://bucket.mlcdn.com/a/3336/3336910/images/2b061cc623eb4b1a91c9f71657cf37ec8663ee74.png',
    hoverLogoUrl: '',
    assistantUrl: 'https://asistente.chatterbot.support/chatbot-iframe/b876518dadf641c386b778fd5a6cb927',
    buttons: []
};

// Cargar configuración desde backend (que obtiene de Google Sheets)
async function loadAdminConfig() {
    try {
        const response = await fetch(VAULT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: SERVICE_NAME,
                action: 'get_admin_config',
                sessionToken: sessionToken
            })
        });
        
        const data = await response.json();
        if (data.success) {
            adminConfig = data.config;
            
            // Aplicar configuración de admin (bloqueada para usuario)
            applyAdminConfig();
            return true;
        }
        return false;
    } catch (error) {
        console.warn('Error loading admin config:', error);
        return false;
    }
}

// Aplicar configuración del admin (usuario NO puede modificar)
function applyAdminConfig() {
    // Aplicar color principal
    if (adminConfig.primaryColor) {
        document.documentElement.style.setProperty('--color-highlight', adminConfig.primaryColor);
        const colorPicker = document.getElementById('setting-color');
        if (colorPicker) {
            colorPicker.value = adminConfig.primaryColor;
            colorPicker.disabled = true; // BLOQUEADO
            colorPicker.classList.add('cursor-not-allowed', 'opacity-60');
        }
        const colorDisplay = document.getElementById('color-hex-display');
        if (colorDisplay) colorDisplay.textContent = adminConfig.primaryColor;
    }
    
    // Aplicar logo (SOLO LECTURA)
    if (adminConfig.logoUrl) {
        const sidebarLogo = document.getElementById('main-sidebar-logo');
        sidebarLogo.src = adminConfig.logoUrl;
        sidebarLogo.setAttribute('data-original-src', adminConfig.logoUrl);
        
        const logoInput = document.getElementById('setting-logo');
        if (logoInput) {
            logoInput.value = adminConfig.logoUrl;
            logoInput.disabled = true;
        }
    }
    
    // Aplicar hover logo (SOLO LECTURA)
    if (adminConfig.hoverLogoUrl) {
        const sidebarLogo = document.getElementById('main-sidebar-logo');
        sidebarLogo.setAttribute('data-hover-src', adminConfig.hoverLogoUrl);
        const hoverInput = document.getElementById('setting-hover-logo');
        if (hoverInput) {
            hoverInput.value = adminConfig.hoverLogoUrl;
            hoverInput.disabled = true;
        }
    }
    
    // Actualizar botones del menú
    if (adminConfig.buttons && adminConfig.buttons.length > 0) {
        dynamicNavItems = adminConfig.buttons;
        renderDynamicMenu();
    }
    
    // Actualizar URL del asistente
    if (adminConfig.assistantUrl) {
        currentAssistantUrl = adminConfig.assistantUrl;
        updateAssistantButton();
    }
}

// ==================== SUBIR Y CONVERTIR AVATAR A BASE64 ====================
async function uploadAndConvertAvatar(file) {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.match('image.*')) {
            reject(new Error('Por favor selecciona una imagen válida'));
            return;
        }
        
        // Limitar tamaño a 2MB
        if (file.size > 2 * 1024 * 1024) {
            reject(new Error('La imagen no debe superar los 2MB'));
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const base64String = e.target.result;
            resolve(base64String);
        };
        reader.onerror = function() {
            reject(new Error('Error al leer la imagen'));
        };
        reader.readAsDataURL(file);
    });
}

// Actualizar avatar en UI y storage
async function updateAvatar(avatarData) {
    const avatarText = document.getElementById('sidebar-avatar-text');
    const avatarImg = document.getElementById('sidebar-avatar-img');
    
    if (avatarData && avatarData.startsWith('data:image')) {
        // Es Base64
        avatarImg.src = avatarData;
        avatarImg.classList.remove('hidden');
        avatarText.classList.add('hidden');
        
        // Guardar en usuario actual
        if (currentUser) {
            currentUser.avatarUrl = avatarData;
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            await backgroundSaveUser(currentUser);
        }
        
        // Actualizar campo URL en settings
        const avatarUrlInput = document.getElementById('setting-avatar');
        if (avatarUrlInput) avatarUrlInput.value = avatarData;
        
        showToast('✅ Foto de perfil actualizada correctamente');
    } else if (avatarData && avatarData.trim() !== '') {
        // Es URL externa
        avatarImg.src = avatarData;
        avatarImg.classList.remove('hidden');
        avatarText.classList.add('hidden');
        
        if (currentUser) {
            currentUser.avatarUrl = avatarData;
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            await backgroundSaveUser(currentUser);
        }
        
        const avatarUrlInput = document.getElementById('setting-avatar');
        if (avatarUrlInput) avatarUrlInput.value = avatarData;
        
        showToast('✅ Foto de perfil actualizada correctamente');
    } else {
        // Reset a iniciales
        const initials = currentUser?.username?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'US';
        avatarText.textContent = initials;
        avatarImg.classList.add('hidden');
        avatarText.classList.remove('hidden');
        
        if (currentUser) {
            currentUser.avatarUrl = '';
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            await backgroundSaveUser(currentUser);
        }
        
        const avatarUrlInput = document.getElementById('setting-avatar');
        if (avatarUrlInput) avatarUrlInput.value = '';
    }
    
    // Recargar lucide icons
    if (typeof lucide !== 'undefined') lucide.createIcons();
}

// ==================== AGREGAR EVENT LISTENER PARA UPLOAD ====================
function setupAvatarUpload() {
    const uploadBtn = document.getElementById('upload-avatar-btn');
    const fileInput = document.getElementById('avatar-file-input');
    
    if (uploadBtn && fileInput) {
        uploadBtn.addEventListener('click', () => {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            // Mostrar loading
            uploadBtn.classList.add('upload-loading');
            uploadBtn.disabled = true;
            
            try {
                const base64Image = await uploadAndConvertAvatar(file);
                await updateAvatar(base64Image);
                fileInput.value = ''; // Limpiar input
            } catch (error) {
                showToast(error.message, 'error');
            } finally {
                uploadBtn.classList.remove('upload-loading');
                uploadBtn.disabled = false;
            }
        });
    }
}
