import { parse } from 'rsdl-js';

document.addEventListener('DOMContentLoaded', function () {
  const convertButton = document.getElementById('convertButton');
  const rsdlTextArea = document.getElementById('rsdlTextArea');
  const mermaidTextArea = document.getElementById('mermaidTextArea');

  const diagramContainer = document.getElementById('diagramContainer');

  convertButton.addEventListener('click', function () {
    try {
      const source = rsdlTextArea.value;
      const { rsdljs, errors } = convertRsdl(source);

      if (errors) {
        errors.map((error) => console.error(error));
        return;
      }

    
      mermaidTextArea.value = JSON.stringify(rsdljs, null, 2);
    } catch (e) {
      console.error(e);
    }
  });
});

function convertRsdl(source) {
  try {
    const json = parse(source, (_) => (_) => '');
    if (json.$$errors) {
      return { errors: json.$$errors };
    }

    return { rsdljs: json };
  } catch (e) {
    return { errors: [e] };
  }
}
