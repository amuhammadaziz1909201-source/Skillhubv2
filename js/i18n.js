window.App = window.App || {};

App.i18n = {
  _current: localStorage.getItem('sh_lang') || 'uz',
  _translations: {},

  load: function(lang, translations) {
    this._translations[lang] = translations;
  },

  setLang: function(lang) {
    this._current = lang;
    localStorage.setItem('sh_lang', lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      var attr = el.getAttribute('data-i18n-attr');
      var text = App.t(key);
      if (attr) { el.setAttribute(attr, text); }
      else { el.textContent = text; }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = App.t(el.getAttribute('data-i18n-placeholder'));
    });
  },

  getLang: function() { return this._current; }
};

App.t = function(key, vars) {
  var lang = App.i18n._current;
  var translations = App.i18n._translations[lang] || {};
  var keys = key.split('.');
  var val = translations;
  for (var i = 0; i < keys.length; i++) {
    val = val ? val[keys[i]] : undefined;
  }
  if (val === undefined) {
    var en = App.i18n._translations['en'] || {};
    val = en;
    for (var j = 0; j < keys.length; j++) {
      val = val ? val[keys[j]] : undefined;
    }
  }
  if (val === undefined) return key;
  if (vars) {
    Object.keys(vars).forEach(function(k) {
      val = val.replace(new RegExp('\\{' + k + '\\}', 'g'), vars[k]);
    });
  }
  return val;
};
