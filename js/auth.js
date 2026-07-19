window.App = window.App || {};

App.auth = {
  getCurrentUser: function() {
    var data = localStorage.getItem('sh_current_user');
    if (!data) return null;
    try { return JSON.parse(data); } catch(e) { return null; }
  },

  setCurrentUser: function(user) {
    localStorage.setItem('sh_current_user', JSON.stringify(user));
    localStorage.setItem('sh_logged_in', 'true');
    this._updateNav();
  },

  isLoggedIn: function() {
    return localStorage.getItem('sh_logged_in') === 'true' && this.getCurrentUser() !== null;
  },

  login: function(email, password) {
    if (!email || !password) return { error: App.t('auth.email_required') };

    var user = App.db.findUser(email);
    if (!user) return { error: App.t('auth.user_not_found') };
    if (user.password !== password) return { error: App.t('auth.wrong_password') };

    this.setCurrentUser(user);
    App.toast(App.t('auth.login_success'), 'success');
    return { user: user };
  },

  register: function(data) {
    if (!data.fullName || !data.email || !data.password) {
      return { error: App.t('auth.fill_all') };
    }
    if (data.password.length < 8) return { error: App.t('auth.password_short') };
    if (!/[a-zA-Z]/.test(data.password)) return { error: App.t('auth.password_letter') };
    if (!/[^a-zA-Z0-9]/.test(data.password)) return { error: App.t('auth.password_symbol') };

    var existing = App.db.findUser(data.email);
    if (existing) return { error: App.t('auth.email_exists') };

    var parts = data.fullName.trim().split(' ');
    var user = {
      id: 'u_' + Date.now(),
      firstName: parts[0] || '',
      lastName: parts.slice(1).join(' ') || '',
      fullName: data.fullName.trim(),
      email: data.email,
      password: data.password,
      avatar: '',
      bio: '',
      role: 'user',
      skills: [],
      links: {},
      createdAt: new Date().toISOString()
    };

    App.db.saveUser(user);
    App.toast(App.t('auth.register_success'), 'success');
    return { user: user };
  },

  logout: function() {
    localStorage.removeItem('sh_current_user');
    localStorage.removeItem('sh_logged_in');
    App.toast(App.t('auth.logout_success'));
    window.location.href = '../pages/auth/login.html';
  },

  updateProfile: function(updates) {
    var user = this.getCurrentUser();
    if (!user) return false;
    Object.assign(user, updates);
    App.db.saveUser(user);
    this.setCurrentUser(user);
    return true;
  },

  isAdmin: function() {
    var user = this.getCurrentUser();
    return user && user.role === 'admin';
  },

  requireAuth: function() {
    if (!this.isLoggedIn()) {
      window.location.href = '../pages/auth/login.html';
      return false;
    }
    return true;
  },

  requireAdmin: function() {
    if (!this.isLoggedIn()) {
      window.location.href = '../pages/auth/login.html';
      return false;
    }
    if (!this.isAdmin()) {
      window.location.href = '../pages/main/dashboard.html';
      App.toast(App.t('admin.no_permission'), 'error');
      return false;
    }
    return true;
  },

  _updateNav: function() {
    var user = this.getCurrentUser();
    document.querySelectorAll('[data-auth-name]').forEach(function(el) {
      el.textContent = user ? user.fullName : '';
    });
    document.querySelectorAll('[data-auth-avatar]').forEach(function(el) {
      if (user && user.avatar) { el.src = user.avatar; }
      else if (el.tagName === 'DIV' || el.tagName === 'SPAN') {
        el.textContent = user ? user.firstName.charAt(0) : '';
      }
    });
    document.querySelectorAll('[data-auth-only]').forEach(function(el) {
      el.style.display = App.auth.isLoggedIn() ? '' : 'none';
    });
    document.querySelectorAll('[data-guest-only]').forEach(function(el) {
      el.style.display = App.auth.isLoggedIn() ? 'none' : '';
    });
    document.querySelectorAll('[data-admin-only]').forEach(function(el) {
      el.style.display = App.auth.isAdmin() ? '' : 'none';
    });
  }
};
