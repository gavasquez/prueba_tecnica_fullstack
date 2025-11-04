import { auth } from '../../services/api';

// Simple alert function
function showAlert(message, type = 'danger') {
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show mt-3`;
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  const container = document.querySelector('#app');
  if (container) {
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      alertDiv.remove();
    }, 5000);
  }
}

export function renderLogin() {
  const app = document.querySelector('#app');
  
  app.innerHTML = `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-body">
              <h2 class="card-title text-center mb-4">Iniciar Sesión</h2>
              
              <form id="loginForm">
                <div class="mb-3">
                  <label for="email" class="form-label">Correo Electrónico</label>
                  <input
                    type="email"
                    class="form-control"
                    id="email"
                    required
                    placeholder="admin@example.com"
                  >
                </div>
                
                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <input
                    type="password"
                    class="form-control"
                    id="password"
                    required
                    placeholder="password"
                  >
                </div>
                
                <button type="submit" class="btn btn-primary w-100">
                  Iniciar Sesión
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add form submit handler
  document.getElementById('loginForm').addEventListener('submit', handleLogin);
  document.getElementById('showRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    import('./Register').then(module => {
      const { renderRegister } = module;
      renderRegister();
    });
  });
}

async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const loginButton = e.target.querySelector('button[type="submit"]');
  const originalButtonText = loginButton.innerHTML;
  
  // Clear previous alerts
  document.querySelectorAll('.alert').forEach(alert => alert.remove());
  
  // Simple validation
  if (!email || !password) {
    showAlert('Por favor completa todos los campos', 'warning');
    return;
  }
  
  try {
    // Show loading state
    loginButton.disabled = true;
    loginButton.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Iniciando...';
    
    // Usar el servicio auth.login en lugar de fetch directo
    const response = await auth.login({ email, password });
    
    // El servicio auth.login ya guarda el token y calcula is_admin
    // Ahora obtener el usuario completo para guardarlo en localStorage
    const userData = await auth.getCurrentUser();
    
    if (!userData) {
      throw new Error('No se pudo obtener la información del usuario');
    }
    
    // Guardar el usuario en localStorage con is_admin calculado
    localStorage.setItem('user', JSON.stringify(userData));
    
    // Redirigir al dashboard usando el router sin recargar la página
    // Importar las funciones del router desde main.js
    const { refreshUser, navigate } = await import('../../main');
    await refreshUser();
    
    // Navegar al dashboard usando el router
    navigate('/dashboard');
    
  } catch (error) {
    console.error('Login error:', error);
    
    // Show error message to user
    showAlert(error.message || 'Error al iniciar sesión. Verifica tus credenciales.');
    
    // Restore button
    if (loginButton) {
      loginButton.disabled = false;
      loginButton.innerHTML = originalButtonText;
    }
  }
}
