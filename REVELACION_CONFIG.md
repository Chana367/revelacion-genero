# Configuración de la App de Revelación de Género

## Descripción
Esta aplicación está diseñada para crear suspense y emoción alrededor de la revelación del género de un bebé. Incluye un contador regresivo que no puede ser manipulado cambiando la fecha del dispositivo.

## Características Principales

### 🕐 Contador Regresivo Seguro
- **Fecha fija del servidor**: La fecha de revelación está hardcodeada en el servicio
- **Verificación de integridad**: Usa una API externa (World Time API) para verificar que la fecha local no haya sido manipulada
- **Protección contra manipulación**: Si detecta una diferencia significativa entre la hora local y del servidor, muestra una advertencia

### 🎨 Diseño Atractivo
- **Gradiente de fondo**: Colores suaves que evocan la ternura de un bebé
- **Iconos animados**: Emojis de bebés y efectos visuales
- **Responsive**: Se adapta a diferentes tamaños de pantalla
- **Tema rosa/azul**: Colores tradicionales para niño/niña

### 📱 Navegación
- **Página principal**: Home con el contador
- **Tabs adicionales**: Acceso a otras funcionalidades (galería de fotos, etc.)

## Configuración de la Fecha de Revelación

### Cambiar la Fecha
Para cambiar la fecha de revelación, edita el archivo:
```
src/app/services/countdown.service.ts
```

Modifica la línea:
```typescript
private readonly REVEAL_DATE = new Date('2024-12-31T15:00:00');
```

**Formato de la fecha:**
- `YYYY-MM-DDTHH:mm:ss`
- Ejemplo: `'2024-12-25T18:30:00'` (25 de diciembre de 2024 a las 6:30 PM)

### Cambiar el Género Revelado
Para cambiar el resultado de la revelación, edita el archivo:
```
src/app/reveal/reveal.page.ts
```

Modifica la línea:
```typescript
private readonly GENDER = 'niña'; // Cambiar a 'niño' o 'niña'
```

**Opciones disponibles:**
- `'niña'` - Mostrará iconos rosas, emoji de niña y mensajes femeninos
- `'niño'` - Mostrará iconos azules, emoji de niño y mensajes masculinos

### Zona Horaria
La aplicación usa la zona horaria de México City por defecto. Para cambiar la zona horaria, modifica:
```typescript
private readonly TIME_API_URL = 'https://worldtimeapi.org/api/timezone/America/Mexico_City';
```

**Zonas horarias disponibles:**
- `America/Mexico_City` (México)
- `America/New_York` (Estados Unidos - Este)
- `America/Los_Angeles` (Estados Unidos - Oeste)
- `Europe/Madrid` (España)
- `America/Argentina/Buenos_Aires` (Argentina)

## Seguridad contra Manipulación

### Cómo Funciona
1. **Fecha Fija**: La fecha está hardcodeada en el código, no en una variable que se pueda cambiar fácilmente
2. **Verificación de Servidor**: Compara la hora local con una API externa confiable
3. **Advertencia Visual**: Si hay discrepancia, muestra un mensaje de advertencia
4. **Tolerancia**: Permite hasta 5 minutos de diferencia (para compensar latencia de red)

### Limitaciones
- Requiere conexión a internet para la verificación completa
- Si no hay internet, usa la fecha local como fallback
- Un usuario muy técnico podría manipular el código fuente (pero requiere conocimientos avanzados)

## Comandos de Desarrollo

### Ejecutar en desarrollo
```bash
ionic serve
```

### Construir para producción
```bash
ionic build --prod
```

### Ejecutar en dispositivo Android
```bash
ionic capacitor run android
```

### Ejecutar en dispositivo iOS
```bash
ionic capacitor run ios
```

## Personalización Adicional

### Cambiar Colores
Edita el archivo `src/app/home/home.page.scss` para cambiar:
- Colores del gradiente de fondo
- Colores de los números del contador
- Colores de los iconos

### Cambiar Textos
Edita el archivo `src/app/home/home.page.html` para cambiar:
- Título principal
- Mensajes del contador
- Textos de botones

### Cambiar Iconos
Los iconos de bebé se pueden cambiar en el HTML:
```html
<span class="baby-icon blue">👶🏻</span>  <!-- Icono de bebé -->
<span class="question-icon">❓</span>      <!-- Icono de pregunta -->
```

## API Externa Utilizada

**World Time API**: `https://worldtimeapi.org/api/timezone/America/Mexico_City`

Esta API proporciona la hora actual del servidor para verificar la integridad del tiempo local.

**Respuesta de ejemplo:**
```json
{
  "datetime": "2024-12-31T15:30:45.123456-06:00",
  "timezone": "America/Mexico_City"
}
```

## Notas Importantes

1. **Fecha UTC**: Las fechas se manejan en hora local del usuario
2. **Persistencia**: La fecha está en el código, no en base de datos
3. **Actualizaciones**: Para cambiar la fecha después de publicar, necesitas actualizar la app
4. **Conexión**: La verificación de integridad requiere internet, pero el contador funciona offline

## Próximas Mejoras Sugeridas

- [ ] Agregar sonidos y efectos
- [ ] Animación de revelación más elaborada
- [ ] Integración con redes sociales para compartir
- [ ] Histórico de revelaciones
- [ ] Notificaciones push para el momento de la revelación
- [ ] Galería de fotos relacionadas
- [ ] Modo oscuro/claro
- [ ] Múltiples idiomas