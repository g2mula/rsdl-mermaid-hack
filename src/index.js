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

    return { rsdljs: json };
  } catch (e) {
    return { errors: [e] };
  }
}

function getMermaid(rsdljs) {
  return `
classDiagram
    Animal <|-- Duck
    Animal <|-- Fish
    Animal <|-- Zebra
    Animal : int age
    Animal : String gender
    Animal: isMammal()
    Animal: mate()
    class Duck{
      String beakColor
      swim()
      quack()
    }
    class Fish{
      int sizeInFeet
      canEat()
    }
    class Zebra{
      bool is_wild
      run()
    }
`.trim();
}

async function renderMermaid(mermaidText) {
  return new Promise((resolve) => {
    mermaid.mermaidAPI.render('mermaid-rsdl', mermaidText, resolve);
  });
}
