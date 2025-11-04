<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Storage</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body class="bg-gray-100">
    <div id="app">
        <!-- Barra de navegación -->
        <nav class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex">
                        <div class="flex-shrink-0 flex items-center">
                            <h1 class="text-xl font-bold text-gray-900">Secure Storage</h1>
                        </div>
                    </div>
                    <div class="hidden sm:ml-6 sm:flex sm:items-center">
                        <div id="userMenu" class="ml-3 relative">
                            <div class="flex items-center">
                                <button id="loginBtn" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                                    Iniciar sesión
                                </button>
                                <button id="registerBtn" class="ml-4 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-md text-sm font-medium">
                                    Registrarse
                                </button>
                            </div>
                            <div id="userDropdown" class="hidden origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                                <div class="py-1">
                                    <a href="#" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Mi perfil</a>
                                    <a href="#" id="logoutBtn" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Cerrar sesión</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>

        <!-- Contenido principal -->
        <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            <!-- Sección de autenticación -->
            <div id="authSection" class="hidden bg-white shadow rounded-lg p-6 mb-6">
                <!-- Contenido del formulario de autenticación -->
                <div id="loginForm" class="space-y-4">
                    <h2 class="text-lg font-medium text-gray-900">Iniciar sesión</h2>
                    <div>
                        <label for="email" class="block text-sm font-medium text-gray-700">Correo electrónico</label>
                        <input type="email" id="email" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input type="password" id="password" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <button id="submitLogin" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Iniciar sesión
                    </button>
                    <p class="text-sm text-gray-600">
                        ¿No tienes una cuenta? 
                        <a href="#" id="showRegister" class="font-medium text-blue-600 hover:text-blue-500">Regístrate aquí</a>
                    </p>
                </div>

                <div id="registerForm" class="hidden space-y-4">
                    <h2 class="text-lg font-medium text-gray-900">Registrarse</h2>
                    <div>
                        <label for="regName" class="block text-sm font-medium text-gray-700">Nombre</label>
                        <input type="text" id="regName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="regEmail" class="block text-sm font-medium text-gray-700">Correo electrónico</label>
                        <input type="email" id="regEmail" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="regPassword" class="block text-sm font-medium text-gray-700">Contraseña</label>
                        <input type="password" id="regPassword" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <div>
                        <label for="regPasswordConfirmation" class="block text-sm font-medium text-gray-700">Confirmar contraseña</label>
                        <input type="password" id="regPasswordConfirmation" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                    </div>
                    <button id="submitRegister" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                        Registrarse
                    </button>
                    <p class="text-sm text-gray-600">
                        ¿Ya tienes una cuenta? 
                        <a href="#" id="showLogin" class="font-medium text-blue-600 hover:text-blue-500">Inicia sesión aquí</a>
                    </p>
                </div>
            </div>

            <!-- Sección de archivos -->
            <div id="filesSection" class="hidden">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-900">Mis archivos</h2>
                    <button id="uploadFileBtn" class="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center">
                        <i class="fas fa-upload mr-2"></i> Subir archivo
                    </button>
                </div>

                <!-- Modal de carga de archivos -->
                <div id="uploadModal" class="hidden fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
                    <div class="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div class="mt-3 text-center">
                            <h3 class="text-lg leading-6 font-medium text-gray-900">Subir archivo</h3>
                            <div class="mt-2 px-7 py-3">
                                <form id="uploadForm" class="space-y-4">
                                    <div>
                                        <label for="file" class="block text-sm font-medium text-gray-700">Archivo</label>
                                        <input type="file" id="file" class="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">
                                    </div>
                                    <div>
                                        <label for="fileGroup" class="block text-sm font-medium text-gray-700">Grupo</label>
                                        <select id="fileGroup" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                                            <!-- Se llenará dinámicamente -->
                                        </select>
                                    </div>
                                    <div>
                                        <label for="fileDescription" class="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
                                        <textarea id="fileDescription" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="items-center px-4 py-3">
                                <button id="submitUpload" class="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    Subir
                                </button>
                                <button id="cancelUpload" class="ml-2 px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md shadow-sm hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Lista de archivos -->
                <div class="bg-white shadow overflow-hidden sm:rounded-md">
                    <ul id="filesList" class="divide-y divide-gray-200">
                        <!-- Se llenará dinámicamente -->
                    </ul>
                </div>
            </div>
        </main>
    </div>

    <!-- Scripts -->
    <script>
        // Mover el contenido de app.js aquí
        {!! file_get_contents(public_path('js/app.js')) !!}
    </script>
</body>
</html>
