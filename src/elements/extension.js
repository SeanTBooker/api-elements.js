export default function (namespace) {
  class Extension extends namespace.BaseElement {
    constructor(...args) {
      super(...args);
      this.element = 'extension';
    }

    get profile() {
      return this.links
        .filter(link => link.relation.toValue() === 'profile')
        .map(link => link.href)
        .shift();
    }
  }

  namespace.register('extension', Extension);
}
