const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

export async function fetchAPI(endpoint, options = {}) {
  const authToken = localStorage.getItem('authToken') || '';
  
  // Asegurarse de que el endpoint empiece con /
  if (!endpoint.startsWith('/')) {
    endpoint = `/${endpoint}`;
  }
  
  // Configuración de headers por defecto
  const headers = {
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers || {})
  };
  
  // Solo agregar Content-Type si no es FormData y no se ha especificado en options.headers
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Agregar el token de autenticación si existe
  if (authToken) {
    // Si el token ya incluye 'Bearer', lo usamos tal cual, si no, lo agregamos
    headers['Authorization'] = authToken.startsWith('Bearer ') 
      ? authToken 
      : `Bearer ${authToken}`;
  }
  
  const fetchOptions = {
    ...options,
    headers,
    mode: 'cors',
    credentials: 'include' // Importante para manejar cookies de sesión
  };

  // Si el body es un objeto y no es FormData, convertirlo a JSON
  if (fetchOptions.body && typeof fetchOptions.body === 'object' && !(fetchOptions.body instanceof FormData)) {
    fetchOptions.body = JSON.stringify(fetchOptions.body);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, fetchOptions);
    
    // Manejar errores HTTP
    if (!response.ok) {
      let errorData;
      const contentType = response.headers.get('content-type');
      
      try {
        errorData = contentType?.includes('application/json') 
          ? await response.json() 
          : { message: await response.text() };
      } catch (e) {
        errorData = { message: 'Error al procesar la respuesta del servidor' };
      }
      
      const error = new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.data = errorData;
      throw error;
    }

    // Si la respuesta es 204 No Content, retornar null
    if (response.status === 204) {
      return null;
    }

    // Intentar parsear la respuesta como JSON
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return await response.text();
  } catch (error) {
    console.error('Error en la petición:', {
      endpoint: `${API_BASE_URL}${endpoint}`,
      error: error.message,
      status: error.status
    });
    throw error;
  }
}

export const auth = {
  login: async (credentials) => {
    try {
      console.log('Iniciando solicitud de login a:', `${API_BASE_URL}/login`);
      const response = await fetch(`${API_BASE_URL}/login`, { 
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(credentials),
        credentials: 'include' // Importante para manejar cookies de sesión
      });

      const responseData = await response.json().catch(() => ({}));
      console.log('Respuesta del servidor:', { status: response.status, data: responseData });

      if (!response.ok) {
        throw new Error(responseData.message || 'Error en la autenticación');
      }

      if (!responseData || !responseData.access_token) {
        throw new Error('Formato de respuesta inválido del servidor');
      }
      
      // Guardar el token en localStorage
      localStorage.setItem('authToken', responseData.access_token);
      
      // Asegurarse de que el usuario tenga role_id
      const userData = responseData.user || {};
      
      // Devolver los datos del usuario
      return {
        ...responseData,
        user: {
          ...userData,
          role_id: userData.role_id || 2, // Por defecto, asumir que no es admin
          is_admin: userData.role_id === 1
        }
      };
    } catch (error) {
      console.error('Error en auth.login:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  },
  register: (userData) => fetchAPI('/register', { method: 'POST', body: userData }),
  logout: async () => {
    try {
      await fetchAPI('/logout', { method: 'POST' });
    } finally {
      localStorage.removeItem('authToken');
    }
  },
  getCurrentUser: async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      console.log('Obteniendo datos del usuario...');
      const response = await fetch(`${API_BASE_URL}/user`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        // Token inválido o expirado
        localStorage.removeItem('authToken');
        throw new Error('La sesión ha expirado. Por favor, inicia sesión nuevamente.');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al obtener los datos del usuario');
      }

      const userData = await response.json();
      console.log('Datos del usuario obtenidos:', userData);
      
      if (!userData) {
        throw new Error('No se recibieron datos del usuario');
      }
      
      // Asegurarse de que el usuario tenga role_id
      const userWithRole = {
        ...userData,
        role_id: userData.role_id || 2, // Por defecto, asumir que no es admin
        is_admin: userData.role_id === 1
      };
      
      console.log('Usuario con rol:', userWithRole);
      return userWithRole;
      
    } catch (error) {
      console.error('Error en getCurrentUser:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }
};

export const files = {
  getAll: () => fetchAPI('files'),
  upload: (formData) => fetchAPI('files', {
    method: 'POST',
    body: formData,
    headers: {
      // No establecer Content-Type, el navegador lo hará automáticamente con el límite correcto
    }
  }),
  delete: (id) => fetchAPI(`files/${id}`, { method: 'DELETE' }),
  download: async (id) => {
    await fetchAPI(`files/${id}/download`, {}, true);
  }
};

export const admin = {
  // Users
  getUsers: () => fetchAPI('admin/users'),
  createUser: (userData) => fetchAPI('admin/users', {
    method: 'POST',
    body: userData
  }),
  updateUser: (id, userData) => fetchAPI(`admin/users/${id}`, {
    method: 'PUT',
    body: userData
  }),
  deleteUser: (id) => fetchAPI(`admin/users/${id}`, { method: 'DELETE' }),
  
  // Groups
  getGroups: () => fetchAPI('admin/groups'),
  createGroup: (groupData) => fetchAPI('admin/groups', {
    method: 'POST',
    body: groupData
  }),
  updateGroup: (id, groupData) => fetchAPI(`admin/groups/${id}`, {
    method: 'PUT',
    body: groupData
  }),
  deleteGroup: (id) => fetchAPI(`admin/groups/${id}`, { method: 'DELETE' }),
  
  // Group Users
  addUserToGroup: (groupId, userId) => 
    fetchAPI(`admin/groups/${groupId}/users/${userId}`, { method: 'POST' }),
  removeUserFromGroup: (groupId, userId) => 
    fetchAPI(`admin/groups/${groupId}/users/${userId}`, { method: 'DELETE' }),
  
  // Settings
  getSettings: () => fetchAPI('admin/settings'),
  updateSettings: (settings) => fetchAPI('admin/settings', {
    method: 'PUT',
    body: settings
  })
};
