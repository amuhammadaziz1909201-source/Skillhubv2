window.App = window.App || {};

App.toast = function(message, type) {
  type = type || 'info';
  var existing = document.querySelector('.toast');
  if (existing) existing.remove();

  var toast = document.createElement('div');
  toast.className = 'toast toast-' + type;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(function() {
    toast.classList.add('show');
  });

  setTimeout(function() {
    toast.classList.remove('show');
    setTimeout(function() { toast.remove(); }, 300);
  }, 3000);
};

App.modal = {
  show: function(id) {
    var overlay = document.getElementById(id);
    if (overlay) overlay.classList.add('active');
  },
  hide: function(id) {
    var overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('active');
  },
  confirm: function(message, onConfirm) {
    var id = 'confirm-' + Date.now();
    var overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.id = id;
    overlay.innerHTML = '<div class="modal">' +
      '<h3 style="margin-bottom:var(--space-4)">' + App.utils.sanitize(message) + '</h3>' +
      '<div class="flex gap-3" style="justify-content:flex-end">' +
      '<button class="btn btn-secondary" data-action="cancel">' + App.t('common.cancel') + '</button>' +
      '<button class="btn btn-danger" data-action="confirm">' + App.t('common.confirm') + '</button>' +
      '</div></div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function() { overlay.classList.add('active'); });

    overlay.querySelector('[data-action="cancel"]').addEventListener('click', function() {
      App.modal.hide(id);
      setTimeout(function() { overlay.remove(); }, 300);
    });
    overlay.querySelector('[data-action="confirm"]').addEventListener('click', function() {
      App.modal.hide(id);
      setTimeout(function() { overlay.remove(); }, 300);
      if (onConfirm) onConfirm();
    });
  }
};

App.loading = {
  show: function(el) {
    if (!el) el = document.body;
    var spinner = document.createElement('div');
    spinner.className = 'app-loading';
    spinner.style.cssText = 'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:var(--bg);z-index:9999';
    spinner.innerHTML = '<div class="spinner spinner-lg"></div>';
    el.appendChild(spinner);
  },
  hide: function() {
    var el = document.querySelector('.app-loading');
    if (el) el.remove();
  }
};
