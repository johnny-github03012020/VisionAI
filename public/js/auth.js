/**
 * Authentication functionality for VisionAI
 */
class Auth {
    constructor() {
        this.user = null;
        this.loadUserFromStorage();
        this.initEventListeners();
    }

    loadUserFromStorage() {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            try {
                this.user = JSON.parse(storedUser);
                this.updateUI();
            } catch (error) {
                console.error('Error parsing stored user:', error);
                localStorage.removeItem('user');
            }
        }
    }

    initEventListeners() {
        // Login button
        const loginBtn = document.getElementById('iniciar-sesion');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                if (this.user) {
                    this.showUserMenu();
                } else {
                    this.showLoginModal();
                }
            });
        }

        // Login modal close button
        const loginCloseBtn = document.querySelector('#login-modal .close');
        if (loginCloseBtn) {
            loginCloseBtn.addEventListener('click', () => {
                document.getElementById('login-modal').style.display = 'none';
            });
        }

        // Register modal close button
        const registerCloseBtn = document.querySelector('#register-modal .close');
        if (registerCloseBtn) {
            registerCloseBtn.addEventListener('click', () => {
                document.getElementById('register-modal').style.display = 'none';
            });
        }

        // Register link in login modal
        const registerLink = document.getElementById('register-link');
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('login-modal').style.display = 'none';
                document.getElementById('register-modal').style.display = 'block';
            });
        }

        // Login link in register modal
        const loginLink = document.getElementById('login-link');
        if (loginLink) {
            loginLink.addEventListener('click', (e) => {
                e.preventDefault();
                document.getElementById('register-modal').style.display = 'none';
                document.getElementById('login-modal').style.display = 'block';
            });
        }

        // Login form submission
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('username').value;
                const password = document.getElementById('password').value;
                this.login(username, password);
            });
        }

        // Register form submission
        const registerForm = document.getElementById('register-form');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const username = document.getElementById('reg-username').value;
                const email = document.getElementById('reg-email').value;
                const password = document.getElementById('reg-password').value;
                const confirmPassword = document.getElementById('reg-confirm-password').value;
                
                // Validate form fields
                if (!username || !email || !password || !confirmPassword) {
                    this.showError('Por favor, completa todos los campos');
                    return;
                }
                
                // Validate email format
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) {
                    this.showError('Por favor, introduce un email válido');
                    return;
                }
                
                // Validate password length
                if (password.length < 6) {
                    this.showError('La contraseña debe tener al menos 6 caracteres');
                    return;
                }
                
                // Validate password match
                if (password !== confirmPassword) {
                    this.showError('Las contraseñas no coinciden');
                    return;
                }
                
                // Clear any previous errors
                this.clearErrors();
                
                // Show loading state
                const registerBtn = registerForm.querySelector('button[type="submit"]');
                const originalText = registerBtn.textContent;
                registerBtn.textContent = 'Registrando...';
                registerBtn.disabled = true;
                
                this.register(username, email, password, () => {
                    // Reset button state
                    registerBtn.textContent = originalText;
                    registerBtn.disabled = false;
                    
                    // Reset form
                    registerForm.reset();
                });
            });
        }

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.style.display = 'none';
            }
        });
    }

    showLoginModal() {
        document.getElementById('login-modal').style.display = 'block';
    }

    showUserMenu() {
        // In a real application, you would show a dropdown menu
        // For now, we'll just show a simple logout confirmation
        if (confirm(`¿Deseas cerrar sesión, ${this.user.username}?`)) {
            this.logout();
        }
    }

    login(username, password) {
        // In a real application, you would make an API call to verify credentials
        // For demo purposes, we'll simulate a successful login
        
        // Simulate API call
        setTimeout(() => {
            // Simulate successful login
            this.user = {
                id: '123',
                username: username,
                email: `${username}@example.com`
            };
            
            // Save user to localStorage
            localStorage.setItem('user', JSON.stringify(this.user));
            
            // Update UI
            this.updateUI();
            
            // Close modal
            document.getElementById('login-modal').style.display = 'none';
            
            // Show success message
            alert(`¡Bienvenido, ${username}!`);
        }, 1000);
    }

    register(username, email, password, callback) {
        // In a real application, you would make an API call to register the user
        
        // Simulate API call
        setTimeout(() => {
            try {
                // Make API call to register user
                fetch('/api/auth/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, email, password })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Simulate successful registration
                        this.user = {
                            id: data.userId || '123',
                            username: username,
                            email: email
                        };
                        
                        // Save user to localStorage
                        localStorage.setItem('user', JSON.stringify(this.user));
                        
                        // Update UI
                        this.updateUI();
                        
                        // Close modal
                        document.getElementById('register-modal').style.display = 'none';
                        
                        // Show success message
                        this.showSuccessMessage(`Registro exitoso. ¡Bienvenido, ${username}!`);
                    } else {
                        // Show error message
                        this.showError(data.message || 'Error al registrarse');
                    }
                })
                .catch(error => {
                    console.error('Error during registration:', error);
                    this.showError('Error de conexión. Por favor, inténtalo de nuevo.');
                })
                .finally(() => {
                    if (callback) callback();
                });
            } catch (error) {
                console.error('Error during registration:', error);
                this.showError('Error al procesar la solicitud');
                if (callback) callback();
            }
        }, 1000); // Simulate network delay
    }
    
    showSuccessMessage(message) {
        // You could implement a toast notification here
        alert(message);
    }

    showError(message) {
        // Create error element if it doesn't exist
        let errorElement = document.getElementById('register-error');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.id = 'register-error';
            errorElement.className = 'error-message';
            
            // Insert before the register button
            const registerForm = document.getElementById('register-form');
            const registerBtn = registerForm.querySelector('button[type="submit"]');
            registerForm.insertBefore(errorElement, registerBtn);
        }
        
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
    
    clearErrors() {
        const errorElement = document.getElementById('register-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }

    logout() {
        // Clear user data
        this.user = null;
        localStorage.removeItem('user');
        
        // Update UI
        this.updateUI();
    }

    updateUI() {
        const loginBtn = document.getElementById('iniciar-sesion');
        if (loginBtn) {
            if (this.user) {
                loginBtn.textContent = this.user.username;
            } else {
                loginBtn.textContent = 'Iniciar Sesión';
            }
        }
    }
}

// Initialize auth when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new Auth();
});