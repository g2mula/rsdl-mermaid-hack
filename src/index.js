import { parse } from 'rsdl-js';
import mermaid from 'mermaid';

import {
  enumTypeFunction,
  enumMemberFunction,
  propertyFunction,
  structuredTypeFunction,
  operationFunction,
  entityContainerFunction,
} from './templates';

const $TypeOptions = ['String', 'Int32', 'Boolean'];
window.__APP__ = window.__APP__ || {};

document.addEventListener('DOMContentLoaded', function () {
  const convertButton = document.getElementById('convertButton');
  const rsdlTextArea = document.getElementById('rsdlTextArea');

  const mermaidTextArea = document.getElementById('mermaidTextArea');
  const modelEditor = document.getElementById('modelEditor');
  const modelLabel = document.getElementById('modelLabel');

  const enumTypeButton = document.getElementById('enumTypeButton');
  const complexTypeButton = document.getElementById('complexTypeButton');
  const entityTypeButton = document.getElementById('entityTypeButton');
  const entityContainerButton = document.getElementById(
    'entityContainerButton'
  );
  const deleteElementButton = document.getElementById('deleteElementButton');

  const diagramContainer = document.getElementById('diagramContainer');
  const modelModal = new bootstrap.Modal(document.getElementById('modelModal'));

  window.__APP__ = {
    ...window.__APP__,
    modelModal,
    modelEditor,
    globalIndex: 1000,
  };

  enumTypeButton.addEventListener('click', addEnum);
  complexTypeButton.addEventListener('click', addComplexType);
  entityTypeButton.addEventListener('click', addEntityType);
  entityContainerButton.addEventListener('click', addEntityContainer);

  deleteElementButton.addEventListener('click', deleteElement);

  convertButton.addEventListener('click', load);
  modelEditor.addEventListener('submit', save);
  modelModal._element.addEventListener('show.bs.modal', populateModal);

  function load() {
    try {
      const source = rsdlTextArea.value;
      const { rsdljs, errors } = getRsdlJs(source);

      if (errors) {
        errors.map((error) => console.error(error));
        return;
      }

      console.info(rsdljs);

      if (rsdljs.$EntityContainer) {
        entityContainerButton.classList.add('d-none');
      } else {
        entityContainerButton.classList.remove('d-none');
      }

      window.__APP__.rsdljs = rsdljs;

      const mermaidText = getMermaid(rsdljs);
      mermaidTextArea.value = mermaidText;

      diagramContainer.innerHTML = mermaidText;
      delete diagramContainer.dataset.processed;

      mermaid.initialize({
        securityLevel: 'loose',
        // logLevel: 1,
      });

      mermaid.init(undefined, diagramContainer);
    } catch (e) {
      console.error(e);
    }
  }

  function save(event) {
    event.preventDefault();
    event.stopPropagation();
    if (!modelEditor.checkValidity()) {
      modelEditor.classList.add('was-validated');
      console.log('Not valid');
      return;
    }

    // Validate
    // updateModel(rsdljs, modelModal.model, editorModel);

    // console.log(modelEditor.innerHTML);
    // console.log(modelModal.model);

    const editorModel = getModel(modelEditor, modelModal.model.$Kind);
    const { rsdljs } = window.__APP__;
    const existingModel = modelModal.model;

    const entries = Object.entries(rsdljs.Model);
    const existingModelIndex = entries.findIndex(
      (e) => e[0] == existingModel.$Name
    );

    const editorModelEntry = [editorModel.$Name, editorModel];

    if (existingModelIndex >= 0) {
      entries.splice(existingModelIndex, 1, editorModelEntry);
    } else {
      entries.push(editorModelEntry);
    }

    rsdljs.Model = Object.fromEntries(entries);

    updateRsdlText(rsdljs);
  }

  function show(element) {
    modelModal.model = element;
    modelModal.show();
  }

  function addEnum() {
    show({
      $Kind: 'EnumType',
      '': 0,
    });
  }

  function addComplexType() {
    show({
      $Kind: 'ComplexType',
      '': {},
    });
  }

  function addEntityType() {
    show({
      $Kind: 'EntityType',
      '': {},
    });
  }

  function addEntityContainer() {
    show({
      $Kind: 'EntityContainer',
      $Name: 'Service',
      '': {},
    });
  }

  function deleteElement() {
    const { rsdljs } = window.__APP__;
    const editorModel = modelModal.model;
    if (rsdljs.Model[editorModel.$Name]) {
      delete rsdljs.Model[editorModel.$Name];
    }

    updateRsdlText(rsdljs);
  }

  function updateRsdlText(rsdljs) {
    const rsdlText = getRsdlText(rsdljs);
    rsdlTextArea.value = rsdlText.trim();

    modelModal.hide();
    convertButton.click();
  }

  function populateModal() {
    const { rsdljs } = window.__APP__;
    const model = modelModal.model;
    modelLabel.innerHTML = model.$Kind;
    const contents = getEditor(model, rsdljs);
    modelEditor.innerHTML = contents;
    modelEditor.classList.remove('was-validated');
  }

  load();
});

window.selectElement = function (name) {
  const { rsdljs, modelModal, modelEditor } = window.__APP__;
  if (!rsdljs || !rsdljs.Model || !modelModal) {
    return;
  }

  const element = rsdljs.Model[name];
  if (!element) {
    return;
  }

  element.$Name = name;
  console.log(element);

  modelModal.model = element;
  modelModal.show();
};

window.addEnumMember = (button) => addDataRow(button, enumMemberFunction);
window.addProperty = (button) => addDataRow(button, propertyFunction);
window.addOperation = (button) => addDataRow(button, operationFunction);
window.addInputParameter = (button) => addDataRow(button, propertyFunction);
window.addNavigationSource = (button) => {
  const { rsdljs } = window.__APP__;
  const $TypeOptions = Object.entries(rsdljs.Model)
    .filter(([name, item]) => name[0] !== '$' && item.$Kind === 'EntityType')
    .map(([name, _]) => name);

  return addDataRow(button, propertyFunction, { $TypeOptions });
};

window.removeDataRow = function (button) {
  const dataRow = button.closest('.data-row-container');
  dataRow.parentNode.removeChild(dataRow);
};

function addDataRow(button, templateFunction, props) {
  const index = window.__APP__.globalIndex++;
  const template = document.createElement('template');
  if (!props) {
    props = {};
  }

  template.innerHTML = templateFunction({
    $Index: index,
    $TypeOptions,
    $StructuredKind: button.dataset.structuredKind,
    ...props,
  }).trim();
  const dataRow = template.content.firstChild;
  button.parentNode.insertAdjacentElement('beforebegin', dataRow);
}

function getModel(editor, $Kind) {
  switch ($Kind) {
    case 'EnumType':
      return getEnumType(editor);
    case 'ComplexType':
    case 'EntityType':
      return getStructuredType(editor, $Kind);
    case 'EntityContainer':
      return getEntityContainer(editor);
    default:
      return {};
  }
}

function getEnumType(enumEditor) {
  const name = enumEditor.querySelector('#nameInput').value;
  const enumType = [
    ...enumEditor.querySelectorAll('#enumMembersContainer input[type=text]'),
  ]
    .map((element) => element.value)
    .reduce(
      (accumulator, item, index) => {
        accumulator[item] = index;
        return accumulator;
      },
      {
        $Kind: 'EnumType',
        $Name: name,
      }
    );

  return enumType;
}

function getStructuredType(structuredTypeEditor, $Kind) {
  const name = structuredTypeEditor.querySelector('#nameInput').value;
  const properties = [
    ...structuredTypeEditor.querySelectorAll(
      '#propertiesContainer > div.data-row-container'
    ),
  ].map((element) => getPropertyFromEditor(element));

  const operations = [
    ...structuredTypeEditor.querySelectorAll(
      '#operationsContainer > div.data-row-container'
    ),
  ].map((element) => getOperation(element, name));

  const structuredType = properties.reduce(
    (accumulator, item) => {
      accumulator[item.$Name] = item;
      return accumulator;
    },
    {
      $Kind,
      $Name: name,
    }
  );

  if ($Kind === 'EntityType') {
    structuredType.$Operations = operations;
    structuredType.$Key = properties.filter((p) => p.$IsPk).map((p) => p.$Name);
  }

  return structuredType;
}

function getEntityContainer(entityContainerEditor) {
  const name = enumEditor.querySelector('#nameInput').value;
  const entityContainer = [
    ...entityContainerEditor.querySelectorAll(
      '#navigationSourcesContainer > div.data-row-container'
    ),
  ]
    .map((element) => getPropertyFromEditor(element))
    .reduce(
      (accumulator, item) => {
        accumulator[item.$Name] = item;
        return accumulator;
      },
      {
        $Kind: 'EntityContainer',
        $Name: name,
      }
    );

  return entityContainer;
}

function getOperation(operationEditor, bindingTypeName) {
  const nameInput = operationEditor.querySelector(
    'input[type=text].operation-name-data'
  );
  const typeInput = operationEditor.querySelector('select.operation-type-data');
  const hasReturnInput = operationEditor.querySelector(
    'input[type=checkbox].has-return-data'
  );
  const returnTypeDataRow = operationEditor.querySelector(
    'div.return-type-container > div.data-row-container'
  );
  const inputParameters = [
    ...operationEditor.querySelectorAll(
      'div.input-parameters-container > div.data-row-container'
    ),
  ].map((element) => getPropertyFromEditor(element));

  const operation = {
    $Name: nameInput.value,
    $Kind: typeInput.value,
    $IsBound: true,
    $Parameter: [
      {
        $Name: 'this',
        $Type: bindingTypeName,
      },
      ...inputParameters,
    ],
  };

  if (hasReturnInput && hasReturnInput.checked) {
    const returnProperty = getPropertyFromEditor(returnTypeDataRow);
    operation.$ReturnType = returnProperty.$Type;
  }

  return operation;
}

function getPropertyFromEditor(element) {
  const pkInput = element.querySelector('input[type=checkbox].pk-data');
  const nameInput = element.querySelector('input[type=text].name-data');
  const typeInput = element.querySelector('select.type-data');
  const collectionInput = element.querySelector(
    'input[type=checkbox].collection-data'
  );
  const nullableInput = element.querySelector(
    'input[type=checkbox].nullable-data'
  );

  const property = {};
  if (pkInput && pkInput.checked) {
    property.$IsPk = true;
  }

  if (nameInput) {
    property.$Name = nameInput.value;
  }

  if (typeInput) {
    property.$Type = typeInput.value;
  }

  if (collectionInput && collectionInput.checked) {
    property.$Collection = true;
  }

  if (nullableInput && nullableInput.checked) {
    property.$Nullable = true;
  }

  return property;
}

function getEditor(model, rsdljs) {
  switch (model.$Kind) {
    case 'EnumType':
      return getEnumEditor(model, rsdljs);
    case 'ComplexType':
    case 'EntityType':
      return getStructuredEditor(model, rsdljs);
    case 'EntityContainer':
      return getEntityContainerEditor(model, rsdljs);
    default:
      return `<pre>${JSON.stringify(model, null, 2)}</pre>`;
  }
}

function getEnumEditor(enumType, rsdljs) {
  const enumMembers = Object.entries(enumType)
    .filter(([name, _]) => name[0] !== '$')
    .map(([name, _]) => name);

  return enumTypeFunction({ ...enumType, enumMembers });
}

function getStructuredEditor(structuredType, rsdljs) {
  const $Properties = Object.entries(structuredType)
    .filter(([name, _]) => name[0] !== '$')
    .map(([name, property]) => ({
      name,
      isPk: structuredType.$Key && structuredType.$Key.indexOf(name) >= 0,
      type: (property.$Type || 'String').split('.').pop(),
      isCollection: property.$Collection,
      isNullable: property.$Nullable,
    }));

  return structuredTypeFunction({
    ...structuredType,
    $Properties,
    $TypeOptions,
  });
}

function getEntityContainerEditor(entityContainer, rsdljs) {
  const $NavigationSources = Object.entries(entityContainer)
    .filter(([name, _]) => name[0] !== '$')
    .map(([name, property]) => ({
      name,
      type: (property.$Type || 'String').split('.').pop(),
      isCollection: property.$Collection,
      isNullable: property.$Nullable,
    }));

  const $EntityTypes = Object.entries(rsdljs.Model)
    .filter(([name, item]) => name[0] !== '$' && item.$Kind === 'EntityType')
    .map(([name, _]) => name);

  return entityContainerFunction({
    ...entityContainer,
    $NavigationSources,
    $EntityTypes,
  });
}

function getRsdlJs(rsdlText) {
  try {
    const json = parse(rsdlText, () => () => '');
    if (json.$$errors) {
      return { errors: json.$$errors };
    }

    var normalized = getNormalizedRsdlJs(json);

    return { rsdljs: normalized };
  } catch (e) {
    return { errors: [e] };
  }
}

function getNormalizedRsdlJs(rsdljs) {
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
        op.$InputParameters = op.$Parameter.slice(1).map((p) => ({
          name: p.$Name,
          type: (p.$Type || 'String').split('.').pop(),
          isCollection: p.$Collection,
          isNullable: p.$Nullable,
        }));
        if (op.$ReturnType) {
          op.$ReturnType = {
            ...op.$ReturnType,
            name: op.$ReturnType.$Name,
            type: (op.$ReturnType.$Type || 'String').split('.').pop(),
            isCollection: op.$ReturnType.$Collection,
            isNullable: op.$ReturnType.$Nullable,
          };
        }
        type.$Operations.push(op);
      }
    });
  });

  return copy;
}

function getRsdlText(rsdljs) {
  return Object.entries(rsdljs.Model)
    .map(([name, element]) => getRsdlElement(name, element))
    .join('');
}

function getRsdlElement(name, edmElement) {
  switch (edmElement.$Kind) {
    case 'EnumType':
      return getEnumTypeRsdl(name, edmElement);
    case 'EntityType':
      return getEntityTypeRsdl(name, edmElement);
    case 'ComplexType':
      return getComplexTypeRsdl(name, edmElement);
    case 'EntityContainer':
      return getEntityContainerRsdl(name, edmElement);
    default:
      return '';
  }
}

function getEnumTypeRsdl(name, enumType) {
  const members = Object.entries(enumType)
    .map(([name]) => name)
    .filter((name) => name[0] !== '$')
    .join('\n    ');
  return `
enum ${name} {
    ${members}
}
  `;
}

function getEntityTypeRsdl(name, entityType) {
  return getStructuredTypeRsdl(name, entityType);
}

function getComplexTypeRsdl(name, complexType) {
  return getStructuredTypeRsdl(name, complexType);
}

function getStructuredTypeRsdl(name, structuredType) {
  const baseType = structuredType.$BaseType
    ? ' extends ' + structuredType.$BaseType.split('.').pop()
    : '';
  const properties = getRsdlProperties(structuredType);
  const operations = getRsdlOperations(structuredType.$Operations);

  return `
type ${name} ${baseType}{
    ${properties + operations}
}
`;
}

function getRsdlOperations(operations) {
  if (!operations || !operations.length) {
    return '';
  }

  return (
    '\n    ' +
    operations
      .map(
        (op) =>
          `${op.$Kind.toLowerCase()} ${op.$Name} (${getOperationParametersRsdl(
            op.$Parameter.slice(1)
          )}) ${op.$ReturnType ? ': ' + getType(op.$ReturnType) : ''}`
      )
      .join('\n    ')
  );
}

function getEntityContainerRsdl(_name, entityContainer) {
  return `
service {
    ${getRsdlProperties(entityContainer)}
}
  `;
}

function getOperationParametersRsdl(inputParameters) {
  if (!inputParameters || !inputParameters.length) {
    return '';
  }

  return inputParameters.map((p) => getPropertyRsdl(p.$Name, p)).join(', ');
}

function getPropertyRsdl(name, typeDef, keys) {
  const type = getType(typeDef);
  const keyPrefix = keys && keys.indexOf(name) >= 0 ? 'key ' : '';
  return `${keyPrefix}${name}: ${type}`;
}

function getRsdlProperties(edmType) {
  // TODO: Reuses mermaid property;
  const keys = edmType.$Key;
  return Object.entries(edmType)
    .filter(([name, _]) => name[0] !== '$')
    .map(([name, typeDef]) => getPropertyRsdl(name, typeDef, keys))
    .join('\n    ');
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
      return getEnumTypeContents(edmElement);
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

function getEnumTypeContents(enumType) {
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
            op.$ReturnType ? '∶ ' + getType(op.$ReturnType) : ''
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
