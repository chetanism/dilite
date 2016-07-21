/* eslint-disable no-param-reassign, no-unused-expressions */
class Dilite {
  factories = new Map;
  services = new Map;
  dilites = [];

  factory = (name, factory) => {
    if (this.factories.has(name)) throw new Error(`${name} is already registered.`);
    return this.factories.set(name, factory) && this;
  };

  service = (name, content) => this.factory(name, () => content);

  provider = (name, provider) => this.factory(name, provider());

  add = (dilite) =>
    this.dilites.push(dilite) && (dilite.get = (name) => this.get(name));

  get = (name) => {
    let content = this.services.get(name);

    if (!content) {
      const dilite = this.find(name);
      content = dilite && dilite.factories.get(name)(this.get, this);
      content && this.services.set(name, content);
    }

    return content;
  };

  find = (name) => ((this.factories.has(name)) ? this : this.dilites.reduce(
    (found, d) => found || d.find(name), null)
  );
}

export default Dilite;
