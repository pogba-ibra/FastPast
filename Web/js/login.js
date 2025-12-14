document.addEventListener("DOMContentLoaded", () => {
  // Check for Google OAuth callback parameters
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('google_success') === 'true') {
    const token = urlParams.get('token');
    const userParam = urlParams.get('user');
    const isNewUser = urlParams.get('isNewUser');

    if (token && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));

        // Store session token and user info immediately
        localStorage.setItem('sessionToken', token);
        localStorage.setItem('currentUser', JSON.stringify(user));

        // Clear URL parameters
        window.history.replaceState({}, document.title, window.location.pathname);

        // If user already exists (isNewUser === 'false'), treat as login and redirect home
        if (isNewUser === 'false') {
          // Set flag to show disclaimer modal
          sessionStorage.setItem('fastpast_just_logged_in', 'true');
          window.location.href = 'index.html';
          return;
        }

        // isNewUser is true - Proceed to Registration Flow
        // Check window width for mobile/desktop logic
        const isMobile = window.innerWidth <= 768;

        if (isMobile) {
          // Show Mobile Registration Form
          const loginForm = document.querySelector(".mobile-form:not(.mobile-register-form)");
          const registerForm = document.querySelector(".mobile-register-form");
          if (loginForm) loginForm.style.display = 'none';
          if (registerForm) {
            registerForm.style.display = 'block';
            registerForm.style.visibility = 'visible';
            registerForm.style.opacity = '1';
          }

          // Hide standard inputs, show profile
          const mobileInputs = document.getElementById('mobile-email-signup-inputs');
          const mobileProfile = document.getElementById('mobile-google-profile-container');
          const mobilePic = document.getElementById('mobile-google-profile-pic');
          const mobileName = document.getElementById('mobile-google-username');

          if (mobileInputs) mobileInputs.style.display = 'none';
          if (mobileProfile) mobileProfile.style.display = 'block';
          if (mobilePic) mobilePic.src = user.profilePicture || 'Images/user-avatar.png'; // Fallback
          if (mobileName) mobileName.textContent = user.username;

          // Change button text
          const mobileBtn = registerForm.querySelector('button[type="submit"] span');
          if (mobileBtn) mobileBtn.textContent = 'Continue to Payment';

        } else {
          // Desktop Logic
          const container = document.getElementById("container");
          if (container) container.classList.add("right-panel-active"); // Show Sign Up panel

          // Hide standard inputs, show profile
          const desktopInputs = document.getElementById('email-signup-inputs');
          const desktopProfile = document.getElementById('google-profile-container');
          const desktopPic = document.getElementById('google-profile-pic');
          const desktopName = document.getElementById('google-username');

          if (desktopInputs) desktopInputs.style.display = 'none';
          // Hide "or use your email for registration" text
          const regText = document.getElementById('registration-text');
          if (regText) regText.style.display = 'none';

          if (desktopProfile) desktopProfile.style.display = 'block';
          if (desktopPic) desktopPic.src = user.profilePicture || 'Images/user-avatar.png';
          if (desktopName) desktopName.textContent = user.username;

          // Change button text
          const desktopBtn = document.querySelector('.sign-up-container form button');
          if (desktopBtn) desktopBtn.textContent = 'Continue to Payment';
        }

      } catch (err) {
        console.error('Error parsing Google OAuth response:', err);
        alert("An error occurred during Google sign-in. Please try again.");
      }
    }
  }

  // Check for OAuth errors
  const error = urlParams.get('error');
  if (error) {
    const errorMessages = {
      'google_auth_failed': 'Google authentication failed. Please try again.',
      'token_exchange_failed': 'Failed to authenticate with Google. Please try again.',
      'no_email': 'Could not get email from Google account.',
      'server_error': 'Server error during authentication. Please try again.'
    };
    alert(errorMessages[error] || 'Authentication error. Please try again.');
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  // Handle Plan Selection Click Events (Desktop)
  const planLabels = document.querySelectorAll('.plan-select');
  planLabels.forEach(label => {
    label.addEventListener('click', function () {
      // Small delay to allow radio to update
      setTimeout(() => {
        // Remove selected class from all
        planLabels.forEach(l => l.parentElement.classList.remove('selected-plan'));

        // Add to current
        if (this.querySelector('input').checked) {
          this.parentElement.classList.add('selected-plan');
        }
      }, 10);
    });
  });

  // Handle Plan Selection Click Events (Mobile)
  const planLabelsMobile = document.querySelectorAll('.plan-select-mobile');
  planLabelsMobile.forEach(label => {
    label.addEventListener('click', function () {
      // Small delay to allow radio to update
      setTimeout(() => {
        // Remove selected class from all
        planLabelsMobile.forEach(l => l.parentElement.classList.remove('selected-plan'));

        // Add to current
        if (this.querySelector('input').checked) {
          this.parentElement.classList.add('selected-plan');
        }
      }, 10);
    });
  });


  // Temporarily disable CSS transitions until layout stabilizes
  document.body.classList.add("no-animate");
  // Remove the class on next paint to restore transitions
  requestAnimationFrame(() =>
    requestAnimationFrame(() => document.body.classList.remove("no-animate"))
  );
  const signUpButton = document.getElementById("signUp");
  const signInButton = document.getElementById("signIn");
  const container = document.getElementById("container");


  if (signUpButton) {
    signUpButton.addEventListener("click", () => {
      container.classList.add("right-panel-active");
    });
  }

  // signIn should remove the active class (return to sign-in view)
  if (signInButton) {
    signInButton.addEventListener("click", () => {
      container.classList.remove("right-panel-active");
    });
  }

  // Form submission handlers are added below (removed old click handler)

  // Mobile form toggling
  const registerText = document.querySelector(".register-text");
  const loginLink = document.querySelector(".login-link");
  const loginForm = document.querySelector(
    ".mobile-form:not(.mobile-register-form)"
  );
  const registerForm = document.querySelector(".mobile-register-form");
  // const loginButton = document.querySelector(".mobile-form button"); // Unused

  // Ensure an explicit initial state for mobile forms so layout is correct
  if (loginForm && registerForm) {
    if (window.matchMedia && window.matchMedia("(max-width: 768px)").matches) {
      // Use display + visibility to avoid layout jump, and force reflow
      loginForm.style.display = "none";
      registerForm.style.display = "block";
      registerForm.style.visibility = "visible";
      registerForm.style.opacity = "1";
      // Force a reflow so the browser applies computed styles immediately
      // (reading offsetHeight forces layout)
      void registerForm.offsetHeight;
    }
  }

  if (registerText && loginForm && registerForm) {
    registerText.addEventListener("click", () => {
      loginForm.style.display = "none";
      registerForm.style.display = "block";
    });
  }

  if (loginLink && loginForm && registerForm) {
    loginLink.addEventListener("click", () => {
      registerForm.style.display = "none";
      loginForm.style.display = "block";
    });
  }

  // Mobile form toggling (removed old conflicting login button handler)

  // Add focus/blur handlers for mobile form inputs to show underline on corresponding labels
  const mobileInputs = document.querySelectorAll('.mobile-form input');
  mobileInputs.forEach(input => {
    input.addEventListener('focus', () => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) label.classList.add('focused');
    });
    input.addEventListener('blur', () => {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) label.classList.remove('focused');
    });
  });

  // Handle Desktop Registration Form
  const desktopRegisterForm = document.querySelector('.sign-up-container form');
  if (desktopRegisterForm) {
    desktopRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check if we are in "Google Mode" (session token exists)
      const token = localStorage.getItem('sessionToken');
      // Get selected plan
      const selectedPlanInput = document.querySelector('input[name="subscription-plan"]:checked');
      const membershipType = selectedPlanInput ? selectedPlanInput.value : 'free';

      if (token && document.getElementById('google-profile-container').style.display === 'block') {
        // Redirect to payment page with plan
        if (membershipType === 'free') {
          // For free plan, just go home
          sessionStorage.setItem('fastpast_just_logged_in', 'true');
          window.location.href = 'index.html';
        } else {
          window.location.href = `payment.html?plan=${membershipType}`;
        }
        return;
      }

      const username = document.getElementById('signup-name').value;
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;

      await handleRegistration({ username, email, password, membershipType });
    });
  }

  // Handle Mobile Registration Form
  const mobileRegisterForm = document.querySelector('.mobile-register-form');
  if (mobileRegisterForm) {
    mobileRegisterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      // Check if we are in "Google Mode" (session token exists)
      const token = localStorage.getItem('sessionToken');
      const selectedPlanInput = document.querySelector('input[name="subscription-plan-mobile"]:checked');
      const membershipType = selectedPlanInput ? selectedPlanInput.value : 'free';

      if (token && document.getElementById('mobile-google-profile-container').style.display === 'block') {
        // Redirect to payment page with plan
        if (membershipType === 'free') {
          // For free plan, just go home
          sessionStorage.setItem('fastpast_just_logged_in', 'true');
          window.location.href = 'index.html';
        } else {
          window.location.href = `payment.html?plan=${membershipType}`;
        }
        return;
      }

      const username = document.getElementById('reg-username').value;
      const email = document.getElementById('reg-email').value;
      const password = document.getElementById('reg-password').value;

      await handleRegistration({ username, email, password, membershipType });
    });
  }

  // Check for 'mode' and 'plan' query parameters
  const mode = urlParams.get('mode');
  const plan = urlParams.get('plan');

  if (mode === 'signup') {
    // Show Sign Up panel
    if (container) container.classList.add("right-panel-active");

    // For mobile
    if (loginForm && registerForm && window.innerWidth <= 768) {
      loginForm.style.display = 'none';
      registerForm.style.display = 'block';
    }
  }

  if (plan) {
    // Select the plan in desktop form
    const desktopPlanInput = document.querySelector(`input[name="subscription-plan"][value="${plan}"]`);
    if (desktopPlanInput) {
      desktopPlanInput.checked = true;
      desktopPlanInput.parentElement.parentElement.classList.add('selected-plan');
    }

    // Select the plan in mobile form
    const mobilePlanInput = document.querySelector(`input[name="subscription-plan-mobile"][value="${plan}"]`);
    if (mobilePlanInput) {
      mobilePlanInput.checked = true;
      mobilePlanInput.parentElement.parentElement.classList.add('selected-plan');
    }
  }

  // Handle Desktop Login Form
  const desktopLoginForm = document.querySelector('.sign-in-container form');
  if (desktopLoginForm) {
    desktopLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('signin-email').value;
      const password = document.getElementById('signin-password').value;

      await handleLogin({ email, password });
    });
  }

  // Handle Mobile Login Form
  const mobileLoginForm = document.querySelector('.mobile-form:not(.mobile-register-form)');
  if (mobileLoginForm) {
    mobileLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      // Username can be email
      await handleLogin({ email: username, password });
    });
  }

  // Terms Agreement Checkbox Functionality
  // Desktop checkbox
  const desktopTermsCheckbox = document.getElementById('terms-checkbox');
  const desktopPaymentBtn = document.getElementById('desktop-payment-btn');

  if (desktopTermsCheckbox && desktopPaymentBtn) {
    desktopTermsCheckbox.addEventListener('change', function () {
      desktopPaymentBtn.disabled = !this.checked;
    });
  }

  // Mobile checkbox
  const mobileTermsCheckbox = document.getElementById('terms-checkbox-mobile');
  const mobilePaymentBtn = document.getElementById('mobile-payment-btn');

  if (mobileTermsCheckbox && mobilePaymentBtn) {
    mobileTermsCheckbox.addEventListener('change', function () {
      mobilePaymentBtn.disabled = !this.checked;
    });
  }
});

// Registration handler
async function handleRegistration(data) {
  const API_URL = '';

  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      // Store session token and user info
      localStorage.setItem('sessionToken', result.data.sessionToken);
      localStorage.setItem('currentUser', JSON.stringify(result.data.user));

      // Show success message
      alert(result.message || 'Registration successful!');

      // Redirect based on selected plan
      if (data.membershipType && data.membershipType !== 'free') {
        window.location.href = `payment.html?plan=${data.membershipType}`;
      } else {
        // Set flag to show disclaimer modal for new users
        sessionStorage.setItem('fastpast_just_logged_in', 'true');
        window.location.href = 'index.html';
      }
    } else {
      alert('Registration failed: ' + result.error);
    }
  } catch (error) {
    console.error('Registration error:', error);
    alert('Registration failed. Please try again.');
  }
}

// Login handler
async function handleLogin(data) {
  const API_URL = '';

  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (response.ok) {
      // Store session token and user info
      localStorage.setItem('sessionToken', result.data.sessionToken);
      localStorage.setItem('currentUser', JSON.stringify(result.data.user));

      // Show success message
      const membership = result.data.user.membershipType.toUpperCase();
      alert(`Welcome back! Logged in as ${result.data.user.username} (${membership})`);

      // Set flag to show disclaimer modal
      sessionStorage.setItem('fastpast_just_logged_in', 'true');

      // Redirect to home page
      window.location.href = 'index.html';
    } else {
      alert('Login failed: ' + result.error);
    }
  } catch (error) {
    console.error('Login error:', error);
    alert('Login failed. Please try again.');
  }
}
