// Función para mostrar mensajes de error
export function showError(message) {
  // Eliminar mensajes anteriores
  const existingError = document.querySelector('.alert-dismissible');
  if (existingError) {
    existingError.remove();
  }
  
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
  alert.role = 'alert';
  alert.style.zIndex = '1100';
  
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(alert);
  
  // Cerrar automáticamente después de 5 segundos
  setTimeout(() => {
    const bsAlert = new bootstrap.Alert(alert);
    bsAlert.close();
  }, 5000);
}

// Función para mostrar mensajes de éxito
export function showSuccess(message) {
  // Eliminar mensajes anteriores
  const existingAlert = document.querySelector('.alert-dismissible');
  if (existingAlert) {
    existingAlert.remove();
  }
  
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3';
  alert.role = 'alert';
  alert.style.zIndex = '1100';
  
  alert.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
  `;
  
  document.body.appendChild(alert);
  
  // Cerrar automáticamente después de 3 segundos
  setTimeout(() => {
    const bsAlert = new bootstrap.Alert(alert);
    bsAlert.close();
  }, 3000);
}
