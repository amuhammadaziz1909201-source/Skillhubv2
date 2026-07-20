window.App = window.App || {};

App.auth = {
  _sessionUser: null,
  _listeners: [],

  onAuthChange: function(cb) { this._listeners.push(cb); },
  _emit: function(user) { this._listeners.forEach(function(cb) { cb(user); }); },

  getCurrentUser: function() {
    if (this._sessionUser) return this._sessionUser;
    var data = localStorage.getItem('sh_current_user');
    if (!data) return null;
    try { return JSON.parse(data); } catch(e) { return null; }
  },

  setCurrentUser: function(user) {
    this._sessionUser = user;
    localStorage.setItem('sh_current_user', JSON.stringify(user));
    localStorage.setItem('sh_logged_in', 'true');
    this._updateNav();
    this._emit(user);
  },

  isLoggedIn: function() {
    return localStorage.getItem('sh_logged_in') === 'true' && this.getCurrentUser() !== null;
  },

  init: function() {
    var self = this;
    if (App.isSupabase()) {
      App.sb.auth.getSession().then(function(res) {
        var session = res.data.session;
        if (session && session.user) {
          self._syncSupabaseUser(session.user);
        }
      });
      App.sb.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' && session) {
          self._syncSupabaseUser(session.user);
        } else if (event === 'SIGNED_OUT') {
          self._clearLocal();
        }
      });
    }
  },

  _syncSupabaseUser: async function(sbUser) {
    var meta = sbUser.user_metadata || {};

    if (App.isSupabase()) {
      var res = await App.sb.from('profiles').select('*').eq('id', sbUser.id).single();
      if (res.data) {
        var user = {
          id: res.data.id,
          email: sbUser.email || '',
          fullName: res.data.full_name || sbUser.email || '',
          firstName: res.data.first_name || '',
          lastName: res.data.last_name || '',
          avatar: res.data.avatar || '',
          bio: res.data.bio || '',
          role: res.data.role || 'user',
          skills: res.data.skills || [],
          links: res.data.links || {},
          createdAt: res.data.created_at || new Date().toISOString()
        };
        this.setCurrentUser(user);
        return;
      }
    }

    var user = {
      id: sbUser.id,
      email: sbUser.email || '',
      fullName: meta.full_name || sbUser.email || '',
      firstName: meta.first_name || (meta.full_name || '').split(' ')[0] || '',
      lastName: (meta.full_name || '').split(' ').slice(1).join(' ') || '',
      avatar: meta.avatar || '',
      bio: meta.bio || '',
      role: meta.role || 'user',
      skills: meta.skills || [],
      links: meta.links || {},
      createdAt: sbUser.created_at || new Date().toISOString()
    };
    this.setCurrentUser(user);
  },

  _clearLocal: function() {
    this._sessionUser = null;
    localStorage.removeItem('sh_current_user');
    localStorage.removeItem('sh_logged_in');
    this._updateNav();
    this._emit(null);
  },

  register: async function(data) {
    if (!data.fullName || !data.email || !data.password) {
      return { error: App.t('auth.error.fill_all') };
    }
    if (data.password.length < 8) return { error: App.t('auth.error.password_short') };
    if (!/[a-zA-Z]/.test(data.password)) return { error: App.t('auth.error.password_letter') };
    if (!/[^a-zA-Z0-9]/.test(data.password)) return { error: App.t('auth.error.password_symbol') };

    if (App.isSupabase()) {
      var parts = data.fullName.trim().split(' ');
      var result = await App.sb.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName.trim(),
            first_name: parts[0] || '',
            last_name: parts.slice(1).join(' ') || '',
            avatar: '',
            bio: '',
            role: 'user',
            skills: [],
            links: {}
          }
        }
      });
      if (result.error) return { error: result.error.message };
      return { user: result.data.user, needsVerification: !result.data.session };
    }

    var existing = App.db.findUser(data.email);
    if (existing) return { error: App.t('auth.error.email_exists') };

    var nameParts = data.fullName.trim().split(' ');
    var user = {
      id: 'u_' + Date.now(),
      firstName: nameParts[0] || '',
      lastName: nameParts.slice(1).join(' ') || '',
      fullName: data.fullName.trim(),
      email: data.email,
      password: data.password,
      avatar: '', bio: '', role: 'user', skills: [], links: {},
      createdAt: new Date().toISOString()
    };
    App.db.saveUser(user);
    this.setCurrentUser(user);
    return { user: user, needsVerification: false };
  },

  login: async function(email, password) {
    if (!email || !password) return { error: App.t('auth.error.email_required') };

    if (App.isSupabase()) {
      var result = await App.sb.auth.signInWithPassword({ email: email, password: password });
      if (result.error) {
        var msg = result.error.message;
        if (msg.includes('Invalid login')) return { error: App.t('auth.error.wrong_password') };
        if (msg.includes('Email not confirmed')) return { error: App.t('auth.error.email_not_confirmed') };
        return { error: msg };
      }
      return { user: result.data.user };
    }

    var user = App.db.findUser(email);
    if (!user) return { error: App.t('auth.error.user_not_found') };
    if (user.password !== password) return { error: App.t('auth.error.wrong_password') };
    this.setCurrentUser(user);
    App.toast(App.t('auth.login_success'), 'success');
    return { user: user };
  },

  logout: async function() {
    if (App.isSupabase()) {
      await App.sb.auth.signOut();
    }
    this._clearLocal();
    App.toast(App.t('auth.logout_success'));
    window.location.href = '../../index.html';
  },

  updateProfile: async function(updates) {
    var user = this.getCurrentUser();
    if (!user) return false;

    if (App.isSupabase()) {
      var dbUpdates = {};
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
      if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
      if (updates.avatar !== undefined) dbUpdates.avatar = updates.avatar;
      if (updates.bio !== undefined) dbUpdates.bio = updates.bio;
      if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
      if (updates.links !== undefined) dbUpdates.links = updates.links;

      var res = await App.sb.from('profiles').update(dbUpdates).eq('id', user.id);
      if (res.error) return false;

      await App.sb.auth.updateUser({ data: updates });
    }
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
      var path = window.location.pathname;
      var loginPath = path.indexOf('/pages/main/') !== -1 || path.indexOf('/pages/settings/') !== -1 || path.indexOf('/pages/admin/') !== -1
        ? '../auth/login.html' : 'login.html';
      if (path.indexOf('/pages/auth/') !== -1) loginPath = 'login.html';
      window.location.href = loginPath;
      return false;
    }
    return true;
  },

  requireAdmin: function() {
    if (!this.requireAuth()) return false;
    if (!this.isAdmin()) {
      window.location.href = '../main/dashboard.html';
      App.toast(App.t('admin.no_permission'), 'error');
      return false;
    }
    return true;
  },

  _updateNav: function() {
    var user = this.getCurrentUser();
    document.querySelectorAll('[data-auth-name]').forEach(function(el) { el.textContent = user ? user.fullName : ''; });
    document.querySelectorAll('[data-auth-avatar]').forEach(function(el) {
      if (user && user.avatar) { el.src = user.avatar; }
      else if (el.tagName === 'DIV' || el.tagName === 'SPAN') { el.textContent = user ? user.firstName.charAt(0) : ''; }
    });
    document.querySelectorAll('[data-auth-only]').forEach(function(el) { el.style.display = App.auth.isLoggedIn() ? '' : 'none'; });
    document.querySelectorAll('[data-guest-only]').forEach(function(el) { el.style.display = App.auth.isLoggedIn() ? 'none' : ''; });
    document.querySelectorAll('[data-admin-only]').forEach(function(el) { el.style.display = App.auth.isAdmin() ? '' : 'none'; });
  }
};
