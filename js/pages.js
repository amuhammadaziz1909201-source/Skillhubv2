window.App = window.App || {};

App.pages = {
  initLayout: function(opts) {
    opts = opts || {};
    var lang = App.i18n.getLang();
    App.i18n.setLang(lang);
    App.nav.renderSidebar(opts.activePage || '');
    App.nav.renderTopbar(opts.title || '');
    App.nav.init();

    var logoutBtns = document.querySelectorAll('[data-logout]');
    logoutBtns.forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.preventDefault();
        App.auth.logout();
      });
    });
  },

  initAuthPage: function() {
    var lang = App.i18n.getLang();
    App.i18n.setLang(lang);
  },

  initLanding: function() {
    var lang = App.i18n.getLang();
    App.i18n.setLang(lang);
    App.nav._themeToggle();
    App.nav._langSwitch();

    document.querySelectorAll('[data-guest-only]').forEach(function(el) {
      el.style.display = App.auth.isLoggedIn() ? 'none' : '';
    });
    document.querySelectorAll('[data-auth-only]').forEach(function(el) {
      el.style.display = App.auth.isLoggedIn() ? '' : 'none';
    });

    var counters = document.querySelectorAll('[data-counter]');
    counters.forEach(function(el) {
      var target = parseInt(el.getAttribute('data-counter'), 10);
      if (target > 0) {
        var observer = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) {
              App.utils.animateCounter(el, target, 1500);
              observer.unobserve(el);
            }
          });
        }, { threshold: 0.5 });
        observer.observe(el);
      }
    });
  },

  seedDemoData: function() {
    var users = App.db.getUsers();
    if (users.length > 0) return;

    var demoUsers = [
      { id:'u1', firstName:'Alex', lastName:'Rivera', fullName:'Alex Rivera', email:'alex@skillhub.com', password:'Admin@123', avatar:'', bio:'Full-stack developer passionate about clean UI.', role:'admin', skills:['React','Node.js','TypeScript'], links:{github:'alexrivera'}, createdAt:'2025-01-15T10:00:00Z' },
      { id:'u2', firstName:'Muhammad', lastName:'Aziz', fullName:'Muhammad Aziz', email:'aziz@skillhub.com', password:'Aziz@123', avatar:'', bio:'Frontend developer from Tashkent.', role:'user', skills:['HTML','CSS','JavaScript','React'], links:{github:'muhammadaziz'}, createdAt:'2025-03-20T10:00:00Z' },
      { id:'u3', firstName:'Sarah', lastName:'Lee', fullName:'Sarah Lee', email:'sarah@skillhub.com', password:'Sarah@123', avatar:'', bio:'UI/UX Designer & Developer.', role:'user', skills:['Figma','CSS','React'], links:{}, createdAt:'2025-05-10T10:00:00Z' },
    ];
    demoUsers.forEach(function(u) { App.db.saveUser(u); });

    var demoProjects = [
      { id:'p1', title:'Fintech Dashboard', description:'Zamonaviy moliya boshqaruvi interfeysi.', tags:['React','Tailwind','Chart.js'], userId:'u1', views:1200, likes:342, image:'', createdAt:'2025-06-01T10:00:00Z' },
      { id:'p2', title:'E-Commerce Store', description:'Headless e-commerce platform.', tags:['Next.js','Stripe','PostgreSQL'], userId:'u2', views:890, likes:215, image:'', createdAt:'2025-07-15T10:00:00Z' },
      { id:'p3', title:'Analytics Dashboard', description:'Real-time data visualization.', tags:['React','D3.js','Tailwind'], userId:'u3', views:2100, likes:567, image:'', createdAt:'2025-08-20T10:00:00Z' },
    ];
    demoProjects.forEach(function(p) { App.db.saveProject(p); });

    var notifs = [
      { message:'Welcome to SkillHub V2!', type:'info', read:false },
      { message:'Your profile is 80% complete.', type:'warning', read:false },
    ];
    notifs.forEach(function(n) { App.db.addNotification(n); });
  }
};
