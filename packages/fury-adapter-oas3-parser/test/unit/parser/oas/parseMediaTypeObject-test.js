const { Fury } = require('fury');
const { expect } = require('../../chai');
const parse = require('../../../../lib/parser/oas/parseMediaTypeObject');
const Context = require('../../../../lib/context');

const { minim: namespace } = new Fury();

describe('Media Type Object', () => {
  let context;
  const messageBodyClass = namespace.elements.HttpResponse;

  beforeEach(() => {
    context = new Context(namespace);
  });

  it('provides warning when media type is non-object', () => {
    const mediaType = new namespace.elements.Member('application/json', null);

    const parseResult = parse(context, messageBodyClass, mediaType);

    expect(parseResult).to.contain.warning("'Media Type Object' is not an object");
  });

  it('returns a HTTP message body', () => {
    const mediaType = new namespace.elements.Member('application/json', {});

    const parseResult = parse(context, messageBodyClass, mediaType);

    const message = parseResult.get(0);
    expect(message).to.be.instanceof(messageBodyClass);
    expect(message.contentType.toValue()).to.equal('application/json');
  });

  describe('warnings for unsupported properties', () => {
    it('provides warning for unsupported encoding key', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        encoding: {},
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      expect(parseResult).to.contain.warning("'Media Type Object' contains unsupported key 'encoding'");
    });
  });

  describe('#example', () => {
    it('creates an messageBody asset from an example for JSON type', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        example: {
          message: 'Hello World',
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody.toValue()).to.equal('{"message":"Hello World"}');
      expect(message.messageBody.contentType.toValue()).to.equal('application/json');
    });

    it('creates an messageBody asset from an example for JSON subtype', () => {
      const mediaType = new namespace.elements.Member('application/hal+json', {
        example: {
          message: 'Hello World',
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody.toValue()).to.equal('{"message":"Hello World"}');
      expect(message.messageBody.contentType.toValue()).to.equal('application/hal+json');
    });

    it('warns for example without JSON type', () => {
      const mediaType = new namespace.elements.Member('application/xml', {
        example: {
          message: 'Hello World',
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody).to.be.undefined;

      expect(parseResult).to.contain.warning(
        "'Media Type Object' 'example' is only supported for JSON media types"
      );
    });
  });

  describe('#examples', () => {
    it('provides warning when examples is non-object', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        examples: null,
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      expect(parseResult).to.contain.warning("'Media Type Object' 'examples' is not an object");
    });

    it('ignores empty examples', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        examples: {},
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody).to.be.undefined;
    });

    it('ignores empty example', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        examples: {
          cat: {},
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody).to.be.undefined;
    });

    it('creates an messageBody asset from an example for JSON type', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        examples: {
          cat: {
            value: {
              message: 'Hello World',
            },
          },
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody.toValue()).to.equal('{"message":"Hello World"}');
      expect(message.messageBody.contentType.toValue()).to.equal('application/json');
    });

    it('warns for examples without JSON type', () => {
      const mediaType = new namespace.elements.Member('application/xml', {
        examples: {
          cat: {
            value: {
              message: 'Hello World',
            },
          },
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody).to.be.undefined;

      expect(parseResult).to.contain.warning(
        "'Media Type Object' 'examples' is only supported for JSON media types"
      );
    });

    it('warns for unsupported multiple examples', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        examples: {
          cat: {
            value: {
              message: 'Hello World',
            },
          },
          dog: {
            value: {
              message: 'Hello World',
            },
          },
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);

      expect(parseResult).to.contain.warning(
        "'Media Type Object' 'examples' only one example is supported, other examples have been ignored"
      );
    });
  });

  describe('#schema', () => {
    it('parses a schema into a data structure', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        schema: {
          type: 'object',
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.dataStructure).to.be.instanceof(namespace.elements.DataStructure);
      expect(message.dataStructure.content).to.be.instanceof(namespace.elements.Object);
    });

    it('parses a schema reference into as data structure', () => {
      context.state.components = new namespace.elements.Object({
        schemas: {
          // Data Structure for an Object
          User: new namespace.elements.DataStructure(
            new namespace.elements.Object(undefined, {
              id: 'User',
            })
          ),
        },
      });

      const mediaType = new namespace.elements.Member('application/json', {
        schema: {
          $ref: '#/components/schemas/User',
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.dataStructure).to.be.instanceof(namespace.elements.DataStructure);
      expect(message.dataStructure.content.element).to.equal('User');
    });

    it('generates an messageBody asset for JSON type with no examples', () => {
      const mediaType = new namespace.elements.Member('application/json', {
        schema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              example: 'doe',
            },
          },
        },
      });

      const parseResult = parse(context, messageBodyClass, mediaType);

      const message = parseResult.get(0);
      expect(message).to.be.instanceof(messageBodyClass);
      expect(message.messageBody.toValue()).to.equal('{"name":"doe"}');
      expect(message.messageBody.contentType.toValue()).to.equal('application/json');
    });
  });
});
