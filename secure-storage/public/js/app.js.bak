// Estado de la aplicación
let currentUser = null;
let authToken = localStorage.getItem('authToken');

// Elementos del DOM
const authSection = document.getElementById('authSection');
const filesSection = document.getElementById('filesSection');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const loginBtn = document.getElementById('loginBtn');
const registerBtn = document.getElementById('registerBtn');
const showRegister = document.getElementById('showRegister');
const showLogin = document.getElementById('showLogin');
const logoutBtn = document.getElementById('logoutBtn');
const userMenu = document.getElementById('userMenu');
const userDropdown = document.getElementById('userDropdown');
const uploadFileBtn = document.getElementById('uploadFileBtn');
const uploadModal = document.getElementById('uploadModal');
const cancelUpload = document.getElementById('cancelUpload');
const uploadForm = document.getElementById('uploadForm');
const submitUpload = document.getElementById('submitUpload');
const filesList = document.getElementById('filesList');

// URLs de la API
const API_BASE_URL = '/api';
const API_URLS = {
    login: `${API_BASE_URL}/login`,
    register: `${API_BASE_URL}/register`,
    logout: `${API_BASE_URL}/logout`,
    user: `${API_BASE_URL}/user`,
    files: `${API_BASE_URL}/files`,
    groups: `${API_BASE_URL}/groups`,
};

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    // Verificar si hay un token de autenticación
    if (authToken) {
        fetchCurrentUser();
    } else {
        showAuthSection('login');
    }

    // Event listeners
    loginBtn.addEventListener('click', () => showAuthSection('login'));
    registerBtn.addEventListener('click', () => showAuthSection('register'));
    showRegister.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthSection('register');
    });
    showLogin.addEventListener('click', (e) => {
        e.preventDefault();
        showAuthSection('login');
    });
    logoutBtn.addEventListener('click', handleLogout);
    uploadFileBtn?.addEventListener('click', () => {
        uploadModal.classList.remove('hidden');
        loadGroups();
    });
    cancelUpload?.addEventListener('click', () => {
        uploadModal.classList.add('hidden');
        uploadForm.reset();
    });
    submitUpload?.addEventListener('click', handleFileUpload);
});

// Funciones de autenticación
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch(API_URLS.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                email,
                password,
                remember: true
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Guardar el token y el usuario
            authToken = data.token || data.access_token;
            localStorage.setItem('authToken', authToken);
            
            // Obtener y guardar los datos del usuario
            await fetchCurrentUser();
        } else {
            showError(data.message || 'Error al iniciar sesión');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const passwordConfirmation = document.getElementById('regPasswordConfirmation').value;

    if (password !== passwordConfirmation) {
        showError('Las contraseñas no coinciden');
        return;
    }

    try {
        const response = await fetch(API_URLS.register, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                name,
                email,
                password,
                password_confirmation: passwordConfirmation
            }),
        });

        const data = await response.json();

        if (response.ok) {
            // Iniciar sesión automáticamente después del registro
            authToken = data.token || data.access_token;
            localStorage.setItem('authToken', authToken);
            await fetchCurrentUser();
        } else {
            const errorMessage = data.message || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Error al registrarse');
            showError(errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión');
    }
}

async function handleLogout() {
    try {
        await fetch(API_URLS.logout, {
            method: 'POST',
            headers: getAuthHeaders(),
        });
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
    } finally {
        // Limpiar el estado de autenticación
        authToken = null;
        currentUser = null;
        localStorage.removeItem('authToken');
        
        // Mostrar el formulario de inicio de sesión
        showAuthSection('login');
        
        // Limpiar la interfaz
        filesSection.classList.add('hidden');
        userMenu.querySelector('.flex').classList.remove('hidden');
        userDropdown.classList.add('hidden');
    }
}

// Funciones de archivos
async function loadFiles() {
    try {
        const response = await fetch(API_URLS.files, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Error al cargar los archivos');
        }

        const files = await response.json();
        renderFiles(files.data || files);
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los archivos');
    }
}

async function loadGroups() {
    try {
        const response = await fetch(API_URLS.groups, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('Error al cargar los grupos');
        }

        const groups = await response.json();
        const select = document.getElementById('fileGroup');
        select.innerHTML = '';
        
        groups.data?.forEach(group => {
            const option = document.createElement('option');
            option.value = group.id;
            option.textContent = group.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los grupos');
    }
}

async function handleFileUpload() {
    const fileInput = document.getElementById('file');
    const groupId = document.getElementById('fileGroup').value;
    const description = document.getElementById('fileDescription').value;

    if (!fileInput.files.length) {
        showError('Por favor selecciona un archivo');
        return;
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    formData.append('group_id', groupId);
    if (description) {
        formData.append('description', description);
    }

    try {
        const response = await fetch(API_URLS.files, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (response.ok) {
            // Recargar la lista de archivos
            await loadFiles();
            // Cerrar el modal y limpiar el formulario
            uploadModal.classList.add('hidden');
            uploadForm.reset();
            showSuccess('Archivo subido correctamente');
        } else {
            throw new Error(data.message || 'Error al subir el archivo');
        }
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Error al subir el archivo');
    }
}

// Funciones auxiliares
async function fetchCurrentUser() {
    try {
        const response = await fetch(API_URLS.user, {
            headers: getAuthHeaders(),
        });

        if (!response.ok) {
            throw new Error('No se pudo cargar la información del usuario');
        }

        currentUser = await response.json();
        updateUIForUser(currentUser);
    } catch (error) {
        console.error('Error:', error);
        // Si hay un error de autenticación, redirigir al login
        showAuthSection('login');
    }
}

function updateUIForUser(user) {
    // Mostrar la sección de archivos
    authSection.classList.add('hidden');
    filesSection.classList.remove('hidden');
    
    // Actualizar la barra de navegación
    const userGreeting = userMenu.querySelector('.user-greeting');
    if (userGreeting) {
        userGreeting.textContent = `Hola, ${user.name}`;
    } else {
        const greeting = document.createElement('span');
        greeting.className = 'user-greeting mr-4 text-gray-700';
        greeting.textContent = `Hola, ${user.name}`;
        userMenu.querySelector('.flex').prepend(greeting);
    }
    
    // Mostrar el menú de usuario
    userMenu.querySelector('.flex').classList.add('hidden');
    userDropdown.classList.remove('hidden');
    
    // Cargar los archivos del usuario
    loadFiles();
}

function showAuthSection(section) {
    authSection.classList.remove('hidden');
    filesSection.classList.add('hidden');
    
    if (section === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
    }
}

function renderFiles(files) {
    if (!files.length) {
        filesList.innerHTML = '<li class="px-6 py-4 text-center text-gray-500">No hay archivos para mostrar</li>';
        return;
    }

    filesList.innerHTML = files.map(file => `
        <li class="px-6 py-4 flex items-center justify-between border-b border-gray-200">
            <div class="flex items-center">
                <i class="fas fa-file-alt text-gray-400 text-2xl mr-4"></i>
                <div>
                    <p class="text-sm font-medium text-gray-900">${file.original_name}</p>
                    <p class="text-sm text-gray-500">${formatFileSize(file.size)} • ${new Date(file.created_at).toLocaleDateString()}</p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                ${file.is_approved ? '' : '<span class="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Pendiente</span>'}
                <a href="${API_URLS.files}/${file.id}/download" class="text-blue-600 hover:text-blue-800" download>
                    <i class="fas fa-download"></i>
                </a>
                <button class="text-red-600 hover:text-red-800" onclick="deleteFile(${file.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </li>
    `).join('');
}

async function deleteFile(fileId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este archivo?')) {
        return;
    }

    try {
        const response = await fetch(`${API_URLS.files}/${fileId}`, {
            method: 'DELETE',
            headers: getAuthHeaders(),
        });

        if (response.ok) {
            await loadFiles();
            showSuccess('Archivo eliminado correctamente');
        } else {
            throw new Error('Error al eliminar el archivo');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el archivo');
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function showError(message) {
    // Implementar notificación de error
    alert(`Error: ${message}`);
}

function showSuccess(message) {
    // Implementar notificación de éxito
    alert(`Éxito: ${message}`);
}

function getAuthHeaders() {
    return {
        'Authorization': `Bearer ${authToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
    };
}

// Hacer las funciones disponibles globalmente
window.deleteFile = deleteFile;
