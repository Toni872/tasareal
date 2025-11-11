# Guía de Despliegue - TasaDiv

Esta guía detalla cómo desplegar TasaDiv en producción paso a paso. Es un proyecto estático simple, ideal para hosting gratuito o pago.

## 🚀 Despliegue Recomendado: Vercel

### Paso 1: Preparación
1. Asegúrate de tener una cuenta en [Vercel](https://vercel.com) (gratuito).
2. Conecta tu cuenta de GitHub con Vercel.

### Paso 2: Importar Proyecto
1. Ve a Vercel Dashboard → "New Project".
2. Selecciona "Import Git Repository" y elige `Toni872/tasadiv`.
3. Configura:
   - **Framework Preset**: "Other" (ya que es HTML/CSS/JS puro).
   - **Root Directory**: Deja vacío (raíz del repo).
   - **Build Command**: Deja vacío (no necesita build).
   - **Output Directory**: Deja vacío (sirve archivos estáticos directamente).

### Paso 3: Configurar API Key (Opcional)
Si quieres usar una API key propia para ExchangeRate-API:
1. Ve a [ExchangeRate-API](https://exchangerate-api.com) y registra una cuenta gratuita.
2. Copia tu API key.
3. En Vercel, ve a Project Settings → Environment Variables.
4. Añade: `EXCHANGE_RATE_API_KEY` = tu_api_key.
5. Modifica `script.js` para usar `process.env.EXCHANGE_RATE_API_KEY` (si implementas serverless functions).

### Paso 4: Desplegar
1. Haz click en "Deploy".
2. Vercel asignará una URL como `https://tu-proyecto.vercel.app`.
3. Una vez desplegado, promociona el deployment como producción.

### Paso 5: Verificación
- Abre la URL y verifica que las tasas carguen y el convertidor funcione.
- Si hay errores, revisa los logs en Vercel Dashboard.

## 🌐 Alternativas de Despliegue

### Netlify
1. Ve a [Netlify](https://netlify.com) y conecta GitHub.
2. Importa el repo `Toni872/tasadiv`.
3. Despliega automáticamente - no configuración necesaria.
4. URL: `https://tu-sitio.netlify.app`.

### GitHub Pages
1. Ve a tu repo en GitHub → Settings → Pages.
2. Selecciona "Deploy from a branch" → Branch `main` → Folder `/(root)`.
3. Despliega. URL: `https://tu-usuario.github.io/tasadiv`.

### Hosting Estático (cPanel, etc.)
1. Sube los archivos `index.html`, `styles.css`, `script.js`, `logo.svg`, `favicon.ico` a tu hosting.
2. Asegúrate de que soporte HTTPS para la API.

## 🔧 Configuración de Dominio Personalizado

### En Vercel
1. Ve a Project Settings → Domains.
2. Añade tu dominio (p.ej. `tasadiv.com`).
3. Configura DNS en tu proveedor de dominio apuntando a Vercel.

### SEO y Analytics
- Añade Google Analytics en `index.html` para tracking.
- Instala Google Search Console para monitoreo SEO.

## 🛠️ Solución de Problemas

### Las tasas no cargan
- Verifica que la API de ExchangeRate-API esté activa (prueba en navegador).
- Si usas API key, asegúrate de que esté configurada en env vars.

### Estilos no aplican
- Verifica que `styles.css` se esté sirviendo correctamente (sin MIME type errors).
- Usa DevTools para inspeccionar CSS.

### Errores de build en Vercel
- Si ves "No Output Directory", elimina `vercel.json` o simplifícalo (como está ahora).

## 📊 Monitoreo Post-Despliegue

- **Analytics**: Instala GA4 para ver tráfico.
- **Uptime**: Usa herramientas como UptimeRobot para monitorear disponibilidad.
- **SEO**: Monitorea rankings con keywords "tasa cambio dólar bolívar".

¡Listo! TasaDiv está diseñado para despliegues rápidos y cero mantenimiento. Si necesitas ayuda, revisa los issues del repo.
