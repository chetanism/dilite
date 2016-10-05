/* eslint-disable no-param-reassign, no-unused-expressions */
class Dilite {
  factories = new Map;
  services = new Map;
  dilites = [];
  onCreateCallbacks = new Map;

  factory = (name, factory) => {
    if (this.factories.has(name)) throw new Error(`${name} is already registered.`);
    return this.factories.set(name, factory) && this;
  };

  service = (name, content) => this.factory(name, () => content);

  provider = (name, provider) => this.factory(name, provider());

  onCreate = (name, func) => {
    this.onCreateCallbacks.get(name) ? this.onCreateCallbacks.get(name).push(func) :
      this.onCreateCallbacks.set(name, [func]);
  };

  add = (dilite) => this.dilites.push(dilite) && (dilite.get = (name) => this.get(name));

  get = (name) => {
    let content = this.services.get(name);

    if (!content) {
      const dilite = this.find(name);
      content = dilite && dilite.factories.get(name)(this.get);
      content && this.services.set(name, content) && this.services.set(
        name, content = this.findOnCreates(name).reduce(
          (c, f) => f(c, this.get) || c,
          content
        ));
    }

    return content;
  };

  find = (name) => ((this.factories.has(name)) ? this : this.dilites.reduce(
      (found, d) => found || d.find(name), null)
  );

  findOnCreates = (name) => [
    ...(this.onCreateCallbacks.get(name) || []),
    ...this.dilites.reduce((onCreates, d) => [...onCreates, ...d.findOnCreates(name)], []),
  ];
}

export default Dilite;
