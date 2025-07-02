import React, { useState, useEffect, useRef } from 'react';
import { 
  highlightMediaWiki, 
  injectMediaWikiStyles, 
  debounce 
} from '../utils/mediawikiHighlighter';

/**
 * Transcribe component - OCR and text processing interface
 * Features a large text editor with MediaWiki syntax highlighting
 */
function Transcribe() {
  const [text, setText] = useState('');
  const [highlightedHtml, setHighlightedHtml] = useState('');
  const textareaRef = useRef(null);
  const overlayRef = useRef(null);

  // Sample MediaWiki text for demonstration
  const sampleText = `= Main Heading =

This is a sample '''bold text''' and ''italic text'' demonstration.

== Sub Heading ==

Here's an internal link: [[Wikipedia:Manual of Style|Style Guide]]
And an external link: [https://www.mediawiki.org MediaWiki Documentation]

=== Lists ===

* First item
* Second item
** Nested item
** Another nested item

# Numbered item
# Another numbered item

{{Template|param1=value1|param2=value2}}

[[Category:Sample Category]]

<!-- This is a comment -->

{| class="wikitable"
|-
! Header 1 !! Header 2
|-
| Cell 1 || Cell 2
|-
| Cell 3 || Cell 4
|}`;

  // Debounced highlighting function to improve performance
  const debouncedHighlight = debounce((textToHighlight) => {
    const highlighted = highlightMediaWiki(textToHighlight);
    setHighlightedHtml(highlighted);
  }, 300);

  // Handle text changes
  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    debouncedHighlight(newText);
    syncScroll();
  };

  // Synchronize scroll position between textarea and highlight overlay
  const syncScroll = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Load sample text
  const loadSample = () => {
    setText(sampleText);
    debouncedHighlight(sampleText);
  };

  // Clear text
  const clearText = () => {
    setText('');
    setHighlightedHtml('');
  };

  // Initialize component
  useEffect(() => {
    // Inject MediaWiki styles
    injectMediaWikiStyles();
    
    // Set initial sample text
    setText(sampleText);
    setHighlightedHtml(highlightMediaWiki(sampleText));
  }, []);

  // Update highlighting when text changes
  useEffect(() => {
    if (text) {
      debouncedHighlight(text);
    }
  }, [text, debouncedHighlight]);

  return (
    <div className="section-container">
      <div className="section-header">
        <div className="header-ornament left"></div>
        <div className="header-content">
          <h2 className="section-title">TRANSCRIBE</h2>
          <p className="section-subtitle">Optical Character Recognition & Text Extraction</p>
        </div>
        <div className="header-ornament right"></div>
      </div>

      <div className="transcribe-content">
        {/* Editor Controls */}
        <div className="editor-controls">
          <button onClick={loadSample} className="btn-secondary">
            Load Sample Text
          </button>
          <button onClick={clearText} className="btn-secondary">
            Clear
          </button>
          <div className="editor-info">
            <span className="text-counter">
              {text.length} characters | {text.split('\n').length} lines
            </span>
          </div>
        </div>

        {/* MediaWiki Editor */}
        <div className="mediawiki-editor-container">
          <div className="editor-label">
            <span>📝 MediaWiki Text Editor</span>
            <span className="editor-hint">Type or paste MediaWiki markup for live syntax highlighting</span>
          </div>
          
          <div className="editor-wrapper">
            {/* Syntax highlighting overlay */}
            <div 
              ref={overlayRef}
              className="syntax-overlay mediawiki-editor"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
              onScroll={syncScroll}
            />
            
            {/* Actual textarea */}
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onScroll={syncScroll}
              className="editor-textarea"
              placeholder="Paste OCR text here or type MediaWiki markup...

Examples:
= Header =
'''Bold text'''
''Italic text''
[[Internal Link]]
[https://example.com External Link]
{{Template}}
* List item
# Numbered list
[[Category:Example]]"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Quick Reference */}
        <div className="syntax-reference">
          <h4>🎨 MediaWiki Syntax Quick Reference</h4>
          <div className="reference-grid">
            <div className="reference-item">
              <code>= Header =</code>
              <span>Headers (1-6 levels)</span>
            </div>
            <div className="reference-item">
              <code>'''Bold'''</code>
              <span>Bold text</span>
            </div>
            <div className="reference-item">
              <code>''Italic''</code>
              <span>Italic text</span>
            </div>
            <div className="reference-item">
              <code>[[Link]]</code>
              <span>Internal link</span>
            </div>
            <div className="reference-item">
              <code>[URL Text]</code>
              <span>External link</span>
            </div>
            <div className="reference-item">
              <code>{"{{Template}}"}</code>
              <span>Template</span>
            </div>
            <div className="reference-item">
              <code>* List</code>
              <span>Bullet list</span>
            </div>
            <div className="reference-item">
              <code># List</code>
              <span>Numbered list</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Transcribe;