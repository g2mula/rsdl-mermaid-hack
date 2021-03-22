import { parse } from 'rsdl-js';
import mermaid from 'mermaid';

document.addEventListener('DOMContentLoaded', function () {
  const convertButton = document.getElementById('convertButton');
  const rsdlTextArea = document.getElementById('rsdlTextArea');
  const mermaidTextArea = document.getElementById('mermaidTextArea');

  const diagramContainer = document.getElementById('diagramContainer');

  convertButton.addEventListener('click', convert);

  function convert() {
    try {
      const source = rsdlTextArea.value;
      const { rsdljs, errors } = getRsdl(source);

      if (errors) {
        errors.map((error) => console.error(error));
        return;
      }

      console.info(rsdljs);

      window.__RSDLJS__ = rsdljs;

      const mermaidText = getMermaid(rsdljs);
      mermaidTextArea.value = mermaidText;

      diagramContainer.innerHTML = mermaidText;
      delete diagramContainer.dataset.processed;

      mermaid.initialize({
        securityLevel: 'loose',
        logLevel: 1,
      });

      mermaid.init(undefined, diagramContainer);
    } catch (e) {
      console.error(e);
    }
  }

  convert();
});

window.selectElement = function (name) {
  const rsdljs = window.__RSDLJS__;
  if (!rsdljs || !rsdljs.Model) {
    return;
  }

  const element = rsdljs.Model[name];
  if (!element) {
    return;
  }

  console.log(element);
  // TODO: Popup editor.
};

function getRsdl(rsdlText) {
  try {
    const json = parse(rsdlText, () => () => '');
    if (json.$$errors) {
      return { errors: json.$$errors };
    }

    var normalized = getNormalizedRsdl(json);

    return { rsdljs: normalized };
  } catch (e) {
    return { errors: [e] };
  }
}

function getNormalizedRsdl(rsdljs) {
  const copy = JSON.parse(JSON.stringify(rsdljs));
  const model = copy.Model;
  const edmOperations = Object.entries(model).filter(([key, edmElement]) =>
    Array.isArray(edmElement)
  );
  edmOperations.forEach(([key, operations]) => {
    delete model[key];
    operations.forEach((op) => {
      // TODO: Remove Hacks
      const bindingParameter = op.$Parameter[0];
      const typeName = bindingParameter.$Type.split('.').pop();
      const type = model[typeName];
      if (type) {
        type.$Operations = type.$Operations || [];
        op.$Name = key;
        type.$Operations.push(op);
      }
    });
  });

  return copy;
}

function getMermaid(rsdljs) {
  if (!rsdljs.Model) {
    return 'classDiagram\nclass None';
  }

  const entries = Object.entries(rsdljs.Model);
  const model = entries.map(([key, element]) =>
    getMermaidElement(key, element)
  );

  const relationships = entries
    .reduce((accumulator, [elementName, element]) => {
      return Object.entries(element).reduce(
        (accumlator2, [propertyName, propertyType]) => {
          if (propertyType.$Kind === 'NavigationProperty') {
            accumlator2.push({
              source: elementName,
              target: propertyType.$Type.split('.').pop(),
              name: propertyName,
              isContained: propertyType.$ContainsTarget === true,
            });
          }

          if (propertyName === '$BaseType') {
            accumlator2.push({
              source: elementName,
              target: propertyType.split('.').pop(),
              isInheritance: true,
            });
          }

          return accumlator2;
        },
        accumulator
      );
    }, [])
    .map((relation) => {
      let definition = '--o';
      if (relation.isContained) {
        definition = '--*';
      } else if (relation.isInheritance) {
        definition = '--|>';
      }

      const text = `\t${relation.source} ${definition} ${relation.target}`;
      if (relation.isInheritance || !relation.name) {
        return text;
      }

      return `${text} : ${relation.name}`;
    });

  const elementSelects = entries.map(
    ([key, ..._]) => `\tclick ${key} call selectElement(${key}) "${key}"`
  );

  return ['classDiagram', ...model, ...relationships, ...elementSelects].join(
    '\n'
  );
}

function getMermaidElement(name, edmElement) {
  const contents = getElementContents(edmElement);
  return `\tclass ${name} {\n\t\t${contents}\n\t}`;
}

function getElementContents(edmElement) {
  switch (edmElement.$Kind) {
    case 'EnumType':
      return getEnumType(edmElement);
    case 'EntityType':
      return getEntityTypeContents(edmElement);
    case 'ComplexType':
      return getComplexTypeContents(edmElement);
    case 'EntityContainer':
      return getEntityContainerContents(edmElement);
    default:
      return '';
  }
}

function getEnumType(enumType) {
  return Object.entries(enumType)
    .filter(([name, _]) => name[0] !== '$')
    .map(([name, value]) => `${name}: ${value}`)
    .join('\n\t\t');
}

function getEntityTypeContents(entityType) {
  return getStructuredTypeContents(entityType);
}

function getComplexTypeContents(complexType) {
  return getStructuredTypeContents(complexType);
}

function getStructuredTypeContents(structuredType) {
  const properties = getPropertiesContents(structuredType);
  const operations = getOperationsContents(structuredType.$Operations);

  return properties + operations;
}

function getEntityContainerContents(entityContainer) {
  return getPropertiesContents(entityContainer);
}

function getPropertiesContents(edmType) {
  return Object.entries(edmType)
    .filter(([name, _]) => name[0] !== '$')
    .map(([name, typeDef]) => getProperty(name, typeDef))
    .join('\n\t\t');
}

function getOperationsContents(operations) {
  if (!operations || !operations.length) {
    return '';
  }

  return (
    '\n\t\t' +
    operations
      .map(
        (op) =>
          `${op.$Name} (${getOperationParameters(op.$Parameter.slice(1))}) ${
            op.$ReturnType ? getType(op.$ReturnType) : ''
          }`
      )
      .join('\n\t\t')
  );
}

function getOperationParameters(inputParameters) {
  if (!inputParameters || !inputParameters.length) {
    return '';
  }

  return inputParameters.map((p) => getProperty(p.$Name, p)).join(', ');
}

function getProperty(name, typeDef) {
  const type = getType(typeDef);
  return `${name}∶ ${type}`;
}

function getType(typeDef) {
  // TODO: Remove hack
  let type = (typeDef.$Type || 'String').split('.').pop();
  if (typeDef.$Nullable) {
    type = type + '?';
  }

  if (typeDef.$Collection) {
    type = `[${type}]`;
  }

  return type;
}
