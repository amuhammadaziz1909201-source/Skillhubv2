window.App = window.App || {};

App.nav = {
  init: function() {
    this._highlight();
    this._sidebarToggle();
    this._searchFocus();
    this._dropdowns();
    this._themeToggle();
    this._langSwitch();
    App.auth._updateNav();
  },

  _highlight: function() {
    var path = window.location.pathname;
    document.querySelectorAll('.sidebar-link').forEach(function(link) {
      link.classList.remove('active');
      var href = link.getAttribute('href');
      if (href && path.indexOf(href.replace('.html', '')) !== -1) {
        link.classList.add('active');
      }
    });
  },

  _sidebarToggle: function() {
    var btn = document.querySelector('.mobile-menu-btn');
    var sidebar = document.querySelector('.sidebar');
    var overlay = document.querySelector('.sidebar-overlay');
    if (!btn || !sidebar) return;
    btn.addEventListener('click', function() {
      sidebar.classList.toggle('open');
      if (overlay) overlay.classList.toggle('active');
    });
    if (overlay) {
      overlay.addEventListener('click', function() {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },

  _searchFocus: function() {
    var input = document.querySelector('.topbar-search input');
    if (!input) return;
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); input.focus(); }
      if (e.key === 'Escape') input.blur();
    });
  },

  _dropdowns: function() {
    document.querySelectorAll('.dropdown').forEach(function(dd) {
      var trigger = dd.querySelector('[data-dropdown]');
      if (!trigger) return;
      trigger.addEventListener('click', function(e) { e.stopPropagation(); dd.classList.toggle('active'); });
    });
    document.addEventListener('click', function() {
      document.querySelectorAll('.dropdown.active').forEach(function(dd) { dd.classList.remove('active'); });
    });
  },

  _themeToggle: function() {
    var settings = App.db.getSettings();
    var theme = settings.theme || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('[data-theme-toggle]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        var s = App.db.getSettings();
        s.theme = next;
        App.db.saveSettings(s);
      });
    });
  },

  _langSwitch: function() {
    document.querySelectorAll('[data-lang]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var lang = this.getAttribute('data-lang');
        App.i18n.setLang(lang);
        var s = App.db.getSettings();
        s.language = lang;
        App.db.saveSettings(s);
      });
    });
  },

  renderSidebar: function(activePage, notifCount) {
    var user = App.auth.getCurrentUser();
    var isAdmin = App.auth.isAdmin();
    notifCount = notifCount || 0;

    var mainLinks = [
      { href: '../main/dashboard.html', icon: '<i class="fas fa-gauge-high"></i>', label: App.t('nav.dashboard'), key: 'dashboard' },
      { href: '../main/portfolio.html', icon: '<i class="fas fa-folder"></i>', label: App.t('nav.portfolio'), key: 'portfolio' },
      { href: '../main/community.html', icon: '<i class="fas fa-users"></i>', label: App.t('nav.community'), key: 'community' },
      { href: '../main/search.html', icon: '<i class="fas fa-magnifying-glass"></i>', label: App.t('nav.search'), key: 'search' },
    ];
    var accountLinks = [
      { href: '../main/profile.html', icon: '<i class="fas fa-user"></i>', label: App.t('nav.profile'), key: 'profile' },
      { href: '../settings/settings.html', icon: '<i class="fas fa-gear"></i>', label: App.t('nav.settings'), key: 'settings' },
      { href: '../settings/notifications.html', icon: '<i class="fas fa-bell"></i>', label: App.t('nav.notifications'), key: 'notifications', badge: notifCount || '' },
    ];
    var adminLinks = [
      { href: '../admin/admin.html', icon: '<i class="fas fa-shield-halved"></i>', label: App.t('nav.admin'), key: 'admin' },
    ];

    var html = '<div class="sidebar-header"><h2><span style="color:var(--primary)">SkillHub</span> <span class="badge badge-primary">BETA</span></h2><p>' + App.t('nav.manage') + '</p></div>';
    html += '<nav class="sidebar-nav">';
    html += '<div class="sidebar-section"><div class="sidebar-section-title">' + App.t('nav.main') + '</div>';
    mainLinks.forEach(function(l) {
      html += '<a href="' + l.href + '" class="sidebar-link' + (activePage === l.key ? ' active' : '') + '">';
      html += '<span class="icon">' + l.icon + '</span><span>' + l.label + '</span>';
      html += '</a>';
    });
    html += '</div><div class="sidebar-section"><div class="sidebar-section-title">' + App.t('nav.account') + '</div>';
    accountLinks.forEach(function(l) {
      html += '<a href="' + l.href + '" class="sidebar-link' + (activePage === l.key ? ' active' : '') + '">';
      html += '<span class="icon">' + l.icon + '</span><span>' + l.label + '</span>';
      if (l.badge) html += '<span class="badge">' + l.badge + '</span>';
      html += '</a>';
    });
    if (isAdmin) {
      adminLinks.forEach(function(l) {
        html += '<a href="' + l.href + '" class="sidebar-link' + (activePage === l.key ? ' active' : '') + '">';
        html += '<span class="icon">' + l.icon + '</span><span>' + l.label + '</span></a>';
      });
    }
    html += '</div></nav>';

    html += '<div class="sidebar-footer"><div class="sidebar-user">';
    if (user && user.avatar) {
      html += '<div class="avatar"><img src="' + user.avatar + '" alt=""></div>';
    } else {
      html += '<div class="avatar">' + (user ? App.utils.getInitials(user.fullName) : '?') + '</div>';
    }
    html += '<div class="info"><div class="name">' + (user ? App.utils.sanitize(user.fullName) : 'Guest') + '</div>';
    html += '<div class="email">' + (user ? App.utils.sanitize(user.email) : '') + '</div></div>';
    html += '<button class="btn btn-ghost btn-sm" style="color:var(--danger);margin-left:auto" onclick="App.auth.logout()" title="Logout"><i class="fas fa-right-from-bracket" style="font-size:18px"></i></button>';
    html += '</div></div>';

    var sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.innerHTML = html;
  },

  renderTopbar: function(title) {
    var user = App.auth.getCurrentUser();

    var html = '<div class="topbar-left">';
    html += '<button class="mobile-menu-btn btn-icon"><i class="fas fa-bars"></i></button>';
    html += '<h4>' + (title || '') + '</h4></div>';
    html += '<div class="topbar-right">';
    html += '<div class="topbar-search"><i class="fas fa-magnifying-glass" style="font-size:18px"></i>';
    html += '<input type="text" placeholder="' + App.t('nav.search_placeholder') + ' (Ctrl+K)"></div>';
    html += '<button class="btn-icon btn-ghost" data-theme-toggle title="' + App.t('nav.toggle_theme') + '"><i class="fas fa-moon"></i></button>';
    html += '<a href="../settings/notifications.html" class="btn-icon btn-ghost" style="position:relative"><i class="fas fa-bell"></i>';
    html += '</a>';
    html += '<div class="dropdown"><button class="btn-icon btn-ghost" data-dropdown><i class="fas fa-circle-user"></i></button>';
    html += '<div class="dropdown-menu">';
    html += '<a href="../main/profile.html" class="dropdown-item"><i class="fas fa-user"></i>' + App.t('nav.profile') + '</a>';
    html += '<a href="../settings/settings.html" class="dropdown-item"><i class="fas fa-gear"></i>' + App.t('nav.settings') + '</a>';
    html += '<div class="dropdown-divider"></div>';
    html += '<button class="dropdown-item" onclick="App.auth.logout()" style="color:var(--danger)"><i class="fas fa-right-from-bracket"></i>' + App.t('nav.logout') + '</button>';
    html += '</div></div></div>';

    var topbar = document.querySelector('.topbar');
    if (topbar) topbar.innerHTML = html;
    this._dropdowns();
    this._themeToggle();
  }
};
