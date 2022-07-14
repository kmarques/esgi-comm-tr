export default function HandleAwareObject() {
  const handlers = {};

  this.addHandler = function (name, handler) {
    handlers[name] = name.startsWith("on") ? handler : handler(this);
  };

  this.removeHandler = function (name) {
    if (!name.startsWith("on")) {
      handlers[name]();
    }
    delete handlers[name];
  };

  this.getHandler = function (name) {
    return handlers[name];
  };
}
