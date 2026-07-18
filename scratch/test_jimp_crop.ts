import { Jimp } from 'jimp';

async function main() {
  const image = new Jimp({ width: 100, height: 100 });
  console.log('Original dimensions:', image.width, 'x', image.height);
  
  image.crop({ x: 10, y: 10, w: 20, h: 20 });
  console.log('Cropped dimensions:', image.width, 'x', image.height);
  
  const output = await image.getBuffer('image/png');
  console.log('Output buffer length:', output.length);
}

main().catch(console.error);
