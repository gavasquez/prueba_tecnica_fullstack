import { fetchAPI } from '../../services/api';
import { showError, showSuccess } from '../../utils/helpers';

let isInitialized = false;

export async function renderAdminDashboard() {
  const app = document.querySelector('#app');
  
  // Evitar inicialización duplicada del panel
  if (isInitialized) {
    console.log('AdminDashboard ya está inicializado');
    return;
  }
  
  isInitialized = true;
  
  try {
    // Pantalla de carga mientras llega la información
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
                            <button class="btn btn-sm btn-outline-secondary assign-groups" data-user-id="${user.id}">
                              <i class="bi bi-people"></i>
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
                    <label for="maxFileSize" class="form-label">Tamaño máximo por archivo (MB)</label>
                    <input type="number" class="form-control" id="maxFileSize" value="5" min="1">
                  </div>

                  <div class="mb-3">
                    <label class="form-label">Extensiones prohibidas</label>
                    <div class="form-text mb-2">Separadas por comas (ej: exe,bat,js,php,sh)</div>
                    <textarea class="form-control" id="bannedExtensions" rows="3"></textarea>
                  </div>

                  <button type="submit" class="btn btn-primary">Guardar Configuración</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Modales de Administración -->
      <!-- User Modal -->
      <div class="modal fade" id="userModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="userModalTitle">Usuario</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="userForm">
                <input type="hidden" id="userId">
                <div class="mb-3">
                  <label for="userName" class="form-label">Nombre</label>
                  <input type="text" class="form-control" id="userName" required>
                </div>
                <div class="mb-3">
                  <label for="userEmail" class="form-label">Email</label>
                  <input type="email" class="form-control" id="userEmail" required>
                </div>
                <div class="mb-3" id="userPasswordWrapper">
                  <label for="userPassword" class="form-label">Contraseña</label>
                  <input type="password" minlength="8" class="form-control" id="userPassword">
                  <div class="form-text">Solo requerido al crear</div>
                </div>
                <div class="mb-3">
                  <label for="userRole" class="form-label">Rol</label>
                  <select id="userRole" class="form-select">
                    <option value="2">Usuario</option>
                    <option value="1">Administrador</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="userStorageLimit" class="form-label">Límite de almacenamiento (MB, opcional)</label>
                  <input type="number" min="0" class="form-control" id="userStorageLimit" placeholder="- usa el del grupo o global -">
                </div>
                <div class="mb-3">
                  <label for="userGroups" class="form-label">Grupos</label>
                  <select id="userGroups" class="form-select" multiple></select>
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="saveUserBtn" class="btn btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Group Modal -->
      <div class="modal fade" id="groupModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title" id="groupModalTitle">Grupo</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
              <form id="groupForm">
                <input type="hidden" id="groupId">
                <div class="mb-3">
                  <label for="groupName" class="form-label">Nombre</label>
                  <input type="text" class="form-control" id="groupName" required>
                </div>
                <div class="mb-3">
                  <label for="groupDescription" class="form-label">Descripción</label>
                  <textarea class="form-control" id="groupDescription"></textarea>
                </div>
                <div class="mb-3">
                  <label for="groupLimitMb" class="form-label">Límite de almacenamiento (MB)</label>
                  <input type="number" min="0" class="form-control" id="groupLimitMb" value="10">
                </div>
              </form>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" id="saveGroupBtn" class="btn btn-primary">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Agregar manejadores de eventos
    // (El botón Mis Archivos fue retirado por requerimiento)

    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Inicializar los tabs de Bootstrap
    const tabElms = document.querySelectorAll('button[data-bs-toggle="tab"]');
    tabElms.forEach(tabEl => {
      new bootstrap.Tab(tabEl);
    });

    // Cargar configuración actual
    try {
      const settings = await fetchAPI('settings');
      if (settings) {
        const defaultLimitMb = settings.default_storage_limit ? (settings.default_storage_limit / (1024 * 1024)).toFixed(0) : '10';
        const maxFileSizeMb = settings.max_file_size ? (settings.max_file_size / (1024 * 1024)).toFixed(0) : '5';
        document.getElementById('defaultStorageLimit').value = defaultLimitMb;
        document.getElementById('maxFileSize').value = maxFileSizeMb;
        document.getElementById('bannedExtensions').value = (settings.banned_extensions || []).join(',');
      }
    } catch (e) {
      console.error('Error cargando configuración:', e);
    }

    // Guardar configuración
    const settingsForm = document.getElementById('settingsForm');
    settingsForm.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const defaultLimitMb = parseInt(document.getElementById('defaultStorageLimit').value || '10', 10);
      const maxFileSizeMb = parseInt(document.getElementById('maxFileSize').value || '5', 10);
      const banned = (document.getElementById('bannedExtensions').value || '')
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      try {
        await fetchAPI('settings/1', {
          method: 'PUT',
          body: {
            default_storage_limit: defaultLimitMb * 1024 * 1024,
            max_file_size: maxFileSizeMb * 1024 * 1024,
            banned_extensions: banned,
          }
        });
        showSuccess('Configuración guardada');
      } catch (e) {
        console.error('Error guardando configuración:', e);
        showError(e.message || 'Error al guardar configuración');
      }
    });

    // Bind acciones de Usuarios
    await bindUsersSection();

    // Bind acciones de Grupos
    await bindGroupsSection();

  } catch (error) {
    console.error('Error en el panel de administración:', error);
    showError('Error al cargar el panel de administración');
  }
}

async function bindUsersSection() {
  const addUserBtn = document.getElementById('addUserBtn');
  const usersTbody = document.getElementById('usersList');

  if (addUserBtn) addUserBtn.onclick = () => openUserModal();

  usersTbody?.querySelectorAll('.edit-user')?.forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const userId = ev.currentTarget.getAttribute('data-user-id');
      if (!userId) return;
      const current = await fetchAPI(`users/${userId}`).catch(() => null);
      openUserModal({
        id: userId,
        name: current?.name,
        email: current?.email,
        role_id: current?.is_admin ? 1 : 2,
        storage_limit: current?.storage_limit,
        groups: current?.groups || []
      });
    });
  });

  usersTbody?.querySelectorAll('.delete-user')?.forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const userId = ev.currentTarget.getAttribute('data-user-id');
      if (!userId) return;
      if (!confirm('¿Eliminar este usuario?')) return;
      try {
        await fetchAPI(`users/${userId}`, { method: 'DELETE' });
        showSuccess('Usuario eliminado');
        await refreshUsersTable();
      } catch (e) {
        console.error(e);
        showError(e.message || 'Error al eliminar usuario');
      }
    });
  });

  // Botón directo para asignar grupos (abre modal de usuario con foco en grupos)
  usersTbody?.querySelectorAll('.assign-groups')?.forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const userId = ev.currentTarget.getAttribute('data-user-id');
      if (!userId) return;
      const current = await fetchAPI(`users/${userId}`).catch(() => null);
      await openUserModal({
        id: userId,
        name: current?.name,
        email: current?.email,
        role_id: current?.is_admin ? 1 : 2,
        storage_limit: current?.storage_limit,
        groups: current?.groups || []
      });
      // Dar foco al multiselect de grupos
      const groupsEl = document.getElementById('userGroups');
      groupsEl?.focus();
    });
  });
}

async function openUserModal(user = null) {
  const modalEl = document.getElementById('userModal');
  const modal = new bootstrap.Modal(modalEl);
  const title = document.getElementById('userModalTitle');
  const idEl = document.getElementById('userId');
  const nameEl = document.getElementById('userName');
  const emailEl = document.getElementById('userEmail');
  const passWrap = document.getElementById('userPasswordWrapper');
  const passEl = document.getElementById('userPassword');
  const roleEl = document.getElementById('userRole');
  const groupsEl = document.getElementById('userGroups');
  const saveBtn = document.getElementById('saveUserBtn');

  // Cargar grupos (toda la lista)
  let allGroups = [];
  try {
    allGroups = await fetchAPI('groups');
  } catch {}
  groupsEl.innerHTML = (allGroups || []).map(g => `<option value="${g.id}">${g.name}</option>`).join('');

  // Prefill
  if (user && user.id) {
    title.textContent = 'Editar Usuario';
    idEl.value = user.id;
    nameEl.value = user.name || '';
    emailEl.value = user.email || '';
    roleEl.value = String(user.role_id || 2);
    passWrap.style.display = 'none';
    passEl.value = '';
    // Preselección de grupos
    const userGroupIds = (user.groups || []).map(g => g.id);
    Array.from(groupsEl.options).forEach(opt => { opt.selected = userGroupIds.includes(parseInt(opt.value, 10)); });
    // Prefill storage limit in MB if exists
    if (typeof user.storage_limit === 'number' && !Number.isNaN(user.storage_limit)) {
      document.getElementById('userStorageLimit').value = Math.round(user.storage_limit / (1024*1024));
    } else {
      document.getElementById('userStorageLimit').value = '';
    }
  } else {
    title.textContent = 'Nuevo Usuario';
    idEl.value = '';
    nameEl.value = '';
    emailEl.value = '';
    roleEl.value = '2';
    passWrap.style.display = '';
    passEl.value = '';
    Array.from(groupsEl.options).forEach(opt => { opt.selected = false; });
    document.getElementById('userStorageLimit').value = '';
  }

  saveBtn.onclick = null;
  const handleSave = async () => {
    try {
      const payload = {
        name: nameEl.value.trim(),
        email: emailEl.value.trim(),
        role_id: parseInt(roleEl.value, 10) || 2,
      };

      const storageLimitMb = parseInt(document.getElementById('userStorageLimit').value, 10);
      if (!Number.isNaN(storageLimitMb)) {
        payload.storage_limit = Math.max(0, storageLimitMb) * 1024 * 1024;
      }

      if (!idEl.value) {
        // creating
        if (!passEl.value || passEl.value.length < 8) {
          showError('La contraseña requiere mínimo 8 caracteres');
          return;
        }
        payload.password = passEl.value;
        const created = await fetchAPI('users', { method: 'POST', body: payload });
        showSuccess('Usuario creado');
        // Asignar grupos seleccionados si hay
        const selectedGroupIds = Array.from(groupsEl.selectedOptions).map(o => parseInt(o.value, 10));
        for (const gid of selectedGroupIds) {
          await fetchAPI(`groups/${gid}/users`, { method: 'POST', body: { user_id: created.id } });
        }
      } else {
        await fetchAPI(`users/${idEl.value}`, { method: 'PUT', body: payload });
        // Sincronizar grupos: obtener seleccionados y actuales
        const selectedGroupIds = Array.from(groupsEl.selectedOptions).map(o => parseInt(o.value, 10));
        const currentGroupIds = (user.groups || []).map(g => g.id);
        const toAdd = selectedGroupIds.filter(id => !currentGroupIds.includes(id));
        const toRemove = currentGroupIds.filter(id => !selectedGroupIds.includes(id));
        for (const gid of toAdd) {
          await fetchAPI(`groups/${gid}/users`, { method: 'POST', body: { user_id: parseInt(idEl.value, 10) } });
        }
        for (const gid of toRemove) {
          await fetchAPI(`groups/${gid}/users/${parseInt(idEl.value, 10)}`, { method: 'DELETE' });
        }
        showSuccess('Usuario actualizado');
        // Actualizar visualmente la columna de grupos sin recargar toda la tabla
        const selectedGroupNames = Array.from(groupsEl.selectedOptions).map(o => o.textContent.trim());
        updateUserGroupsCell(parseInt(idEl.value, 10), selectedGroupNames);
        // Refrescar tablas para reflejar conteos en Grupos
        await refreshGroupsTable();
        await refreshUsersTable();
      }
      modal.hide();
      // Para creación ya refrescamos arriba
    } catch (e) {
      console.error(e);
      showError(e.message || 'Error al guardar el usuario');
    }
  };

  // Asegurar no duplicar listeners
  saveBtn.onclick = handleSave;

  modal.show();
}

async function bindGroupsSection() {
  const addGroupBtn = document.getElementById('addGroupBtn');
  const groupsTbody = document.getElementById('groupsList');

  if (addGroupBtn) addGroupBtn.onclick = () => openGroupModal();

  groupsTbody?.querySelectorAll('.edit-group')?.forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const groupId = ev.currentTarget.getAttribute('data-group-id');
      if (!groupId) return;
      const current = await fetchAPI(`groups/${groupId}`).catch(() => null);
      openGroupModal({
        id: groupId,
        name: current?.name,
        description: current?.description,
        storage_limit: current?.storage_limit
      });
    });
  });

  groupsTbody?.querySelectorAll('.delete-group')?.forEach(btn => {
    btn.addEventListener('click', async (ev) => {
      const groupId = ev.currentTarget.getAttribute('data-group-id');
      if (!groupId) return;
      if (!confirm('¿Eliminar este grupo?')) return;
      try {
        await fetchAPI(`groups/${groupId}`, { method: 'DELETE' });
        showSuccess('Grupo eliminado');
        await refreshGroupsTable();
      } catch (e) {
        console.error(e);
        showError(e.message || 'Error al eliminar grupo');
      }
    });
  });
}

function openGroupModal(group = null) {
  const modalEl = document.getElementById('groupModal');
  const modal = new bootstrap.Modal(modalEl);
  const title = document.getElementById('groupModalTitle');
  const idEl = document.getElementById('groupId');
  const nameEl = document.getElementById('groupName');
  const descEl = document.getElementById('groupDescription');
  const limitEl = document.getElementById('groupLimitMb');
  const saveBtn = document.getElementById('saveGroupBtn');

  if (group && group.id) {
    title.textContent = 'Editar Grupo';
    idEl.value = group.id;
    nameEl.value = group.name || '';
    descEl.value = group.description || '';
    limitEl.value = group.storage_limit ? Math.round(group.storage_limit / (1024*1024)) : 10;
  } else {
    title.textContent = 'Nuevo Grupo';
    idEl.value = '';
    nameEl.value = '';
    descEl.value = '';
    limitEl.value = 10;
  }

  saveBtn.onclick = null;
  const handleSave = async () => {
    try {
      const payload = {
        name: nameEl.value.trim(),
        description: descEl.value.trim(),
        storage_limit: Math.max(0, parseInt(limitEl.value, 10) || 10) * 1024 * 1024,
      };

      if (!idEl.value) {
        await fetchAPI('groups', { method: 'POST', body: payload });
        showSuccess('Grupo creado');
      } else {
        await fetchAPI(`groups/${idEl.value}`, { method: 'PUT', body: payload });
        showSuccess('Grupo actualizado');
      }
      modal.hide();
      await refreshGroupsTable();
    } catch (e) {
      console.error(e);
      showError(e.message || 'Error al guardar el grupo');
    }
  };

  saveBtn.onclick = handleSave;

  modal.show();
}

async function refreshUsersTable() {
  try {
    const users = await fetchAPI('users');
    const usersTbody = document.getElementById('usersList');
    if (!usersTbody) return;
    usersTbody.innerHTML = (users || []).map(user => `
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
          <button class="btn btn-sm btn-outline-secondary assign-groups" data-user-id="${user.id}">
            <i class="bi bi-people"></i>
          </button>
          <button class="btn btn-sm btn-outline-danger delete-user" data-user-id="${user.id}">
            <i class="bi bi-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');
    await bindUsersSection();
  } catch (e) {
    console.error('Error refrescando usuarios:', e);
  }
}

function updateUserGroupsCell(userId, groupNames) {
  try {
    const usersTbody = document.getElementById('usersList');
    if (!usersTbody) return;
    const row = Array.from(usersTbody.querySelectorAll('tr')).find(tr => {
      const btn = tr.querySelector('.edit-user');
      return btn && parseInt(btn.getAttribute('data-user-id'), 10) === userId;
    });
    if (!row) return;
    // columnas: ID, Nombre, Email, Rol, Grupos, Acciones → índice 4 es Grupos
    const cells = row.querySelectorAll('td');
    if (cells && cells[4]) {
      cells[4].textContent = (groupNames && groupNames.length) ? groupNames.join(', ') : 'Ninguno';
    }
  } catch (e) {
    console.error('No se pudo actualizar la celda de grupos del usuario:', e);
  }
}

async function refreshGroupsTable() {
  try {
    const groups = await fetchAPI('groups');
    const groupsTbody = document.getElementById('groupsList');
    if (!groupsTbody) return;
    groupsTbody.innerHTML = (groups || []).map(group => {
      const storageLimitMB = group.storage_limit 
        ? (group.storage_limit / (1024 * 1024)).toFixed(2) 
        : '0.00';
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
    }).join('');
    await bindGroupsSection();
  } catch (e) {
    console.error('Error refrescando grupos:', e);
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
