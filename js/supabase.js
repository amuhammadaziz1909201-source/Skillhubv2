window.App = window.App || {};

App.SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
App.SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

App.supabaseClient = null;

App.initSupabase = function() {
  if (typeof supabase !== 'undefined' && App.SUPABASE_URL.indexOf('YOUR_PROJECT') === -1) {
    App.supabaseClient = supabase.createClient(App.SUPABASE_URL, App.SUPABASE_ANON_KEY);
  }
  return App.supabaseClient;
};

App.db = {
  _getStore: function(name) {
    try { return JSON.parse(localStorage.getItem(name) || '[]'); }
    catch(e) { return []; }
  },
  _setStore: function(name, data) {
    localStorage.setItem(name, JSON.stringify(data));
  },
  _getObj: function(name) {
    try { return JSON.parse(localStorage.getItem(name) || '{}'); }
    catch(e) { return {}; }
  },

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

  getProjects: function() { return this._getStore('sh_projects'); },
  saveProject: function(project) {
    var projects = this.getProjects();
    if (!project.id) project.id = 'p_' + Date.now();
    var idx = projects.findIndex(function(p) { return p.id === project.id; });
    if (idx >= 0) { projects[idx] = project; } else { projects.push(project); }
    this._setStore('sh_projects', projects);
    return project;
  },
  deleteProject: function(id) {
    var projects = this.getProjects().filter(function(p) { return p.id !== id; });
    this._setStore('sh_projects', projects);
  },

  getSettings: function() { return this._getObj('sh_settings'); },
  saveSettings: function(settings) { this._setStore('sh_settings', settings); },

  getNotifications: function() { return this._getStore('sh_notifications'); },
  addNotification: function(n) {
    var list = this.getNotifications();
    n.id = 'n_' + Date.now();
    n.read = false;
    n.createdAt = new Date().toISOString();
    list.unshift(n);
    this._setStore('sh_notifications', list);
    return n;
  }
};
