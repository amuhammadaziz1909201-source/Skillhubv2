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

App.db = {
  _getStore: function(name) {
    try { return JSON.parse(localStorage.getItem(name) || '[]'); } catch(e) { return []; }
  },
  _setStore: function(name, data) { localStorage.setItem(name, JSON.stringify(data)); },
  _getObj: function(name) {
    try { return JSON.parse(localStorage.getItem(name) || '{}'); } catch(e) { return {}; }
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
  getAllProjects: function() { return this.getProjects(); },
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
  saveSettings: function(s) { this._setStore('sh_settings', s); },

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
