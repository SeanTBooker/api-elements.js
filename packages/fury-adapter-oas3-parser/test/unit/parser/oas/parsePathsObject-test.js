const { Fury } = require('fury');
const { expect } = require('../../chai');

const parse = require('../../../../lib/parser/oas/parsePathsObject');
const Context = require('../../../../lib/context');

const { minim: namespace } = new Fury();

describe('#parsePathsObject', () => {
  it('provides error when paths is non-object', () => {
    const paths = new namespace.elements.String();

    const result = parse(new Context(namespace), paths);

    expect(result.length).to.equal(1);
    expect(result).to.contain.error("'Paths Object' is not an object");
  });

  it('returns empty parse result when paths is empty', () => {
    const paths = new namespace.elements.Object();
    const result = parse(new Context(namespace), paths);

    expect(result.isEmpty).to.be.true;
  });

  it('provides a warning when paths contains non-path field pattern', () => {
    const paths = new namespace.elements.Object({
      test: {},
    });

    const result = parse(new Context(namespace), paths);

    expect(result.length).to.equal(1);
    expect(result).to.contain.warning("'Paths Object' contains invalid key 'test'");
  });

  it('ignores extension objects', () => {
    const paths = new namespace.elements.Object({
      'x-extension': {},
    });

    const result = parse(new Context(namespace), paths);

    expect(result.isEmpty).to.be.true;
  });

  it('parses multiple path items into resources in defined order', () => {
    const paths = new namespace.elements.Object({
      '/3': new namespace.elements.Object(),
      '/1': new namespace.elements.Object(),
      '/2': new namespace.elements.Object(),
    });

    const result = parse(new Context(namespace), paths);

    expect(result.length).to.equal(3);
    expect(result.get(0)).to.be.instanceof(namespace.elements.Resource);
    expect(result.get(0).href.toValue()).to.equal('/3');

    expect(result.get(1)).to.be.instanceof(namespace.elements.Resource);
    expect(result.get(1).href.toValue()).to.equal('/1');

    expect(result.get(2)).to.be.instanceof(namespace.elements.Resource);
    expect(result.get(2).href.toValue()).to.equal('/2');
  });
});
