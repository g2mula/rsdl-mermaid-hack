import { parse } from 'rsdl-js';
import mermaid from 'mermaid';

document.addEventListener('DOMContentLoaded', function () {
  const convertButton = document.getElementById('convertButton');
  const rsdlTextArea = document.getElementById('rsdlTextArea');
  const mermaidTextArea = document.getElementById('mermaidTextArea');

  const diagramContainer = document.getElementById('diagramContainer');

  mermaid.initialize({
    securityLevel: 'loose',
  });

  convertButton.addEventListener('click', async function () {
    try {
      const source = rsdlTextArea.value;
      const { rsdljs, errors } = getRsdl(source);

      if (errors) {
        errors.map((error) => console.error(error));
        return;
      }

      console.info(rsdljs);

      const mermaidText = getMermaid(rsdljs);
      mermaidTextArea.value = mermaidText;

      const mermaidDiagram = await renderMermaid(mermaidText);

      diagramContainer.innerHTML = mermaidDiagram;
    } catch (e) {
      console.error(e);
    }
  });
});

function getRsdl(rsdlText) {
  try {
    const json = parse(rsdlText, (_) => (_) => '');
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

function getEntityType(edmElement) {}

function getMermaid(rsdljs) {
  if (!rsdljs.Model) {
    return 'classDiagram\nclass None';
  }

  const model = Object.entries(rsdljs.Model).map(([key, element]) =>
    getMermaidElement(key, element)
  );

  return ['classDiagram', ...model].join('\n');
}

function getMermaidElement(name, edmElement) {
  const contents = getElementContents(edmElement);
  return `\tclass ${name} {\n\t\t${contents}\n\t}`;
}

function getElementContents(edmElement) {
  switch (edmElement.$Kind) {
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

function getEntityTypeContents(entityType) {
  return getStructuredTypeContents(entityType);
}

function getComplexTypeContents(complexType) {
  return getStructuredTypeContents(complexType);
}

function getStructuredTypeContents(structuredType) {
  return getPropertiesContents(structuredType);
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

function getProperty(name, typeDef) {
  // TODO: Remove hack
  let type = (typeDef.$Type || 'String').split('.').pop();
  if (typeDef.$Nullable) {
    type = type + '?';
  }

  if (typeDef.$Collection) {
    type = `[${type}]`;
  }

  return `${name}: ${type}`;
}

async function renderMermaid(mermaidText) {
  return new Promise((resolve) => {
    mermaid.mermaidAPI.render('mermaid-rsdl', mermaidText, resolve);
  });
}
