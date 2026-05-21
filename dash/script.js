// ==================== CONFIGURATION ====================
const VAULT_URL = 'https://admin-headquarters.onrender.com/api/proxy';
const SERVICE_NAME = 'admin-headquarters-portal';
const SESSION_KEY = 'ahq_session_token';
const USER_KEY = 'ahq_user_data';

// NOTA: Las URLs de Google Sheets ahora están en el backend (Render.com)
// El frontend solo se comunica con tu VAULT_URL que actúa como proxy seguro

let currentUser = null;
let sessionToken = null;
let dynamicNavItems = [];
let currentAssistantUrl = 'https://asistente.chatterbot.support/chatbot-iframe/b876518dadf641c386b778fd5a6cb927';

// ==================== CONFIGURACIÓN DE ADMIN (DESDE SHEETS) ====================
// Estos valores son SOLO LECTURA para el usuario
let adminConfig = {
    primaryColor: '#f15b11',
    logoUrl: 'https://bucket.mlcdn.com/a/3336/3336910/images/2b061cc623eb4b1a91c9f71657cf37ec8663ee74.png',
    hoverLogoUrl: '',
    assistantUrl: 'https://asistente.chatterbot.support/chatbot-iframe/b876518dadf641c386b778fd5a6cb927',
    buttons: []
};

// ==================== FUNCIÓN MEJORADA: OBTENER MENÚ DESDE BACKEND ====================
async function fetchDynamicMenuItems() {
    try {
        // El backend en Render.com se encarga de llamar a Google Sheets de forma segura
        const response = await fetch(`${VAULT_URL}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: SERVICE_NAME,
                action: 'get_menu_config',
                sessionToken: sessionToken || null
            })
        });
        
        const data = await response.json();
        
        if (data && data.success && data.buttons && Array.isArray(data.buttons)) {
            dynamicNavItems = data.buttons.filter(btn => btn.name && btn.name.trim() !== '');
            if (data.assistantUrl && data.assistantUrl.trim() !== '') {
                currentAssistantUrl = data.assistantUrl;
                updateAssistantButton();
            }
            return true;
        }
        return false;
    } catch (error) {
        console.warn('Error fetching menu from backend:', error);
        // Fallback elegante
        dynamicNavItems = [
            { name: 'Resumen', url: '' },
            { name: 'Auditar tu Marca', url: 'https://propuesta.elnegocio.digital/brand-auditor/' }
        ];
        return true;
    }
}

// ==================== FUNCIÓN REAL DE ENVÍO DE OTP (CORREGIDA) ====================
async function requestOTP(e) {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value.trim();
    const submitBtn = document.getElementById('login-submit-btn');
    
    if (!email) {
        showLoginStatus('Por favor ingresa tu email.', 'error');
        return;
    }
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';
    showLoginStatus('Enviando código de acceso...', 'info');
    
    try {
        // AHORA SÍ: Llamada real al backend que envía el email
        const response = await fetch(VAULT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: SERVICE_NAME,
                action: 'request_otp',
                email: email
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showLoginStatus('✅ Código enviado a tu email. Revisa tu bandeja (incluye spam).', 'success');
            document.getElementById('otp-section').classList.remove('hidden');
            document.getElementById('otp-email-display').textContent = email;
        } else {
            showLoginStatus('❌ ' + (data.message || 'Email no autorizado o error al enviar.'), 'error');
        }
    } catch (error) {
        console.error("Error sending OTP:", error);
        showLoginStatus('❌ Error de conexión. Intenta nuevamente.', 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Enviar Código de Acceso';
    }
}

// ==================== VERIFICACIÓN DE OTP ====================
async function verifyOTP(e) {
    e.preventDefault();
    
    const email = document.getElementById('otp-email-display').textContent;
    const otp = document.getElementById('login-otp').value.trim();
    const verifyBtn = document.getElementById('otp-submit-btn');
    
    if (!otp || otp.length !== 6) {
        showLoginStatus('Por favor ingresa el código de 6 dígitos.', 'error');
        return;
    }
    
    verifyBtn.disabled = true;
    verifyBtn.textContent = 'Verificando...';
    showLoginStatus('Verificando código...', 'info');
    
    try {
        const response = await fetch(VAULT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: SERVICE_NAME,
                action: 'verify_otp',
                email: email,
                otp: otp
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionToken = data.sessionToken;
            currentUser = data.user;
            
            if (!currentUser.licenseId) {
                currentUser.licenseId = generateLicenseId();
                backgroundSaveUser(currentUser);
            }
            
            sessionStorage.setItem(SESSION_KEY, sessionToken);
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            
            applyUserSettings(currentUser);
            showApp();
        } else {
            showLoginStatus('❌ ' + (data.message || 'Código inválido o expirado.'), 'error');
        }
    } catch (error) {
        console.error("Verification error:", error);
        showLoginStatus('❌ Error de verificación. Intenta nuevamente.', 'error');
    } finally {
        verifyBtn.disabled = false;
        verifyBtn.textContent = 'Verificar Código';
    }
}

// ==================== FUNCIÓN PARA GUARDAR CONFIGURACIÓN DE MENÚ (SOLO ADMIN) ====================
async function saveMenuConfiguration(buttons, assistantUrl) {
    if (!sessionToken || !currentUser) {
        showToast('Debes iniciar sesión como administrador.', 'error');
        return false;
    }
    
    try {
        const response = await fetch(VAULT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: SERVICE_NAME,
                action: 'save_menu_config',
                sessionToken: sessionToken,
                email: currentUser.email,
                buttons: buttons,
                assistantUrl: assistantUrl
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('✅ Configuración de menú guardada correctamente.');
            await fetchDynamicMenuItems(); // Recargar menú
            renderDynamicMenu(); // Re-renderizar
            return true;
        } else {
            showToast('❌ Error: ' + (data.message || 'No se pudo guardar.'), 'error');
            return false;
        }
    } catch (error) {
        console.error("Error saving menu config:", error);
        showToast('❌ Error al guardar configuración.', 'error');
        return false;
    }
}

// ==================== RENDERIZAR MENÚ DINÁMICO ====================
function renderDynamicMenu() {
    const navContainer = document.getElementById('nav-container');
    if (!navContainer) return;
    
    // Encontrar las secciones
    const sections = navContainer.querySelectorAll('.px-6.mb-2');
    let mainMenuSection = null;
    let supportSection = null;
    
    for (let section of sections) {
        if (section.textContent.includes('Menú Principal')) {
            mainMenuSection = section;
        } else if (section.textContent.includes('Soporte & Contacto')) {
            supportSection = section;
        }
    }
    
    if (!mainMenuSection) return;
    
    // Eliminar botones dinámicos existentes
    const existingDynamicBtns = navContainer.querySelectorAll('.nav-item[data-dynamic="true"]');
    existingDynamicBtns.forEach(btn => btn.remove());
    
    // Insertar nuevos botones
    let insertAfter = mainMenuSection;
    
    dynamicNavItems.forEach((item, index) => {
        const button = document.createElement('button');
        button.className = 'nav-item w-full flex items-center px-6 py-3.5 text-left transition-all duration-200 border-l-4 border-transparent hover:bg-sidebarHover hover:text-white group text-gray-300';
        button.setAttribute('data-dynamic', 'true');
        button.setAttribute('data-url', item.url || '');
        button.setAttribute('data-name', item.name);
        
        const iconName = getIconForMenuItem(item.name, index);
        
        button.innerHTML = `
            <i data-lucide="${iconName}" class="nav-icon w-5 h-5 mr-3 text-gray-400 group-hover:text-white transition-colors"></i>
            <span class="font-medium text-sm">${escapeHtml(item.name)}</span>
        `;
        
        button.addEventListener('click', function(e) {
            handleNavClick(this);
        });
        
        if (insertAfter.nextSibling) {
            navContainer.insertBefore(button, insertAfter.nextSibling);
        } else {
            navContainer.appendChild(button);
        }
        insertAfter = button;
    });
    
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// ==================== HANDLE NAV CLICK CON MEJOR FALLBACK ====================
function handleNavClick(buttonElement) {
    // Actualizar estilos activos
    document.querySelectorAll('.nav-item').forEach(b => {
        b.classList.remove('border-highlight', 'bg-sidebarHover', 'text-white');
        b.classList.add('border-transparent', 'text-gray-300');
        const icon = b.querySelector('.nav-icon');
        if(icon) {
            icon.classList.remove('text-highlightLight');
            icon.classList.add('text-gray-400');
        }
    });
    
    buttonElement.classList.remove('border-transparent', 'text-gray-300');
    buttonElement.classList.add('border-highlight', 'bg-sidebarHover', 'text-white');
    const thisIcon = buttonElement.querySelector('.nav-icon');
    if(thisIcon) { 
        thisIcon.classList.remove('text-gray-400'); 
        thisIcon.classList.add('text-highlightLight');
    }
    
    // Actualizar título
    const titleSpan = buttonElement.querySelector('span');
    const titleText = titleSpan ? titleSpan.textContent : 'Módulo';
    const pageTitle = document.getElementById('page-title');
    if(pageTitle) pageTitle.textContent = titleText;
    
    // Mostrar loader
    const loader = document.getElementById('loader');
    if (loader) loader.classList.remove('hidden');
    
    // Obtener URL
    let url = buttonElement.getAttribute('data-url');
    const mainFrame = document.getElementById('main-frame');
    
    // Verificar si es Cal.com
    const isCal = buttonElement.hasAttribute('data-cal-link');
    if (isCal) {
        if (loader) loader.classList.add('hidden');
        if (window.innerWidth < 768) toggleSidebar();
        return;
    }
    
    // Cargar URL o mostrar fallback visualmente atractivo
    if (url && url.trim() !== "") {
        mainFrame.removeAttribute('srcdoc'); 
        mainFrame.src = url; 
    } else {
        // Fallback elegante que mantiene la app limpia y profesional
        mainFrame.removeAttribute('src');
        mainFrame.srcdoc = `
        <html style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); font-family: system-ui, -apple-system, sans-serif; height: 100%;">
            <body style="display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; margin: 0; color: white; text-align: center; padding: 20px;">
                <div style="background: rgba(255,255,255,0.95); border-radius: 32px; padding: 48px 32px; max-width: 500px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);">
                    <div style="font-size: 72px; margin-bottom: 24px;">🚀</div>
                    <h2 style="font-size: 2rem; font-weight: 800; margin: 0 0 16px 0; color: #1e293b;">Próximamente</h2>
                    <p style="font-size: 1.1rem; line-height: 1.6; margin: 0 0 24px 0; color: #475569;">Este módulo está en preparación. Vuelve pronto para descubrir nuevas funcionalidades.</p>
                    <div style="background: #f1f5f9; border-radius: 16px; padding: 16px; display: inline-block;">
                        <span style="color: #64748b;">✨ Contenido en desarrollo ✨</span>
                    </div>
                </div>
            </body>
        </html>`;
        
        setTimeout(() => {
            if (loader) loader.classList.add('hidden');
        }, 400);
    }
    
    // Cerrar sidebar en móvil
    if (window.innerWidth < 768) {
        toggleSidebar();
    }
}

// ==================== FUNCIONES AUXILIARES ====================
function getIconForMenuItem(name, index) {
    const nameLower = name.toLowerCase();
    if (nameLower.includes('resumen') || nameLower.includes('dashboard') || nameLower.includes('inicio')) return 'layout-grid';
    if (nameLower.includes('auditar') || nameLower.includes('marca')) return 'clipboard-check';
    if (nameLower.includes('cuenta') || nameLower.includes('perfil')) return 'user';
    if (nameLower.includes('reporte') || nameLower.includes('analytics')) return 'bar-chart-3';
    if (nameLower.includes('producto') || nameLower.includes('tienda')) return 'shopping-bag';
    if (nameLower.includes('configuración') || nameLower.includes('ajustes')) return 'settings';
    const icons = ['folder', 'file-text', 'globe', 'link', 'compass'];
    return icons[index % icons.length];
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function generateLicenseId() {
    return 'AHQ-' + Math.random().toString(36).substring(2, 8).toUpperCase() + '-' + Date.now().toString(36).substring(3, 8).toUpperCase();
}

async function backgroundSaveUser(user) {
    if (!sessionToken) return;
    try {
        await fetch(VAULT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: SERVICE_NAME,
                action: 'save_settings',
                email: user.email,
                sessionToken: sessionToken,
                username: user.username,
                logoUrl: user.logoUrl,
                primaryColor: user.primaryColor,
                avatarUrl: user.avatarUrl,
                licenseId: user.licenseId,
                hoverLogoUrl: user.hoverLogoUrl,
                customScript: user.customScript
            })
        });
    } catch (e) {
        console.warn("Background save failed.");
    }
}

function updateAssistantButton() {
    const assistantBtn = document.querySelector('.nav-item[data-assistant="true"]');
    if (assistantBtn) {
        assistantBtn.setAttribute('data-url', currentAssistantUrl);
    }
}

function initAuth() {
    sessionToken = sessionStorage.getItem(SESSION_KEY);
    const storedUser = sessionStorage.getItem(USER_KEY);
    
    if (sessionToken && storedUser) {
        currentUser = JSON.parse(storedUser);
        applyUserSettings(currentUser);
        showApp();
    } else {
        showLogin();
    }
}

function showLogin() {
    document.getElementById('app-container').classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('app-loader').classList.add('hidden');
}

async function showApp() {
    document.getElementById('login-container').classList.add('hidden');
    document.getElementById('app-container').classList.remove('hidden');
    document.getElementById('app-loader').classList.add('hidden');
    
    // Cargar configuración del admin PRIMERO
    await loadAdminConfig();
    
    // Luego cargar menú dinámico
    await fetchDynamicMenuItems();
    renderDynamicMenu();
    
    // Configurar upload de avatar
    setupAvatarUpload();
    
    // Hacer campos de admin solo lectura visualmente
    const adminReadonlyFields = ['setting-color', 'setting-logo', 'setting-hover-logo'];
    adminReadonlyFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.disabled = true;
            field.classList.add('cursor-not-allowed', 'opacity-60', 'bg-gray-100');
        }
    });
    
    // Agregar tooltip informativo
    const colorLabel = document.querySelector('label[for="setting-color"]');
    if (colorLabel) {
        colorLabel.innerHTML = 'Color Principal (Marca) <span class="text-[10px] text-gray-400 font-normal">(Configurado por Admin)</span>';
    }
    
    const logoLabel = document.querySelector('label[for="setting-logo"]');
    if (logoLabel) {
        logoLabel.innerHTML = 'URL del Logo <span class="text-[10px] text-gray-400 font-normal">(Configurado por Admin - Solo lectura)</span>';
    }
    
    const hoverLabel = document.querySelector('label[for="setting-hover-logo"]');
    if (hoverLabel) {
        hoverLabel.innerHTML = 'URL del Logo (Hover) <span class="text-[10px] text-gray-400 font-normal">(Configurado por Admin - Solo lectura)</span>';
    }
    
    // Trigger primer item del menú
    const navItems = document.querySelectorAll('.nav-item');
    let firstItem = null;
    for (let item of navItems) {
        const name = item.querySelector('span')?.textContent || '';
        if (name === 'Resumen' || name === 'Inicio') {
            firstItem = item;
            break;
        }
    }
    if (!firstItem && navItems.length > 0) firstItem = navItems[0];
    if (firstItem) firstItem.click();
    
    if (currentUser) triggerWelcomeConfetti(currentUser);
}

function triggerWelcomeConfetti(user) {
    const storageKey = 'ahq_first_login_' + user.email;
    if (!localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, 'true');
        
        const overlay = document.getElementById('welcome-overlay');
        const usernameEl = document.getElementById('welcome-username');
        usernameEl.textContent = user.username || 'Cliente';
        overlay.classList.remove('hidden');
        
        requestAnimationFrame(() => {
            overlay.classList.add('flex', 'opacity-100');
            overlay.classList.remove('opacity-0');
            setTimeout(() => {
                const textContainer = document.getElementById('welcome-text');
                textContainer.classList.remove('scale-50', 'opacity-0');
                textContainer.classList.add('scale-100', 'opacity-100');
            }, 100);
        });
        
        const rootStyles = getComputedStyle(document.documentElement);
        const colorHighlight = rootStyles.getPropertyValue('--color-highlight').trim() || '#f15b11';
        const duration = 5000;
        const animationEnd = Date.now() + duration;
        
        (function frame() {
            confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: [colorHighlight, '#ffffff', '#ffcc00'] });
            confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: [colorHighlight, '#ffffff', '#ffcc00'] });
            if (Date.now() < animationEnd) {
                requestAnimationFrame(frame);
            } else {
                overlay.classList.remove('opacity-100');
                overlay.classList.add('opacity-0');
                setTimeout(() => {
                    overlay.classList.add('hidden');
                    overlay.classList.remove('flex', 'opacity-0');
                    const textContainer = document.getElementById('welcome-text');
                    textContainer.classList.remove('scale-100', 'opacity-100');
                    textContainer.classList.add('scale-50', 'opacity-0');
                }, 1000);
            }
        }());
    }
}

function showLoginStatus(message, type) {
    const statusEl = document.getElementById('login-status');
    statusEl.textContent = message;
    statusEl.className = 'text-sm mt-4 p-3 rounded-lg border backdrop-blur-sm ';
    if(type === 'success') statusEl.className += 'bg-green-900/30 text-green-400 border-green-800/50';
    else if(type === 'error') statusEl.className += 'bg-red-900/30 text-red-400 border-red-800/50';
    else statusEl.className += 'bg-blue-900/30 text-blue-400 border-blue-800/50';
    statusEl.classList.remove('hidden');
}

function applyUserSettings(user) {
    if (!user) return;
    
    // ID y Email (solo lectura)
    const idInput = document.getElementById('setting-id');
    const emailInput = document.getElementById('setting-email');
    if(idInput) idInput.value = user.licenseId || 'ID-No-Disponible';
    if(emailInput) emailInput.value = user.email || 'correo@no-disponible.com';
    
    // Username (editable)
    if (user.username) {
        const sidebarUsername = document.getElementById('sidebar-username');
        if(sidebarUsername) sidebarUsername.textContent = user.username;
        const usernameInput = document.getElementById('setting-username');
        if(usernameInput) usernameInput.value = user.username;
    }
    
    // Avatar (editable)
    const avatarText = document.getElementById('sidebar-avatar-text');
    const avatarImg = document.getElementById('sidebar-avatar-img');
    
    if (user.avatarUrl && user.avatarUrl.trim() !== '') {
        avatarImg.src = user.avatarUrl;
        avatarImg.classList.remove('hidden');
        avatarText.classList.add('hidden');
        const avatarInput = document.getElementById('setting-avatar');
        if(avatarInput) avatarInput.value = user.avatarUrl;
    } else if (user.username) {
        const initials = user.username.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        avatarText.textContent = initials || 'US';
        avatarImg.classList.add('hidden');
        avatarText.classList.remove('hidden');
    }
    
    // Script personalizado (editable)
    if (user.customScript !== undefined) {
        const scriptInput = document.getElementById('setting-script');
        if(scriptInput) scriptInput.value = user.customScript || '';
        const scriptContainer = document.getElementById('custom-script-container');
        if (scriptContainer && user.customScript) {
            scriptContainer.innerHTML = '';
            try {
                const frag = document.createRange().createContextualFragment(user.customScript);
                scriptContainer.appendChild(frag);
            } catch (e) {}
        }
    }
}

function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionToken = null;
    currentUser = null;
    const emailInput = document.getElementById('login-email');
    const otpInput = document.getElementById('login-otp');
    if(emailInput) emailInput.value = '';
    if(otpInput) otpInput.value = '';
    const loginStatus = document.getElementById('login-status');
    if(loginStatus) loginStatus.classList.add('hidden');
    const otpSection = document.getElementById('otp-section');
    if(otpSection) otpSection.classList.add('hidden');
    showLogin();
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('mobile-overlay');
    sidebar.classList.toggle('-translate-x-full');
    if(overlay) overlay.classList.toggle('hidden');
}

async function saveSettings(e) {
    e.preventDefault();
    
    if (!sessionToken || !currentUser) {
        showToast('Sesión expirada. Vuelve a iniciar sesión.', 'error');
        logout();
        return;
    }
    
    // SOLO guardar username y avatar (los campos de admin están bloqueados)
    const newUsername = document.getElementById('setting-username').value;
    const newAvatarUrl = document.getElementById('setting-avatar').value;
    
    // Actualizar UI
    const sidebarUsername = document.getElementById('sidebar-username');
    if(sidebarUsername) sidebarUsername.textContent = newUsername;
    
    // Actualizar avatar
    await updateAvatar(newAvatarUrl);
    
    toggleSettingsModal();
    
    try {
        const response = await fetch(VAULT_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service: SERVICE_NAME,
                action: 'save_settings',
                email: currentUser.email,
                sessionToken: sessionToken,
                username: newUsername,
                avatarUrl: newAvatarUrl,
                licenseId: currentUser.licenseId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser.username = newUsername;
            currentUser.avatarUrl = newAvatarUrl;
            sessionStorage.setItem(USER_KEY, JSON.stringify(currentUser));
            showToast('✅ Configuración guardada correctamente.');
        } else {
            showToast('❌ Error: ' + (data.message || 'No se pudo guardar.'), 'error');
        }
    } catch (error) {
        console.warn("Error saving settings:", error);
        showToast('✅ Configuración actualizada de forma local.');
    }
}

function toggleSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        modal.classList.add('flex', 'modal-enter');
        modal.classList.remove('modal-leave');
    } else {
        modal.classList.add('modal-leave');
        modal.classList.remove('modal-enter');
        setTimeout(() => {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }, 200);
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-container');
    const toastMsg = document.getElementById('toast-message');
    const iconContainer = document.getElementById('toast-icon-container');
    toastMsg.textContent = message;
    if (type === 'error') {
        toast.classList.add('bg-red-600', 'border-red-500');
        toast.classList.remove('bg-gray-900', 'border-gray-700');
        iconContainer.innerHTML = '<i data-lucide="alert-triangle" class="w-5 h-5"></i>';
    } else {
        toast.classList.remove('bg-red-600', 'border-red-500');
        toast.classList.add('bg-gray-900', 'border-gray-700');
        iconContainer.innerHTML = '<i data-lucide="check" class="w-5 h-5"></i>';
    }
    if (typeof lucide !== 'undefined') lucide.createIcons();
    toast.classList.remove('hidden', 'toast-leave');
    toast.classList.add('toast-enter');
    setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-leave');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3500);
}

// ==================== Cargar configuración desde backend (que obtiene de Google Sheets) ====================
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

// ==================== Aplicar configuración del admin (usuario NO puede modificar) ====================
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

// ==================== Actualizar avatar en UI y storage ====================
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

// ==================== EVENT LISTENERS ====================
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) loginForm.addEventListener('submit', requestOTP);
    
    const otpForm = document.getElementById('otp-verify-form');
    if (otpForm) otpForm.addEventListener('submit', verifyOTP);
    
    const settingsBtn = document.getElementById('sidebar-settings-btn');
    if (settingsBtn) settingsBtn.addEventListener('click', toggleSettingsModal);
    
    const closeSettingsBtn = document.getElementById('close-settings-modal');
    if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', toggleSettingsModal);
    
    const cancelSettingsBtn = document.getElementById('cancel-settings-btn');
    if (cancelSettingsBtn) cancelSettingsBtn.addEventListener('click', toggleSettingsModal);
    
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) settingsForm.addEventListener('submit', saveSettings);
    
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', logout);
    
    const mobileTrigger = document.getElementById('mobile-menu-trigger');
    if (mobileTrigger) mobileTrigger.addEventListener('click', toggleSidebar);
    
    const mobileOverlay = document.getElementById('mobile-overlay');
    if (mobileOverlay) mobileOverlay.addEventListener('click', toggleSidebar);
    
    const colorPicker = document.getElementById('setting-color');
    if (colorPicker) {
        colorPicker.addEventListener('input', (e) => {
            const display = document.getElementById('color-hex-display');
            if (display) display.textContent = e.target.value;
        });
    }
    
    const mainFrame = document.getElementById('main-frame');
    const loader = document.getElementById('loader');
    if (mainFrame) {
        mainFrame.addEventListener('load', () => {
            if (loader) loader.classList.add('hidden');
        });
    }
    
    const existingNavItems = document.querySelectorAll('.nav-item:not([data-dynamic])');
    existingNavItems.forEach(btn => {
        if (btn.querySelector('span')?.textContent === 'Asistente de Chat') {
            btn.setAttribute('data-assistant', 'true');
        }
        btn.addEventListener('click', function() {
            const isCal = this.hasAttribute('data-cal-link');
            if (isCal) {
                if (window.innerWidth < 768) toggleSidebar();
                return;
            }
            handleNavClick(this);
        });
    });
    
    initAuth();
});
