function collectElementByIDs(element) {
  const dataStructures = {};
  const { parents } = element;

  if (!parents || parents.isEmpty) {
    return dataStructures;
  }

  const rootElement = parents.get(parents.length - 1);

  if (rootElement) {
    rootElement.recursiveChildren.forEach((element) => {
      // eslint-disable-next-line no-underscore-dangle
      const isNotEmptyStringElement = element._meta && element._meta.get('id');

      if (isNotEmptyStringElement) {
        dataStructures[element.id.toValue()] = element;
      }
    });
  }

  return dataStructures;
}

function serializeJSON(element) {
  if (element.element === 'dataStructure') {
    return serializeJSON(element.content);
  }

  const dataStructures = collectElementByIDs(element);
  const value = element.valueOf(undefined, dataStructures);

  return JSON.stringify(value, null, 2);
}

module.exports = serializeJSON;
