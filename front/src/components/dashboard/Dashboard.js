import { files, auth, fetchAPI } from '../../services/api';
import { showError, showSuccess } from '../../utils/helpers';

export async function renderDashboard() {
  const app = document.querySelector('#app');
  
  try {
    // Cargar grupos del usuario
    let groups = [];
    let groupsError = null;
    
    try {
      // Usar el servicio de API para cargar los grupos
      groups = await fetchAPI('groups');
      
      if (!Array.isArray(groups)) {
        console.warn('La respuesta de grupos no es un array:', groups);
        groups = [];
        groupsError = 'Formato de respuesta inesperado';
      }
    } catch (error) {
      console.error('Error al cargar grupos:', error);
      groupsError = error.message;
      // Mostrar solo un mensaje genérico al usuario
      showError('No se pudieron cargar los grupos. Intenta recargar la página.');
    }

    // Obtener información del usuario actual
    let currentUser = null;
    try {
      currentUser = await auth.getCurrentUser();
    } catch (error) {
      console.error('Error al cargar la información del usuario:', error);
      showError('No se pudo cargar la información del usuario');
      return;
    }

    // Mostrar loading
    app.innerHTML = `
      <div class="container mt-4">
        <div class="d-flex justify-content-between align-items-center mb-4">
          <h1>Mis Archivos</h1>
          <div>
            ${currentUser?.is_admin ? `
              <a href="/admin" class="btn btn-outline-primary me-2">
                <i class="bi bi-speedometer2"></i> Panel de Administración
              </a>
            ` : ''}
            <button id="uploadBtn" class="btn btn-primary me-2">
              <i class="bi bi-upload"></i> Subir Archivo
            </button>
            <button id="logoutBtn" class="btn btn-outline-danger">
              <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
            </button>
          </div>
        </div>
        
        <div id="fileUploadSection" class="mb-4" style="display: none;">
          <div class="card">
            <div class="card-body">
              <h5 class="card-title">Subir nuevo archivo</h5>
              ${groups.length > 0 ? `
                <div class="mb-3">
                  <label for="fileGroup" class="form-label">Seleccionar grupo</label>
                  <select class="form-select" id="fileGroup" required>
                    <option value="">Selecciona un grupo</option>
                    ${groups.map(group => 
                      `<option value="${group.id}">${group.name}</option>`
                    ).join('')}
                  </select>
                </div>
              ` : `
                <div class="alert alert-warning">
                  <p>No se pudieron cargar los grupos. Por favor, ingresa manualmente el ID del grupo.</p>
                  <div class="mb-3">
                    <label for="manualGroupId" class="form-label">ID del Grupo</label>
                    <input type="text" class="form-control" id="manualGroupId" placeholder="Ingresa el ID del grupo" required>
                  </div>
                </div>
              `}
              <div class="mb-3">
                <label for="fileInput" class="form-label">Archivo</label>
                <input type="file" class="form-control" id="fileInput" required>
              </div>
              <div class="d-flex justify-content-end gap-2">
                <button type="button" id="cancelUpload" class="btn btn-outline-secondary">Cancelar</button>
                <button type="button" id="confirmUpload" class="btn btn-primary">Subir</button>
              </div>
            </div>
          </div>
        </div>
        
        <div id="fileList" class="row">
          <div class="col-12 text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Cargando...</span>
            </div>
          </div>
        </div>
      </div>
    `;

    // Cargar archivos
    const fileList = document.getElementById('fileList');
    const response = await files.getAll();
    const filesData = Array.isArray(response) ? response : (response?.data || []);

    if (filesData.length === 0) {
      fileList.innerHTML = `
        <div class="col-12">
          <div class="alert alert-info">No hay archivos subidos.</div>
        </div>
      `;
    } else {
      fileList.innerHTML = filesData.map(file => `
        <div class="col-md-4 mb-4">
          <div class="card h-100">
            <div class="card-body">
              <h5 class="card-title">${file.original_name || 'Archivo sin nombre'}</h5>
              <p class="card-text text-muted small">
                Tamaño: ${formatFileSize(file.size)}<br>
                Subido: ${new Date(file.created_at).toLocaleDateString()}
              </p>
            </div>
            <div class="card-footer bg-transparent">
              <div class="d-flex justify-content-between">
                <a href="${files.download(file.id)}" class="btn btn-sm btn-outline-primary">
                  <i class="bi bi-download"></i> Descargar
                </a>
                <button class="btn btn-sm btn-outline-danger delete-file" data-id="${file.id}">
                  <i class="bi bi-trash"></i> Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      `).join('');

      // Agregar event listeners para eliminar archivos
      document.querySelectorAll('.delete-file').forEach(button => {
        button.addEventListener('click', handleDeleteFile);
      });
    }

    // Agregar event listeners
    const uploadBtn = document.getElementById('uploadBtn');
    const cancelUploadBtn = document.getElementById('cancelUpload');
    const confirmUploadBtn = document.getElementById('confirmUpload');
    const fileInput = document.getElementById('fileInput');
    const fileUploadSection = document.getElementById('fileUploadSection');
    const fileGroupSelect = document.getElementById('fileGroup');
    
    // Mostrar/ocultar sección de subida
    uploadBtn.addEventListener('click', () => {
      fileUploadSection.style.display = 'block';
    });
    
    cancelUploadBtn.addEventListener('click', () => {
      fileUploadSection.style.display = 'none';
      fileInput.value = '';
      fileGroupSelect.value = '';
    });
    
    // Manejar la confirmación de subida
    confirmUploadBtn.addEventListener('click', async () => {
      const file = fileInput.files[0];
      
      // Obtener el ID del grupo del selector o del campo manual
      let groupId;
      if (groups.length > 0) {
        groupId = fileGroupSelect.value;
        if (!groupId) {
          showError('Por favor selecciona un grupo');
          return;
        }
      } else {
        groupId = document.getElementById('manualGroupId')?.value?.trim();
        if (!groupId) {
          showError('Por favor ingresa el ID del grupo');
          return;
        }
      }
      
      if (!file) {
        showError('Por favor selecciona un archivo');
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('group_id', groupId);
        
        // Mostrar indicador de carga
        confirmUploadBtn.disabled = true;
        confirmUploadBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Subiendo...';
        
        await files.upload(formData);
        
        showSuccess('Archivo subido correctamente');
        fileUploadSection.style.display = 'none';
        fileInput.value = '';
        if (fileGroupSelect) fileGroupSelect.value = '';
        const manualGroupId = document.getElementById('manualGroupId');
        if (manualGroupId) manualGroupId.value = '';
        
        // Recargar la lista de archivos
        await renderDashboard();
      } catch (error) {
        console.error('Error al subir archivo:', error);
        showError(error.message || 'Error al subir el archivo');
      } finally {
        // Restaurar el botón
        if (confirmUploadBtn) {
          confirmUploadBtn.disabled = false;
          confirmUploadBtn.textContent = 'Subir';
        }
      }
    });
    
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

  } catch (error) {
    console.error('Error al cargar archivos:', error);
    showError('Error al cargar los archivos. Intenta recargar la página.');
  }
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function handleDeleteFile(e) {
  const fileId = e.currentTarget.dataset.id;
  if (!confirm('¿Estás seguro de que quieres eliminar este archivo?')) return;
  
  try {
    await files.delete(fileId);
    showSuccess('Archivo eliminado correctamente');
    renderDashboard();
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    showError('Error al eliminar el archivo');
  }
}

async function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    await files.upload(formData);
    showSuccess('Archivo subido correctamente');
    renderDashboard();
  } catch (error) {
    console.error('Error al subir archivo:', error);
    showError(error.message || 'Error al subir el archivo');
  }
}

async function handleLogout() {
  try {
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
