window.App = window.App || {};

App.StorageManager = {
  BUCKET: 'site-backups',
  _syncing: false,
  _debounceTimer: null,
  _lastBackup: null,

  init: function() {
    var self = this;
    self._lastBackup = localStorage.getItem('sh_last_backup') || null;
    window.addEventListener('beforeunload', function() {
      self.syncNow();
    });
    self.startAutoSync();
  },

  startAutoSync: function() {
    var self = this;
    setInterval(function() {
      self.syncNow();
    }, 30000);
  },

  debounceSync: function() {
    var self = this;
    clearTimeout(self._debounceTimer);
    self._debounceTimer = setTimeout(function() {
      self.syncNow();
    }, 3000);
  },

  syncNow: async function() {
    if (this._syncing || !App.isSupabase()) return;
    this._syncing = true;
    try {
      var data = await this.collectAllData();
      await this.uploadJSON('backups/site-data.json', data);
      await this.uploadJSON('backups/profiles.json', data.profiles || []);
      await this.uploadJSON('backups/projects.json', data.projects || []);
      await this.uploadJSON('backups/notifications.json', data.notifications || []);
      await this.uploadJSON('backups/comments.json', data.comments || []);
      await this.uploadJSON('backups/likes.json', data.likes || []);
      await this.uploadJSON('backups/follows.json', data.follows || []);
      this._lastBackup = new Date().toISOString();
      localStorage.setItem('sh_last_backup', this._lastBackup);
    } catch (e) {
      console.warn('Storage sync error:', e);
    }
    this._syncing = false;
  },

  collectAllData: async function() {
    var profiles = [], projects = [], notifications = [], comments = [], likes = [], follows = [];
    if (App.isSupabase()) {
      try {
        var pRes = await App.sb.from('profiles').select('*');
        profiles = pRes.data || [];
      } catch (e) { profiles = []; }
      try {
        var prRes = await App.sb.from('projects').select('*');
        projects = prRes.data || [];
      } catch (e) { projects = []; }
      try {
        var nRes = await App.sb.from('notifications').select('*');
        notifications = nRes.data || [];
      } catch (e) { notifications = []; }
      try {
        var cRes = await App.sb.from('comments').select('*');
        comments = cRes.data || [];
      } catch (e) { comments = []; }
      try {
        var lRes = await App.sb.from('project_likes').select('*');
        likes = lRes.data || [];
      } catch (e) { likes = []; }
      try {
        var fRes = await App.sb.from('follows').select('*');
        follows = fRes.data || [];
      } catch (e) { follows = []; }
    } else {
      profiles = App.db._getStore('sh_users');
      projects = App.db._getStore('sh_projects');
      notifications = App.db._getStore('sh_notifications');
    }
    return {
      version: 2,
      timestamp: new Date().toISOString(),
      profiles: profiles,
      projects: projects,
      notifications: notifications,
      comments: comments,
      likes: likes,
      follows: follows
    };
  },

  uploadJSON: async function(path, data) {
    if (!App.isSupabase()) return;
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var file = new File([blob], path.split('/').pop(), { type: 'application/json' });
    var res = await App.sb.storage
      .from(this.BUCKET)
      .upload(path, file, { contentType: 'application/json', upsert: true });
    if (res.error) {
      console.warn('Upload error for', path, res.error);
    }
  },

  downloadJSON: async function(path) {
    if (!App.isSupabase()) return null;
    var res = await App.sb.storage.from(this.BUCKET).download(path);
    if (res.error) return null;
    var text = await res.data.text();
    try { return JSON.parse(text); } catch (e) { return null; }
  },

  restoreAll: async function() {
    var data = await this.downloadJSON('backups/site-data.json');
    if (!data) return { success: false, message: 'Backup topilmadi' };
    var restored = { profiles: 0, projects: 0, notifications: 0, comments: 0, likes: 0, follows: 0 };
    if (data.profiles && data.profiles.length) {
      for (var i = 0; i < data.profiles.length; i++) {
        var p = data.profiles[i];
        await App.sb.from('profiles').upsert({
          id: p.id,
          full_name: p.full_name || p.fullName || '',
          first_name: p.first_name || p.firstName || '',
          last_name: p.last_name || p.lastName || '',
          avatar: p.avatar || '',
          bio: p.bio || '',
          role: p.role || 'user',
          skills: p.skills || [],
          job_role: p.job_role || p.jobRole || '',
          location: p.location || '',
          links: p.links || {}
        }, { onConflict: 'id' });
        restored.profiles++;
      }
    }
    if (data.projects && data.projects.length) {
      for (var j = 0; j < data.projects.length; j++) {
        var pr = data.projects[j];
        await App.sb.from('projects').upsert({
          id: pr.id,
          user_id: pr.user_id || pr.userId,
          title: pr.title || '',
          description: pr.description || '',
          tags: pr.tags || [],
          image: pr.image || '',
          project_url: pr.project_url || pr.projectUrl || '',
          views: pr.views || 0,
          likes: pr.likes || 0
        }, { onConflict: 'id' });
        restored.projects++;
      }
    }
    if (data.comments && data.comments.length) {
      for (var k = 0; k < data.comments.length; k++) {
        var c = data.comments[k];
        await App.sb.from('comments').upsert({
          id: c.id,
          project_id: c.project_id || c.projectId,
          user_id: c.user_id || c.userId,
          content: c.content || ''
        }, { onConflict: 'id' });
        restored.comments++;
      }
    }
    if (data.notifications && data.notifications.length) {
      for (var l = 0; l < data.notifications.length; l++) {
        var n = data.notifications[l];
        await App.sb.from('notifications').insert({
          user_id: n.user_id || n.userId,
          message: n.message || '',
          type: n.type || 'info',
          read: n.read || false
        });
        restored.notifications++;
      }
    }
    return { success: true, message: 'Restore muvaffaqiyatli!', restored: restored };
  },

  getBackupInfo: async function() {
    if (!App.isSupabase()) return null;
    var res = await App.sb.storage.from(this.BUCKET).list('backups');
    if (res.error) return null;
    var files = res.data || [];
    var info = [];
    for (var i = 0; i < files.length; i++) {
      var meta = await App.sb.storage.from(this.BUCKET).getPublicUrl('backups/' + files[i].name);
      info.push({
        name: files[i].name,
        size: files[i].metadata ? files[i].metadata.size : 0,
        created: files[i].created_at,
        url: meta.data ? meta.data.publicUrl : ''
      });
    }
    return info;
  }
};
