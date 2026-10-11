# Agent Guidelines

- Always use the campaign draft over the official rules.
- Follow project house rules: rules with blue headers are used; rules written in red are not used.
- Ensure all character sheets, features, and rules references accurately reflect the campaign draft and custom options (such as cultural feats, racial traits, and subclass variants).
- Feats may be freely combined from both the cultural feat list and the general feat list; characters are not restricted to choosing feats from only one category.

## Character Sheet Template & Structure

Character records follow a modular multi-tab single-page template structure located under `characters/<character_name>/`:
- **Main Container (`<character_name>.html`)**:
  - Contains identity header, crest, portrait, subtitle, level, and navigation tabs list (`.tabs`).
  - Implements progressive enhancement: asynchronously fetches tab HTML contents into `<section data-src="tabs/...">` elements.
  - Manages accessibility (`role="tab"`, `role="tabpanel"`, `aria-selected`, `aria-controls`, `aria-labelledby`).
  - Supports keyboard navigation (ArrowLeft, ArrowRight, Home, End, Space) and history state management (`pushState`, `hashchange`, `popstate`).
  - Initializes interactive features such as feature search and category filtering (`#feature-search`, `data-filter`).
- **Tabs (`tabs/`)**:
  - `sheet.html`: Main character sheet containing core stats, ability scores, HP, and recorded features/feats list with search and category filters (`all`, `class`, `race`, `feat`, `spell`).
  - `inventory.html`: Inventory, equipment, and items list.
  - Class rules tab (e.g., `barbarian.html`): Class progression table, features, and subclass rules/paths.
  - Race rules tab (e.g., `halfling.html`): Racial traits, cultural feats, and background rules references.
  - `story.html`: Background story and narrative description.
  - `images.html`: Character portraits, artwork, and visual states.
