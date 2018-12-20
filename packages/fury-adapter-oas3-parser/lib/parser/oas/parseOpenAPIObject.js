const R = require('ramda');

const {
  isAnnotation, isExtension, hasKey, getValue,
} = require('../../predicates');
const {
  createUnsupportedMemberWarning,
  createInvalidMemberWarning,
  validateObjectContainsRequiredKeys,
} = require('../annotations');
const pipeParseResult = require('../../pipeParseResult');
const parseObject = require('../parseObject');
const parseOpenAPI = require('../openapi');
const parseInfoObject = require('./parseInfoObject');
const parsePathsObject = require('./parsePathsObject');
const parseComponentsObject = require('./parseComponentsObject');

const name = 'OpenAPI Object';
const requiredKeys = ['openapi', 'info', 'paths'];
const unsupportedKeys = ['servers', 'security', 'tags', 'externalDocs'];

/**
 * Returns whether the given member element is unsupported
 * @param member {MemberElement}
 * @returns {boolean}
 * @see unsupportedKeys
 */
const isUnsupportedKey = R.anyPass(R.map(hasKey, unsupportedKeys));

function parseOASObject(namespace, object) {
  // Takes a parse result, and wraps all of the non annotations inside an array
  const asArray = (parseResult) => {
    const array = new namespace.elements.Array(R.reject(isAnnotation, parseResult));
    return new namespace.elements.ParseResult([array].concat(parseResult.annotations.elements));
  };

  const parseMember = R.cond([
    [hasKey('openapi'), parseOpenAPI(namespace)],
    [hasKey('info'), R.compose(parseInfoObject(namespace), getValue)],
    [hasKey('paths'), R.compose(asArray, parsePathsObject(namespace), getValue)],
    [hasKey('components'), R.compose(parseComponentsObject(namespace), getValue)],

    // FIXME Support exposing extensions into parse result
    [isExtension, () => new namespace.elements.ParseResult()],

    [isUnsupportedKey, createUnsupportedMemberWarning(namespace, name)],

    // Return a warning for additional properties
    [R.T, createInvalidMemberWarning(namespace, name)],
  ]);

  const parseOASObject = pipeParseResult(namespace,
    validateObjectContainsRequiredKeys(namespace, name, requiredKeys),
    parseObject(namespace, parseMember),
    (object) => {
      const api = object.get('info');

      const resources = object.get('paths');
      if (resources) {
        api.content = api.content.concat(resources.content);
      }

      const components = object.get('components');
      if (components) {
        const schemas = components.get('schemas');
        if (schemas) {
          const dataStructures = new namespace.elements.Category(
            schemas.content.map(getValue),
            { classes: ['dataStructures'] }
          );
          api.push(dataStructures);
        }
      }

      return api;
    });

  return parseOASObject(object);
}

module.exports = R.curry(parseOASObject);
