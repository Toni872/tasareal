const puppeteer = require('puppeteer');

async function captureScreenshots() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const url = 'https://tasareal-5nup.vercel.app/';

  console.log('Cargando sitio...');
  await page.goto(url, { waitUntil: 'networkidle0' });

  // Esperar 8 segundos fijos para que todo cargue
  console.log('Esperando carga completa...');
  await new Promise(resolve => setTimeout(resolve, 8000));

  console.log('Capturando desktop...');
  await page.setViewport({ width: 1920, height: 1080 });
  await page.screenshot({ path: 'screenshot-desktop.png', fullPage: true });

  console.log('Capturando mobile...');
  await page.setViewport({ width: 375, height: 667 });
  await page.screenshot({ path: 'screenshot-mobile.png', fullPage: true });

  console.log('Screenshots actualizados con botón negro: screenshot-desktop.png y screenshot-mobile.png');
  await browser.close();
}

captureScreenshots().catch(console.error);
