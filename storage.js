/* wealth-course storage helpers — localStorage with in-memory fallback */
(function (global) {
  var PREFIX = "wealth-course:v1:";
  var memory = {};

  function key(name) {
    return PREFIX + name;
  }

  function read(name, fallback) {
    var k = key(name);
    try {
      var raw = global.localStorage.getItem(k);
      if (raw == null) return fallback;
      return JSON.parse(raw);
    } catch (e) {
      if (k in memory) return memory[k];
      return fallback;
    }
  }

  function write(name, value) {
    var k = key(name);
    memory[k] = value;
    try {
      global.localStorage.setItem(k, JSON.stringify(value));
    } catch (e) {
      /* private mode / quota — keep memory only */
    }
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments;
      var self = this;
      clearTimeout(t);
      t = setTimeout(function () {
        fn.apply(self, args);
      }, ms);
    };
  }

  global.WealthStore = {
    read: read,
    write: write,
    debounce: debounce,
  };
})(window);
