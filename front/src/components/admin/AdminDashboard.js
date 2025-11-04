import { fetchAPI } from '../../services/api';
import { showError, showSuccess } from '../../utils/helpers';

let isInitialized = false;

export async function renderAdminDashboard() {
  const app = document.querySelector('#app');
  
  // Evitar múltiples inicializaciones
  if (isInitialized) {
    console.log('AdminDashboard ya está inicializado');
    return;
  }
  
  isInitialized = true;
  
  try {
    // Mostrar estado de carga
    app.innerHTML = `
      <div class="d-flex justify-content-center align-items-center" style="height: 100vh;">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Cargando panel de administración...</span>
        </div>
      </div>
    `;
    
    // Cargar datos del usuario actual usando el servicio auth
    const { auth } = await import('../../services/api');
    const currentUser = await auth.getCurrentUser();
    
    if (!currentUser || !currentUser.is_admin) {
      console.log('Usuario no es administrador, redirigiendo...');
      const { navigate } = await import('../../main');
      navigate('/dashboard');
      return;
    }

    console.log('Cargando datos de administración...');
    
    // Cargar usuarios y grupos
    const [users, groups] = await Promise.all([
      fetchAPI('users').catch(err => {
        console.error('Error cargando usuarios:', err);
        return [];
      }),
      fetchAPI('groups').catch(err => {
        console.error('Error cargando grupos:', err);
        return [];
      })
    ]);

    // Renderizar el panel de administración
    app.innerHTML = `
      <div class="container-fluid mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>Panel de Administración</h1>
          <div>
            <button id="dashboardBtn" class="btn btn-outline-primary me-2">
              <i class="bi bi-folder"></i> Mis Archivos
            </button>
            <button id="logoutBtn" class="btn btn-outline-danger">
              <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </button>
          </div>
        </div>

        <ul class="nav nav-tabs mb-4" id="adminTabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" id="users-tab" data-bs-toggle="tab" data-bs-target="#users" type="button" role="tab">
              Usuarios
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="groups-tab" data-bs-toggle="tab" data-bs-target="#groups" type="button" role="tab">
              Grupos
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" id="settings-tab" data-bs-toggle="tab" data-bs-target="#settings" type="button" role="tab">
              Configuración
            </button>
          </li>
        </ul>

        <div class="tab-content" id="adminTabsContent">
          <!-- Pestaña de Usuarios -->
          <div class="tab-pane fade show active" id="users" role="tabpanel">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Gestión de Usuarios</h5>
                <button class="btn btn-primary btn-sm" id="addUserBtn">
                  <i class="bi bi-plus-lg"></i> Nuevo Usuario
                </button>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Grupos</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="usersList">
                      ${users.map(user => `
                        <tr>
                          <td>${user.id}</td>
                          <td>${user.name}</td>
                          <td>${user.email}</td>
                          <td>${user.is_admin ? 'Administrador' : 'Usuario'}</td>
                          <td>${user.groups?.map(g => g.name).join(', ') || 'Ninguno'}</td>
                          <td>
                            <button class="btn btn-sm btn-outline-primary edit-user" data-user-id="${user.id}">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-user" data-user-id="${user.id}">
                              <i class="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Pestaña de Grupos -->
          <div class="tab-pane fade" id="groups" role="tabpanel">
            <div class="card">
              <div class="card-header d-flex justify-content-between align-items-center">
                <h5 class="mb-0">Gestión de Grupos</h5>
                <button class="btn btn-primary btn-sm" id="addGroupBtn">
                  <i class="bi bi-plus-lg"></i> Nuevo Grupo
                </button>
              </div>
              <div class="card-body">
                <div class="table-responsive">
                  <table class="table table-hover">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Descripción</th>
                        <th>Límite de Almacenamiento</th>
                        <th>Usuarios</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody id="groupsList">
                      ${groups.map(group => {
                        // Calcular el límite de almacenamiento en MB de forma segura
                        const storageLimitMB = group.storage_limit 
                          ? (group.storage_limit / (1024 * 1024)).toFixed(2) 
                          : '0.00';
                        // Obtener el conteo de usuarios de forma segura
                        const usersCount = group.users_count !== undefined && group.users_count !== null 
                          ? group.users_count 
                          : 0;
                        
                        return `
                        <tr>
                          <td>${group.id}</td>
                          <td>${group.name}</td>
                          <td>${group.description || '-'}</td>
                          <td>${storageLimitMB} MB</td>
                          <td>${usersCount} usuario${usersCount !== 1 ? 's' : ''}</td>
                          <td>
                            <button class="btn btn-sm btn-outline-primary edit-group" data-group-id="${group.id}">
                              <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger delete-group" data-group-id="${group.id}">
                              <i class="bi bi-trash"></i>
                            </button>
                          </td>
                        </tr>
                      `;
                      }).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          <!-- Pestaña de Configuración -->
          <div class="tab-pane fade" id="settings" role="tabpanel">
            <div class="card">
              <div class="card-header">
                <h5 class="mb-0">Configuración del Sistema</h5>
              </div>
              <div class="card-body">
                <form id="settingsForm">
                  <div class="mb-3">
                    <label for="defaultStorageLimit" class="form-label">Límite de almacenamiento por defecto (MB)</label>
                    <input type="number" class="form-control" id="defaultStorageLimit" value="10" min="1">
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label">Extensiones de archivo permitidas</label>
                    <div class="form-text mb-2">Separadas por comas (ej: jpg,png,pdf,docx)</div>
                    <textarea class="form-control" id="allowedExtensions" rows="3">jpg,jpeg,png,gif,pdf,doc,docx,xls,xlsx,ppt,pptx,txt,zip,rar</textarea>
                  </div>
                  
                  <button type="submit" class="btn btn-primary">Guardar Configuración</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar manejadores de eventos
    document.getElementById('dashboardBtn').addEventListener('click', () => {
      window.location.href = '/dashboard';
    });

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Inicializar los tabs de Bootstrap
    const tabElms = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElms.forEach(tabEl => {
      new bootstrap.Tab(tabEl);
    });

  } catch (error) {
    console.error('Error en el panel de administración:', error);
    showError('Error al cargar el panel de administración');
  }
}

async function handleLogout() {
  try {
    const { auth } = await import('../../services/api');
    await auth.logout();
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    
    // Usar el router para navegar al login sin recargar la página
    const { navigate } = await import('../../main');
    navigate('/');
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    showError('Error al cerrar sesión');
    // Aún así, limpiar el estado y redirigir
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    const { navigate } = await import('../../main');
    navigate('/');
  }
}
