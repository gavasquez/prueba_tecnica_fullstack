// Importar estilos
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import './assets/styles/main.css';

// Importar componentes
import { renderLogin } from './components/auth/Login';
import { renderDashboard } from './components/dashboard/Dashboard';
import { renderAdminDashboard } from './components/admin/AdminDashboard';
import { auth } from './services/api';

// Estado de la aplicación
let isInitialized = false;
let currentUser = null;

/**
 * Muestra un spinner de carga
 */
function showLoading() {
  const app = document.querySelector('#app');
  if (app) {
    app.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
        <div class="text-center">
          <div class="spinner-border text-primary mb-3" role="status">
            <span class="visually-hidden">Cargando...</span>
          </div>
          <p>Cargando aplicación...</p>
        </div>
      </div>
    `;
  }
}

/**
 * Obtiene el usuario actual desde la API
 */
async function getCurrentUser() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) {
      return null;
    }
    
    const user = await auth.getCurrentUser();
    
    // Guardar el usuario en localStorage para acceso rápido
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    }
    
    return user;
  } catch (error) {
    console.error('Error al obtener el usuario:', error);
    // Si hay un error de autenticación, limpiar el token
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * Router asíncrono principal
 */
async function router() {
  const path = window.location.pathname;
  const app = document.querySelector('#app');
  
  if (!app) {
    console.error('No se encontró el elemento #app');
    return;
  }
  
  // Mostrar loading mientras se verifica la autenticación
  showLoading();
  
  // Obtener el usuario actual
  currentUser = await getCurrentUser();
  
  // Rutas públicas
  if (path === '/' || path === '/login') {
    // Si el usuario está autenticado, redirigir al dashboard
    if (currentUser) {
      window.history.replaceState({}, '', '/dashboard');
      await router();
      return;
    }
    // Si no está autenticado, mostrar login
    renderLogin();
    return;
  }
  
  // Rutas protegidas - verificar autenticación
  if (!currentUser) {
    // No está autenticado, redirigir al login
    window.history.replaceState({}, '', '/');
    renderLogin();
    return;
  }
  
  // Ruta del dashboard - decidir según el rol del usuario
  if (path === '/dashboard' || path === '/admin') {
    // Verificar si el usuario es administrador
    if (currentUser.is_admin) {
      await renderAdminDashboard();
    } else {
      await renderDashboard();
    }
    return;
  }
  
  // Página 404
  app.innerHTML = `
    <div class="container mt-5">
      <div class="alert alert-danger">
        <h4>404 - Página no encontrada</h4>
        <p>La página que buscas no existe.</p>
        <a href="/dashboard" class="btn btn-primary">Volver al inicio</a>
      </div>
    </div>
  `;
}

/**
 * Función de inicialización
 */
function init() {
  // Evitar múltiples inicializaciones
  if (isInitialized) {
    return;
  }
  
  isInitialized = true;
  
  // Manejar navegación del navegador (atrás/adelante)
  window.addEventListener('popstate', () => {
    router();
  });
  
  // Interceptar clics en enlaces para navegación SPA
  document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (link && link.href.startsWith(window.location.origin)) {
      e.preventDefault();
      const href = link.getAttribute('href');
      window.history.pushState({}, '', href);
      router();
    }
  });
  
  // Inicializar tooltips de Bootstrap cuando se carga el DOM
  document.addEventListener('DOMContentLoaded', () => {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  });
  
  // Evitar el envío de formularios por defecto (se manejan individualmente)
  document.addEventListener('submit', (e) => {
    // Solo prevenir si no tiene data-no-prevent
    if (e.target.matches('form') && !e.target.hasAttribute('data-no-prevent')) {
      e.preventDefault();
    }
  });
  
  // Ejecutar el router inicial
  router();
}

// Exportar función para refrescar el usuario (útil después del login)
export async function refreshUser() {
  currentUser = await getCurrentUser();
  return currentUser;
}

// Exportar función para obtener el usuario actual (sin hacer petición)
export function getUser() {
  return currentUser;
}

// Exportar función del router para poder ejecutarla desde otros módulos
export function navigate(path) {
  window.history.pushState({}, '', path);
  router();
}

// Inicializar la aplicación cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}