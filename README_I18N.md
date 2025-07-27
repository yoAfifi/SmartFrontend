# SmartStock Frontend - Internationalization (i18n) Guide

This document explains the internationalization implementation in the SmartStock frontend application using Vue I18n v9+.

## Overview

The application supports English (en) and German (de) languages with the following features:
- Automatic language detection based on browser preferences
- Persistent language selection via localStorage
- Lazy loading of locale files
- Number, date, and currency formatting using Intl API
- Pluralization support

## Folder Structure

```
src/
├── locales/
│   ├── en/
│   │   ├── common.json      # Common UI elements
│   │   ├── auth.json        # Authentication related
│   │   ├── products.json    # Product management
│   │   ├── cart.json        # Shopping cart
│   │   ├── orders.json      # Order management
│   │   ├── customers.json   # Customer management
│   │   ├── dashboard.json   # Dashboard and statistics
│   │   └── index.js         # Combines all English translations
│   └── de/
│       ├── common.json      # German translations
│       ├── auth.json
│       ├── products.json
│       ├── cart.json
│       ├── orders.json
│       ├── customers.json
│       ├── dashboard.json
│       └── index.js         # Combines all German translations
├── i18n/
│   └── index.js             # Main i18n configuration
└── composables/
    └── useI18nFormatters.js # Number, date, currency formatters
```

## Key Naming Conventions

### Translation Keys
- Use dot notation for nested keys: `section.subsection.key`
- Use descriptive, hierarchical names: `auth.login.title`, `products.createProduct`
- Keep keys consistent across locales
- Use lowercase with camelCase for multi-word keys

### File Organization
- Group related translations in separate files (auth, products, etc.)
- Use `common.json` for shared UI elements
- Keep file names descriptive and consistent

## Usage

### Basic Translation
```vue
<template>
  <h1>{{ $t('auth.login.title') }}</h1>
  <p>{{ $t('brand.tagline') }}</p>
</template>
```

### In Script Setup
```vue
<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const message = t('common.success')
</script>
```

### Number and Currency Formatting
```vue
<script setup>
import { useI18nFormatters } from '@/composables/useI18nFormatters'

const { formatCurrency, formatNumber } = useI18nFormatters()

// Format currency (EUR)
const price = formatCurrency(55.99) // €55.99 (EN) or 55,99 € (DE)

// Format numbers
const quantity = formatNumber(1234.56) // 1,234.56 (EN) or 1.234,56 (DE)
</script>
```

### Date and Time Formatting
```vue
<script setup>
import { useI18nFormatters } from '@/composables/useI18nFormatters'

const { formatDate, formatDateTime } = useI18nFormatters()

// Format dates
const orderDate = formatDate(new Date()) // July 27, 2025 (EN) or 27. Juli 2025 (DE)

// Format date and time
const timestamp = formatDateTime(new Date()) // 07/27/2025, 06:30 AM (EN) or 27.07.2025, 06:30 (DE)
</script>
```

### Pluralization
```vue
<template>
  <p>{{ $tc('cart.items', itemCount) }}</p>
</template>

<script setup>
import { ref } from 'vue'
const itemCount = ref(2)
</script>
```

Translation file:
```json
{
  "cart": {
    "items": "no items | one item | {count} items"
  }
}
```

## Language Switching

### Programmatic Language Switching
```vue
<script setup>
import { setLocale } from '@/i18n'

const switchToGerman = async () => {
  await setLocale('de')
}
</script>
```

### Language Switcher Component
The `LanguageSwitcher` component is automatically included in the main layout and provides:
- Visual language selection dropdown
- Flag icons for each language
- Automatic persistence of selection

## Adding New Translations

### 1. Add Keys to English Files
```json
// src/locales/en/products.json
{
  "products": {
    "newFeature": "New Feature",
    "description": "This is a new feature"
  }
}
```

### 2. Add German Translations
```json
// src/locales/de/products.json
{
  "products": {
    "newFeature": "Neue Funktion",
    "description": "Das ist eine neue Funktion"
  }
}
```

### 3. Use in Components
```vue
<template>
  <h2>{{ $t('products.newFeature') }}</h2>
  <p>{{ $t('products.description') }}</p>
</template>
```

## Adding New Locales

### 1. Create Locale Directory
```
src/locales/fr/
├── common.json
├── auth.json
├── products.json
└── index.js
```

### 2. Update i18n Configuration
```javascript
// src/i18n/index.js
import frMessages from '../locales/fr/index.js'

const i18n = createI18n({
  // ... existing config
  messages: {
    en: enMessages,
    de: deMessages,
    fr: frMessages // Add new locale
  }
})

export const availableLocales = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' } // Add new locale
]
```

## Development Workflow

### Missing Key Detection
In development mode, missing translation keys will be logged to the console. This helps identify untranslated text.

### Translation Validation
- Ensure all keys exist in both English and German
- Check for consistent naming conventions
- Verify pluralization rules for both languages

### Testing
1. Switch between languages using the language switcher
2. Verify all text is properly translated
3. Test number, date, and currency formatting
4. Check pluralization with different counts
5. Verify layout stability with longer German text

## Best Practices

### Text Length Considerations
- German translations are often longer than English
- Test UI components with both languages
- Use CSS truncation and tooltips for long text
- Consider responsive design for different text lengths

### Accessibility
- Ensure ARIA labels are translated
- Maintain proper heading hierarchy
- Test with screen readers in both languages

### Performance
- Locale files are loaded on-demand
- Only active locale is included in the initial bundle
- Consider code-splitting for large translation files

## Troubleshooting

### Common Issues

1. **Translation keys not showing**: Check if the key exists in the locale file
2. **Language not switching**: Verify localStorage permissions and i18n setup
3. **Formatting not working**: Ensure Intl API is supported in the browser
4. **Missing translations**: Check console for missing key warnings

### Debug Mode
Enable debug mode in development to see missing keys:
```javascript
// In i18n configuration
missingWarn: process.env.NODE_ENV === 'development'
```

## Future Enhancements

### SEO and URL Locales
For better SEO, consider implementing URL-based locales:
```
/en/products
/de/products
```

### Translation Management System
Consider integrating with a TMS like:
- Locize
- Phrase
- Crowdin

### Advanced Pluralization
For languages with complex pluralization rules, consider using ICU MessageFormat.

## Support

For questions or issues with the i18n implementation, refer to:
- [Vue I18n Documentation](https://vue-i18n.intlify.dev/)
- [Intl API Documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl)
- Project maintainers 