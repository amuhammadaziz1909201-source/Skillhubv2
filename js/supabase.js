window.App = window.App || {};

App.SUPABASE_URL = 'https://xcsklgfavfftbwyopzhz.supabase.co';
App.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhjc2tsZ2ZhdmZmdGJ3eW9wemh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ0OTExOTgsImV4cCI6MjEwMDA2NzE5OH0.DoNd6AkSLBBvanb4s1xWSVcpr8t1xQO6owfh4_kBJDQ';

App.sb = null;

App.initSupabase = function() {
  if (typeof supabase !== 'undefined' && App.SUPABASE_URL.indexOf('YOUR_PROJECT') === -1) {
    App.sb = supabase.createClient(App.SUPABASE_URL, App.SUPABASE_ANON_KEY);
  }
  return App.sb;
};

App.isSupabase = function() {
  return App.sb !== null;
};

// ==================== PROFILES ====================
App.db = {
  getProfiles: async function() {
    if (App.isSupabase()) {
      var res = await App.sb.from('profiles').select('*');
      return res.data || [];
    }
    return this._getStore('sh_users');
  },

  findProfileById: async function(id) {
    if (App.isSupabase()) {
      var res = await App.sb.from('profiles').select('*').eq('id', id).single();
      return res.data || null;
    }
    return this.getUsers().find(function(u) { return u.id === id; }) || null;
  },

  findProfileByEmail: async function(email) {
    if (App.isSupabase()) {
      var res = await App.sb.from('profiles').select('*').eq('email', email).single();
      return res.data || null;
    }
    return this.getUsers().find(function(u) { return u.email === email; }) || null;
  },

  saveProfile: async function(profile) {
    if (App.isSupabase()) {
      var res = await App.sb.from('profiles').upsert(profile, { onConflict: 'id' });
      return res.error ? null : profile;
    }
    var users = this.getUsers();
    var idx = users.findIndex(function(u) { return u.email === profile.email; });
    if (idx >= 0) { users[idx] = profile; } else { users.push(profile); }
    this._setStore('sh_users', users);
    return profile;
  },

  updateProfile: async function(id, updates) {
    if (App.isSupabase()) {
      var res = await App.sb.from('profiles').update(updates).eq('id', id);
      return !res.error;
    }
    var users = this.getUsers();
    var u = users.find(function(x) { return x.id === id; });
    if (u) { Object.assign(u, updates); this._setStore('sh_users', users); }
    return true;
  },

  deleteProfile: async function(id) {
    if (App.isSupabase()) {
      var res = await App.sb.from('profiles').delete().eq('id', id);
      return !res.error;
    }
    var users = this.getUsers().filter(function(u) { return u.id !== id; });
    this._setStore('sh_users', users);
    return true;
  },

  // ==================== PROJECTS ====================
  getAllProjects: async function() {
    if (App.isSupabase()) {
      var res = await App.sb.from('projects').select('*').order('created_at', { ascending: false });
      return (res.data || []).map(function(p) {
        return {
          id: p.id, userId: p.user_id, title: p.title, description: p.description,
          tags: p.tags || [], image: p.image, projectUrl: p.project_url,
          views: p.views || 0, likes: p.likes || 0,
          createdAt: p.created_at, updatedAt: p.updated_at
        };
      });
    }
    return this._getStore('sh_projects');
  },

  getProjectsByUser: async function(userId) {
    if (App.isSupabase()) {
      var res = await App.sb.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (res.data || []).map(function(p) {
        return {
          id: p.id, userId: p.user_id, title: p.title, description: p.description,
          tags: p.tags || [], image: p.image, projectUrl: p.project_url,
          views: p.views || 0, likes: p.likes || 0,
          createdAt: p.created_at, updatedAt: p.updated_at
        };
      });
    }
    return this.getProjects().filter(function(p) { return p.userId === userId; });
  },

  getProjects: function() {
    return this._getStore('sh_projects');
  },

  saveProject: async function(project) {
    if (App.isSupabase()) {
      var sbProject = {
        title: project.title,
        description: project.description || '',
        tags: project.tags || [],
        image: project.image || '',
        project_url: project.projectUrl || '',
        user_id: project.userId,
        views: project.views || 0,
        likes: project.likes || 0
      };
      if (project.id) sbProject.id = project.id;
      var res = await App.sb.from('projects').upsert(sbProject, { onConflict: 'id' });
      if (res.error) return null;
      var saved = res.data ? res.data[0] : sbProject;
      return {
        id: saved.id, userId: saved.user_id, title: saved.title, description: saved.description,
        tags: saved.tags || [], image: saved.image, projectUrl: saved.project_url,
        views: saved.views || 0, likes: saved.likes || 0,
        createdAt: saved.created_at, updatedAt: saved.updated_at
      };
    }
    var projects = this.getProjects();
    if (!project.id) project.id = 'p_' + Date.now();
    var idx = projects.findIndex(function(p) { return p.id === project.id; });
    if (idx >= 0) { projects[idx] = project; } else { projects.push(project); }
    this._setStore('sh_projects', projects);
    return project;
  },

  deleteProject: async function(id) {
    if (App.isSupabase()) {
      var res = await App.sb.from('projects').delete().eq('id', id);
      return !res.error;
    }
    var projects = this.getProjects().filter(function(p) { return p.id !== id; });
    this._setStore('sh_projects', projects);
    return true;
  },

  incrementViews: async function(id) {
    if (App.isSupabase()) {
      var current = await App.sb.from('projects').select('views').eq('id', id).single();
      if (current.data) {
        await App.sb.from('projects').update({ views: (current.data.views || 0) + 1 }).eq('id', id);
      }
      return;
    }
    var projects = this.getProjects();
    var p = projects.find(function(x) { return x.id === id; });
    if (p) { p.views = (p.views || 0) + 1; this._setStore('sh_projects', projects); }
  },

  // ==================== NOTIFICATIONS ====================
  getNotifications: async function(userId) {
    if (App.isSupabase()) {
      if (!userId) {
        var user = App.auth.getCurrentUser();
        userId = user ? user.id : null;
      }
      if (!userId) return [];
      var res = await App.sb.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      return (res.data || []).map(function(n) {
        return { id: n.id, userId: n.user_id, message: n.message, type: n.type, read: n.read, createdAt: n.created_at };
      });
    }
    return this._getStore('sh_notifications');
  },

  addNotification: async function(notification, userId) {
    if (App.isSupabase()) {
      if (!userId) {
        var user = App.auth.getCurrentUser();
        userId = user ? user.id : null;
      }
      if (!userId) return null;
      var res = await App.sb.from('notifications').insert({
        user_id: userId,
        message: notification.message,
        type: notification.type || 'info',
        read: false
      }).select().single();
      if (res.error) return null;
      return { id: res.data.id, userId: res.data.user_id, message: res.data.message, type: res.data.type, read: res.data.read, createdAt: res.data.created_at };
    }
    var list = this._getStore('sh_notifications');
    var n = { id: 'n_' + Date.now(), message: notification.message, type: notification.type || 'info', read: false, createdAt: new Date().toISOString() };
    list.unshift(n);
    this._setStore('sh_notifications', list);
    return n;
  },

  markNotificationRead: async function(id) {
    if (App.isSupabase()) {
      await App.sb.from('notifications').update({ read: true }).eq('id', id);
      return;
    }
    var list = this._getStore('sh_notifications');
    var n = list.find(function(x) { return x.id === id; });
    if (n) { n.read = true; this._setStore('sh_notifications', list); }
  },

  markAllNotificationsRead: async function() {
    if (App.isSupabase()) {
      var user = App.auth.getCurrentUser();
      if (!user) return;
      await App.sb.from('notifications').update({ read: true }).eq('user_id', user.id).eq('read', false);
      return;
    }
    var list = this._getStore('sh_notifications');
    list.forEach(function(n) { n.read = true; });
    this._setStore('sh_notifications', list);
  },

  clearNotifications: async function() {
    if (App.isSupabase()) {
      var user = App.auth.getCurrentUser();
      if (!user) return;
      await App.sb.from('notifications').delete().eq('user_id', user.id);
      return;
    }
    this._setStore('sh_notifications', []);
  },

  // ==================== SETTINGS (localStorage only) ====================
  getSettings: function() { return this._getObj('sh_settings'); },
  saveSettings: function(s) { this._setStore('sh_settings', s); },

  // ==================== HELPERS ====================
  _getStore: function(name) {
    try { return JSON.parse(localStorage.getItem(name) || '[]'); } catch(e) { return []; }
  },
  _setStore: function(name, data) { localStorage.setItem(name, JSON.stringify(data)); },
  _getObj: function(name) {
    try { return JSON.parse(localStorage.getItem(name) || '{}'); } catch(e) { return {}; }
  },

  // Legacy compat — map old sync calls to async
  getUsers: function() { return this._getStore('sh_users'); },
  saveUser: function(user) {
    var users = this.getUsers();
    var idx = users.findIndex(function(u) { return u.email === user.email; });
    if (idx >= 0) { users[idx] = user; } else { users.push(user); }
    this._setStore('sh_users', users);
  },
  findUser: function(email) {
    return this.getUsers().find(function(u) { return u.email === email; }) || null;
  },
  findUserById: function(id) {
    return this.getUsers().find(function(u) { return u.id === id; }) || null;
  }
};
