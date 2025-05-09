document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorDiv = document.querySelector('.error');
    const successDiv = document.querySelector('.success');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    localStorage.setItem('userEmail', data.email); // Store email
                    window.location.href = '/home.html';
                } else {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = data.message;
                }
            } catch (err) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'An error occurred. Please try again.';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();
                if (response.ok) {
                    successDiv.style.display = 'block';
                    successDiv.textContent = 'Registration successful! Redirecting to login...';
                    setTimeout(() => {
                        window.location.href = '/login.html';
                    }, 2000);
                } else {
                    errorDiv.style.display = 'block';
                    errorDiv.textContent = data.message;
                }
            } catch (err) {
                errorDiv.style.display = 'block';
                errorDiv.textContent = 'An error occurred. Please try again.';
            }
        });
    }
});