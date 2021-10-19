import fs from "fs";
import mergeImg from 'merge-img';

const generateImages = true;
const desiredCount = 5000;

const ext = ".png";
const partFolder = "./inputs";
const outputFolder = './outputs'
const outputCodeJSON = './outputs/stat/outputCodeJSON.json'
const outputFrequencyJSON = './outputs/stat/outputFrequencyJSON.json'
const outputPartFrequencyJSON = './outputs/stat/outputPartFrequencyJSON.json'

if (!fs.existsSync(outputFolder + '/stat')) {
  fs.mkdirSync(outputFolder + '/stat', { recursive: true });
}

const partTypes = [
  { name: "Background", count: 46, probability: 1 },
  { name: "Body", count: 46, probability: 1 },
  { name: "Wings", count: 11, probability: 0.2 },
  { name: "Shirt", count: 22, probability: 0.85 },
  { name: "Hands", count: 14, probability: 0.35 },
  { name: "Hat", count: 40, probability: 0.65 },
  { name: "Mouth", count: 20, probability: 1 },
  { name: "Eyes", count: 32, probability: 1 },
];


async function saveImgByCode(codeArr, outFile) {
  function mergeImagesToPng(images, output) {
    return new Promise(function (resolve, reject) {
      mergeImg(images.map((image, i) => ({ src: image, offsetX: i === 0 ? 0 : -2732 })))
        .then((img) => {
          // Save image as file
          img.write(output, () => {
            console.log(`Image ${output} saved`);
            resolve();
          });
        });
    });
  }

  let images = [];
  for (let i = 0; i < partTypes.length; i++) {
    if (codeArr[i] !== 0) {
      const img = `${partFolder}/${partTypes[i].name}/${codeArr[i]}${ext}`;

      images.push(img);
    }
  }

  // Generate image
  await mergeImagesToPng(images, outFile);
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const genCodeArr = () => {
  let codeArr = [];
  let attrFreq = {};
  let attrPartFreq = {};

  while (codeArr.length < desiredCount) {
    let picArr = partTypes.map((part) => {
      const mathRandom = Math.random();

      if (
        ['Body', 'Eyes', 'Hat'].includes(part.name)
        &&
        (mathRandom <= 0.01)  // 1% rare cases 
      ) {
        attrFreq[`${part.name}1`] = (attrFreq[`${part.name}1`] || 0) + 1;
        attrPartFreq[`${part.name}`] = (attrPartFreq[`${part.name}`] || 0) + 1;
        return 1;
      }

      if (
        ['Hat', 'Shirt'].includes(part.name)
        &&
        (mathRandom <= 0.03)
      ) {
        if (part.name === 'Hat') {
          const val = getRandomInt(2, 5);   // only 2,3,4
          attrFreq[`${part.name}${val}`] = (attrFreq[`${part.name}${val}`] || 0) + 1;
          attrPartFreq[`${part.name}`] = (attrPartFreq[`${part.name}`] || 0) + 1;
          return val;
        }
        if (part.name === 'Shirt') {
          attrFreq[`${part.name}1`] = (attrFreq[`${part.name}1`] || 0) + 1;
          attrPartFreq[`${part.name}`] = (attrPartFreq[`${part.name}`] || 0) + 1;
          return 1;  // only 2,3,4
        }
      }

      if (mathRandom <= part.probability) {
        if (['Body', 'Eyes', 'Shirt'].includes(part.name)) {
          const val = getRandomInt(2, part.count);
          attrFreq[`${part.name}${val}`] = (attrFreq[`${part.name}${val}`] || 0) + 1;
          attrPartFreq[`${part.name}`] = (attrPartFreq[`${part.name}`] || 0) + 1;
          return val;
        }
        if (['Hat'].includes(part.name)) {
          const val = getRandomInt(5, part.count);
          attrFreq[`${part.name}${val}`] = (attrFreq[`${part.name}${val}`] || 0) + 1;
          attrPartFreq[`${part.name}`] = (attrPartFreq[`${part.name}`] || 0) + 1;
          return val;
        }

        const val = getRandomInt(1, part.count);
        attrFreq[`${part.name}${val}`] = (attrFreq[`${part.name}${val}`] || 0) + 1;
        attrPartFreq[`${part.name}`] = (attrPartFreq[`${part.name}`] || 0) + 1;
        return val;
      }
      return 0; // no image for the part
    });

    codeArr.push({ id: codeArr.length, attributes: picArr })
  }

  fs.writeFileSync(outputCodeJSON, JSON.stringify(codeArr));
  fs.writeFileSync(outputFrequencyJSON, JSON.stringify(attrFreq));
  fs.writeFileSync(outputPartFrequencyJSON, JSON.stringify(attrPartFreq));
  return codeArr;
};


export const main = async () => {
  const codeArr = genCodeArr();
  if (generateImages) {
    let i = 0;
    while (i < codeArr.length) {
      await saveImgByCode(codeArr[i].attributes, `${outputFolder}/image${codeArr[i].id}${ext}`)
      i++;
    }
  }
}
