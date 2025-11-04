import { auth } from '../../services/api';
import { showError } from '../../utils/helpers';

export function renderRegister() {
  const app = document.querySelector('#app');
  
  app.innerHTML = `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-6 col-lg-4">
          <div class="card shadow">
            <div class="card-body">
              <h2 class="card-title text-center mb-4">Registro</h2>
              <form id="registerForm">
                <div class="mb-3">
                  <label for="name" class="form-label">Nombre completo</label>
                  <input type="text" class="form-control" id="name" required>
                </div>
                <div class="mb-3">
                  <label for="email" class="form-label">Correo electrónico</label>
                  <input type="email" class="form-control" id="email" required>
                </div>
                <div class="mb-3">
                  <label for="password" class="form-label">Contraseña</label>
                  <input type="password" class="form-control" id="password" required>
                </div>
                <div class="mb-3">
                  <label for="password_confirmation" class="form-label">Confirmar contraseña</label>
                  <input type="password" class="form-control" id="password_confirmation" required>
                </div>
                <div class="d-grid gap-2">
                  <button type="submit" class="btn btn-primary">Registrarse</button>
                </div>
              </form>
              <div class="text-center mt-3">
                <p class="mb-0">¿Ya tienes una cuenta? <a href="#" id="showLogin">Inicia sesión</a></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Agregar event listeners
  document.getElementById('registerForm').addEventListener('submit', handleRegister);
  document.getElementById('showLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    import('./Login').then(module => {
      const { renderLogin } = module;
      renderLogin();
    });
  });
}

async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('name').value;
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const passwordConfirmation = document.getElementById('password_confirmation').value;
  
  if (password !== passwordConfirmation) {
    showError('Las contraseñas no coinciden');
    return;
  }
  
  try {
    const response = await auth.register({ 
      name, 
      email, 
      password, 
      password_confirmation: passwordConfirmation 
    });
    
    if (response.token) {
      localStorage.setItem('authToken', response.token);
      // Redirigir al dashboard
      import('../dashboard/Dashboard').then(module => {
        const { renderDashboard } = module;
        renderDashboard();
      });
    }
  } catch (error) {
    console.error('Error en registro:', error);
    showError(error.message || 'Error al registrarse');
  }
}
