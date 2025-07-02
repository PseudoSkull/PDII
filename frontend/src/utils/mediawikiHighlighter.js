/**
 * MediaWiki Syntax Highlighter
 * Colorizes text based on MediaWiki markup patterns
 * Supports basic wiki syntax for text formatting and structure
 */

/**
 * MediaWiki syntax patterns and their corresponding CSS classes
 * Each pattern includes regex, CSS class, and processing priority
 */
const MEDIAWIKI_PATTERNS = [
    // Headers (highest priority)
    {
      pattern: /^(={1,6})\s*(.+?)\s*\1\s*$/gm,
      className: 'mw-header',
      priority: 10,
      processor: (match, equals, content) => {
        const level = equals.length;
        return `<span class="mw-header mw-header-${level}">${equals} ${content} ${equals}</span>`;
      }
    },
  
    // Bold text
    {
      pattern: /'''([^']+?)'''/g,
      className: 'mw-bold',
      priority: 8,
      processor: (match, content) => `<span class="mw-bold">'''${content}'''</span>`
    },
  
    // Italic text
    {
      pattern: /''([^']+?)''/g,
      className: 'mw-italic',
      priority: 7,
      processor: (match, content) => `<span class="mw-italic">''${content}''</span>`
    },
  
    // Internal links
    {
      pattern: /\[\[([^\]|]+?)(\|([^\]]+?))?\]\]/g,
      className: 'mw-link',
      priority: 9,
      processor: (match, target, pipe, display) => {
        const displayText = display || target;
        return `<span class="mw-link">[[<span class="mw-link-target">${target}</span>${pipe ? `|<span class="mw-link-display">${displayText}</span>` : ''}]]</span>`;
      }
    },
  
    // External links
    {
      pattern: /\[([^\s\]]+)\s+([^\]]+?)\]/g,
      className: 'mw-external-link',
      priority: 9,
      processor: (match, url, text) => 
        `<span class="mw-external-link">[<span class="mw-url">${url}</span> <span class="mw-link-text">${text}</span>]</span>`
    },
  
    // Templates
    {
      pattern: /\{\{([^}|]+?)(\|([^}]*?))?\}\}/g,
      className: 'mw-template',
      priority: 8,
      processor: (match, name, pipe, params) => {
        return `<span class="mw-template">{{<span class="mw-template-name">${name}</span>${pipe ? `|<span class="mw-template-params">${params}</span>` : ''}}</span>`;
      }
    },
  
    // Lists (unordered)
    {
      pattern: /^(\*+)\s*(.+)$/gm,
      className: 'mw-list',
      priority: 6,
      processor: (match, bullets, content) => 
        `<span class="mw-list mw-list-unordered"><span class="mw-list-bullets">${bullets}</span> ${content}</span>`
    },
  
    // Lists (ordered)
    {
      pattern: /^(#+)\s*(.+)$/gm,
      className: 'mw-list',
      priority: 6,
      processor: (match, numbers, content) => 
        `<span class="mw-list mw-list-ordered"><span class="mw-list-numbers">${numbers}</span> ${content}</span>`
    },
  
    // Categories
    {
      pattern: /\[\[Category:([^\]]+?)\]\]/g,
      className: 'mw-category',
      priority: 5,
      processor: (match, category) => 
        `<span class="mw-category">[[Category:<span class="mw-category-name">${category}</span>]]</span>`
    },
  
    // Comments
    {
      pattern: /<!--(.*?)-->/gs,
      className: 'mw-comment',
      priority: 4,
      processor: (match, content) => 
        `<span class="mw-comment">&lt;!--${content}--&gt;</span>`
    },
  
    // Tables (simple detection)
    {
      pattern: /^(\{\|.*?)^\|\}$/gms,
      className: 'mw-table',
      priority: 3,
      processor: (match) => `<span class="mw-table">${match}</span>`
    },
  
    // Table rows and cells
    {
      pattern: /^\|-.*$/gm,
      className: 'mw-table-row',
      priority: 2,
      processor: (match) => `<span class="mw-table-row">${match}</span>`
    },
  
    {
      pattern: /^\|([^-].*?)$/gm,
      className: 'mw-table-cell',
      priority: 2,
      processor: (match) => `<span class="mw-table-cell">${match}</span>`
    }
  ];
  
  /**
   * Escape HTML characters to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  /**
   * Apply MediaWiki syntax highlighting to text
   * @param {string} text - Raw MediaWiki text
   * @returns {string} HTML with syntax highlighting
   */
  export function highlightMediaWiki(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
  
    // Escape HTML first
    let processedText = escapeHtml(text);
  
    // Sort patterns by priority (highest first)
    const sortedPatterns = [...MEDIAWIKI_PATTERNS].sort((a, b) => b.priority - a.priority);
  
    // Apply each pattern
    for (const { pattern, processor } of sortedPatterns) {
      processedText = processedText.replace(pattern, processor);
    }
  
    return processedText;
  }
  
  /**
   * Get CSS styles for MediaWiki syntax highlighting
   * Returns a string of CSS rules for styling highlighted elements
   * @returns {string} CSS styles
   */
  export function getMediaWikiStyles() {
    return `
      /* MediaWiki Syntax Highlighting Styles */
      .mediawiki-editor {
        font-family: 'Courier New', 'Monaco', 'Menlo', monospace;
        line-height: 1.5;
        color: #e8e8e8;
        background: #1a1a1a;
      }
  
      /* Headers */
      .mw-header {
        color: #4fc3f7;
        font-weight: bold;
      }
      .mw-header-1 { font-size: 1.5em; }
      .mw-header-2 { font-size: 1.4em; }
      .mw-header-3 { font-size: 1.3em; }
      .mw-header-4 { font-size: 1.2em; }
      .mw-header-5 { font-size: 1.1em; }
      .mw-header-6 { font-size: 1.05em; }
  
      /* Text formatting */
      .mw-bold {
        color: #ffeb3b;
        font-weight: bold;
      }
  
      .mw-italic {
        color: #ff9800;
        font-style: italic;
      }
  
      /* Links */
      .mw-link {
        color: #81c784;
      }
      .mw-link-target {
        color: #66bb6a;
        text-decoration: underline;
      }
      .mw-link-display {
        color: #a5d6a7;
      }
  
      .mw-external-link {
        color: #64b5f6;
      }
      .mw-url {
        color: #42a5f5;
        text-decoration: underline;
      }
      .mw-link-text {
        color: #90caf9;
      }
  
      /* Templates */
      .mw-template {
        color: #e1bee7;
        background: rgba(186, 104, 200, 0.1);
        border-radius: 2px;
        padding: 1px 2px;
      }
      .mw-template-name {
        color: #ce93d8;
        font-weight: bold;
      }
      .mw-template-params {
        color: #f8bbd9;
      }
  
      /* Lists */
      .mw-list {
        color: #fff176;
      }
      .mw-list-bullets,
      .mw-list-numbers {
        color: #ffcc02;
        font-weight: bold;
      }
  
      /* Categories */
      .mw-category {
        color: #ffab40;
        background: rgba(255, 171, 64, 0.1);
        border-radius: 2px;
        padding: 1px 2px;
      }
      .mw-category-name {
        color: #ffc947;
        font-weight: bold;
      }
  
      /* Comments */
      .mw-comment {
        color: #757575;
        font-style: italic;
        opacity: 0.8;
      }
  
      /* Tables */
      .mw-table {
        color: #4db6ac;
        background: rgba(77, 182, 172, 0.05);
      }
      .mw-table-row {
        color: #26a69a;
        font-weight: bold;
      }
      .mw-table-cell {
        color: #80cbc4;
      }
  
      /* General highlighting improvements */
      .mediawiki-editor .mw-highlight {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 2px;
        padding: 0 1px;
      }
    `;
  }
  
  /**
   * Create a style element and inject MediaWiki CSS into the document
   * Call this once when the component mounts
   */
  export function injectMediaWikiStyles() {
    // Check if styles are already injected
    if (document.getElementById('mediawiki-highlighter-styles')) {
      return;
    }
  
    const styleElement = document.createElement('style');
    styleElement.id = 'mediawiki-highlighter-styles';
    styleElement.textContent = getMediaWikiStyles();
    document.head.appendChild(styleElement);
  }
  
  /**
   * Remove MediaWiki styles from the document
   * Call this when the component unmounts if needed
   */
  export function removeMediaWikiStyles() {
    const styleElement = document.getElementById('mediawiki-highlighter-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }
  
  /**
   * Debounce function to limit how often highlighting is performed
   * @param {Function} func - Function to debounce
   * @param {number} wait - Wait time in milliseconds
   * @returns {Function} Debounced function
   */
  export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }