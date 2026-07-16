/*
 * Copyright (C) 2026 kristol07
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <https://www.gnu.org/licenses/>.
 */
(() => {
    const helperKey = '__NOTEBOOKLM_EXPORT_RICH_TEXT__';
    if (globalThis[helperKey]) {
        return;
    }

    const SYMBOL_TO_LATEX = {
        'ℏ': '\\hbar',
        '∂': '\\partial',
        '∞': '\\infty',
        '∑': '\\sum',
        '∏': '\\prod',
        '∫': '\\int',
        '∮': '\\oint',
        '√': '\\sqrt',
        '±': '\\pm',
        '∓': '\\mp',
        '×': '\\times',
        '÷': '\\div',
        '·': '\\cdot',
        '≤': '\\le',
        '≥': '\\ge',
        '≠': '\\ne',
        '≈': '\\approx',
        '≡': '\\equiv',
        '∝': '\\propto',
        '∈': '\\in',
        '∉': '\\notin',
        '⊂': '\\subset',
        '⊆': '\\subseteq',
        '⊃': '\\supset',
        '⊇': '\\supseteq',
        '∪': '\\cup',
        '∩': '\\cap',
        '∧': '\\land',
        '∨': '\\lor',
        '¬': '\\neg',
        '→': '\\to',
        '←': '\\leftarrow',
        '↔': '\\leftrightarrow',
        '⇒': '\\Rightarrow',
        '⇐': '\\Leftarrow',
        '⇔': '\\Leftrightarrow',
        '∇': '\\nabla',
        'ℓ': '\\ell',
        'ℜ': '\\Re',
        'ℑ': '\\Im',
        '∅': '\\varnothing',
        '…': '\\ldots',
        '⋯': '\\cdots',
        '′': "'",
        '″': "''",
        '−': '-',
        '∣': '|',
        '‖': '\\|',
        'α': '\\alpha',
        'β': '\\beta',
        'γ': '\\gamma',
        'δ': '\\delta',
        'ε': '\\epsilon',
        'ϵ': '\\varepsilon',
        'ζ': '\\zeta',
        'η': '\\eta',
        'θ': '\\theta',
        'ϑ': '\\vartheta',
        'ι': '\\iota',
        'κ': '\\kappa',
        'λ': '\\lambda',
        'μ': '\\mu',
        'ν': '\\nu',
        'ξ': '\\xi',
        'π': '\\pi',
        'ϖ': '\\varpi',
        'ρ': '\\rho',
        'ϱ': '\\varrho',
        'σ': '\\sigma',
        'ς': '\\varsigma',
        'τ': '\\tau',
        'υ': '\\upsilon',
        'φ': '\\phi',
        'ϕ': '\\varphi',
        'χ': '\\chi',
        'ψ': '\\psi',
        'ω': '\\omega',
        'Γ': '\\Gamma',
        'Δ': '\\Delta',
        'Θ': '\\Theta',
        'Λ': '\\Lambda',
        'Ξ': '\\Xi',
        'Π': '\\Pi',
        'Σ': '\\Sigma',
        'Υ': '\\Upsilon',
        'Φ': '\\Phi',
        'Ψ': '\\Psi',
        'Ω': '\\Omega',
        '{': '\\{',
        '}': '\\}',
        '#': '\\#',
        '%': '\\%',
        '&': '\\&'
    };

    const OPERATOR_NAMES = new Set([
        'arccos',
        'arcsin',
        'arctan',
        'arg',
        'cos',
        'cosh',
        'cot',
        'coth',
        'csc',
        'deg',
        'det',
        'dim',
        'exp',
        'gcd',
        'hom',
        'inf',
        'ker',
        'lg',
        'lim',
        'liminf',
        'limsup',
        'ln',
        'log',
        'max',
        'min',
        'mod',
        'Pr',
        'sec',
        'sin',
        'sinh',
        'sup',
        'tan',
        'tanh'
    ]);

    const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ');

    const formatCitation = (ariaLabel, fallback) => {
        const label = ariaLabel && ariaLabel.trim();
        if (label) {
            const match = label.match(/^(\d+)\s*:\s*(.+)$/);
            if (match) {
                return { id: match[1], source: match[2] };
            }
            return { id: label, source: label };
        }
        const text = fallback && fallback.trim();
        if (text) {
            return { id: text, source: text };
        }
        return null;
    };

    const mapMathText = (value) => {
        const normalized = String(value || '')
            .replace(/[\u200b\u2060]/g, '')
            .replace(/\u00a0/g, '')
            .replace(/\s+/g, '');
        const characters = Array.from(normalized);
        return characters
            .map((character, index) => {
                const mapped = SYMBOL_TO_LATEX[character] || character;
                const nextCharacter = characters[index + 1] || '';
                if (/^\\[A-Za-z]+$/.test(mapped) && /^[A-Za-z]$/.test(nextCharacter)) {
                    return `${mapped} `;
                }
                return mapped;
            })
            .join('');
    };

    const escapeLatexText = (value) =>
        String(value || '')
            .replace(/[\u200b\u2060]/g, '')
            .replace(/\u00a0/g, ' ')
            .replace(/\\/g, '\\textbackslash{}')
            .replace(/([{}#$%&_])/g, '\\$1')
            .replace(/\s+/g, ' ')
            .trim();

    const getTopValue = (element) => {
        const directValue = element && element.style ? element.style.top : '';
        const fallbackMatch = (element && element.getAttribute('style') || '').match(/(?:^|;)\s*top\s*:\s*(-?[\d.]+)/i);
        const parsed = Number.parseFloat(directValue || (fallbackMatch ? fallbackMatch[1] : ''));
        return Number.isFinite(parsed) ? parsed : 0;
    };

    const getPrimaryVListEntries = (element, readNode) => {
        const vlist = element && element.querySelector ? element.querySelector('.vlist') : null;
        if (!vlist) {
            return [];
        }
        return Array.from(vlist.children)
            .filter((child) => !child.classList.contains('vlist-s'))
            .map((child) => ({
                element: child,
                top: getTopValue(child),
                value: readNode(child)
            }))
            .filter((entry) => entry.value.length > 0);
    };

    const normalizeLatex = (value) =>
        String(value || '')
            .replace(/[\u200b\u2060]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

    const stripMathDelimiters = (value) => {
        const normalized = normalizeLatex(value);
        if (normalized.startsWith('$$') && normalized.endsWith('$$') && normalized.length > 4) {
            return normalized.slice(2, -2).trim();
        }
        if (normalized.startsWith('$') && normalized.endsWith('$') && normalized.length > 2) {
            return normalized.slice(1, -1).trim();
        }
        if (normalized.startsWith('\\[') && normalized.endsWith('\\]')) {
            return normalized.slice(2, -2).trim();
        }
        if (normalized.startsWith('\\(') && normalized.endsWith('\\)')) {
            return normalized.slice(2, -2).trim();
        }
        return normalized;
    };

    const katexHtmlToLatex = (katexElement) => {
        const htmlRoot = katexElement.querySelector('.katex-html') || katexElement;
        const joinLatexParts = (parts) =>
            parts.reduce((combined, part) => {
                if (/\\[A-Za-z]+$/.test(combined) && /^[A-Za-z]/.test(part)) {
                    return `${combined} ${part}`;
                }
                return combined + part;
            }, '');

        const readNode = (node) => {
            if (!node) {
                return '';
            }
            if (node.nodeType === Node.TEXT_NODE) {
                return mapMathText(node.textContent || '');
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return '';
            }

            const element = node;
            const tagName = element.tagName.toLowerCase();
            if (
                tagName === 'svg'
                || tagName === 'path'
                || element.classList.contains('strut')
                || element.classList.contains('pstrut')
                || element.classList.contains('vlist-s')
                || element.classList.contains('frac-line')
                || element.classList.contains('overline-line')
                || element.classList.contains('underline-line')
                || element.classList.contains('mspace')
                || element.classList.contains('nulldelimiter')
                || element.classList.contains('katex-mathml')
            ) {
                return '';
            }

            if (element.classList.contains('mfrac')) {
                const entries = getPrimaryVListEntries(element, readNode)
                    .filter((entry) => !entry.element.querySelector('.frac-line'))
                    .sort((left, right) => left.top - right.top);
                if (entries.length >= 2) {
                    return `\\frac{${entries[0].value}}{${entries[entries.length - 1].value}}`;
                }
            }

            if (element.classList.contains('sqrt')) {
                const root = Array.from(element.children).find((child) => child.classList.contains('root'));
                const degree = root ? readNode(root) : '';
                const svgAlign = element.querySelector('.svg-align');
                const radicand = svgAlign ? readNode(svgAlign) : '';
                if (radicand) {
                    return degree ? `\\sqrt[${degree}]{${radicand}}` : `\\sqrt{${radicand}}`;
                }
            }

            if (element.classList.contains('overline')) {
                const entries = getPrimaryVListEntries(element, readNode)
                    .filter((entry) => !entry.element.querySelector('.overline-line'));
                if (entries[0]) {
                    return `\\overline{${entries[0].value}}`;
                }
            }

            if (element.classList.contains('underline')) {
                const entries = getPrimaryVListEntries(element, readNode)
                    .filter((entry) => !entry.element.querySelector('.underline-line'));
                if (entries[0]) {
                    return `\\underline{${entries[0].value}}`;
                }
            }

            if (element.classList.contains('accent')) {
                const entries = getPrimaryVListEntries(element, readNode);
                const baseEntry = entries.find((entry) => !entry.element.querySelector('.accent-body'));
                const accentEntry = entries.find((entry) => entry.element.querySelector('.accent-body'));
                if (baseEntry) {
                    const accentBody = accentEntry && accentEntry.element.querySelector('.accent-body');
                    if (accentBody && accentBody.querySelector('.overlay')) {
                        return `\\vec{${baseEntry.value}}`;
                    }
                    const accentText = normalizeWhitespace(accentBody ? accentBody.textContent : '').trim();
                    const command = {
                        '^': '\\hat',
                        '¯': '\\bar',
                        'ˉ': '\\bar',
                        '~': '\\tilde',
                        '˜': '\\tilde',
                        '˙': '\\dot',
                        '¨': '\\ddot',
                        '˘': '\\breve',
                        'ˇ': '\\check',
                        '´': '\\acute',
                        '`': '\\grave'
                    }[accentText] || '\\hat';
                    return `${command}{${baseEntry.value}}`;
                }
            }

            if (element.classList.contains('msupsub')) {
                const entries = getPrimaryVListEntries(element, readNode).sort((left, right) => left.top - right.top);
                if (entries.length >= 2) {
                    const superscript = entries[0].value;
                    const subscript = entries[entries.length - 1].value;
                    return `_{${subscript}}^{${superscript}}`;
                }
                if (entries.length === 1) {
                    return entries[0].top <= -2.8
                        ? `^{${entries[0].value}}`
                        : `_{${entries[0].value}}`;
                }
            }

            if (element.classList.contains('op-limits')) {
                const entries = getPrimaryVListEntries(element, readNode).sort((left, right) => left.top - right.top);
                const operatorIndex = entries.findIndex((entry) => entry.element.querySelector('.op-symbol'));
                if (operatorIndex >= 0) {
                    const operator = entries[operatorIndex].value;
                    const superscript = operatorIndex > 0 ? entries[0].value : '';
                    const subscript = operatorIndex < entries.length - 1 ? entries[entries.length - 1].value : '';
                    return `${operator}${subscript ? `_{${subscript}}` : ''}${superscript ? `^{${superscript}}` : ''}`;
                }
            }

            if (element.classList.contains('mtable')) {
                const columns = Array.from(element.children)
                    .filter((child) => Array.from(child.classList).some((className) => className.startsWith('col-align-')))
                    .map((column) => getPrimaryVListEntries(column, readNode).sort((left, right) => left.top - right.top));
                const rowCount = columns.reduce((maximum, column) => Math.max(maximum, column.length), 0);
                if (rowCount > 0) {
                    const rows = Array.from({ length: rowCount }, (_, rowIndex) =>
                        columns.map((column) => column[rowIndex] ? column[rowIndex].value : '').join(' & ')
                    );
                    return `\\begin{matrix}${rows.join('\\\\')}\\end{matrix}`;
                }
            }

            if (element.classList.contains('minner')) {
                const table = element.querySelector('.mtable');
                if (table) {
                    const open = Array.from(element.children).find((child) => child.classList.contains('mopen'));
                    const close = Array.from(element.children).find((child) => child.classList.contains('mclose'));
                    const delimiterKey = `${normalizeWhitespace(open ? open.textContent : '').trim()}${normalizeWhitespace(close ? close.textContent : '').trim()}`;
                    const environment = {
                        '[]': 'bmatrix',
                        '()': 'pmatrix',
                        '{}': 'Bmatrix',
                        '∣∣': 'vmatrix',
                        '‖‖': 'Vmatrix'
                    }[delimiterKey];
                    const matrix = readNode(table);
                    if (environment && matrix) {
                        return matrix
                            .replace('\\begin{matrix}', `\\begin{${environment}}`)
                            .replace('\\end{matrix}', `\\end{${environment}}`);
                    }
                }
            }

            if (element.classList.contains('text')) {
                const content = escapeLatexText(element.textContent || '');
                return content ? `\\text{${content}}` : '';
            }

            let content = joinLatexParts(Array.from(element.childNodes).map((child) => readNode(child)));
            if (!content && element.childNodes.length === 0) {
                content = mapMathText(element.textContent || '');
            }

            if (element.classList.contains('mop') && !element.querySelector('.op-symbol')) {
                const operatorName = content.replace(/[^A-Za-z]/g, '');
                if (OPERATOR_NAMES.has(operatorName)) {
                    content = content.replace(operatorName, `\\${operatorName}`);
                }
            }

            const fontCommand = [
                ['mathbf', '\\mathbf'],
                ['mathbb', '\\mathbb'],
                ['mathcal', '\\mathcal'],
                ['mathfrak', '\\mathfrak'],
                ['mathsf', '\\mathsf'],
                ['mathtt', '\\mathtt'],
                ['mathrm', '\\mathrm'],
                ['mathit', '\\mathit']
            ].find(([className]) => element.classList.contains(className));
            if (fontCommand && content) {
                return `${fontCommand[1]}{${content}}`;
            }

            return content;
        };

        return normalizeLatex(readNode(htmlRoot));
    };

    const sanitizeKatexHtml = (root) => {
        const clone = root.cloneNode(true);
        clone.querySelectorAll('.katex-mathml, script, style, link, iframe, object, embed').forEach((node) => node.remove());
        clone.querySelectorAll('*').forEach((node) => {
            Array.from(node.attributes).forEach((attribute) => {
                if (/^on/i.test(attribute.name) || attribute.name === 'src' || attribute.name === 'href') {
                    node.removeAttribute(attribute.name);
                }
            });
        });
        return clone.outerHTML;
    };

    const collectMathExpression = (element) => {
        const katexElement = element.classList.contains('katex')
            ? element
            : element.querySelector('.katex');
        if (!katexElement) {
            return null;
        }

        const displayRoot = element.classList.contains('katex-display')
            ? element
            : katexElement.closest('.katex-display');
        const display = Boolean(displayRoot);
        const annotation = katexElement.querySelector(
            '.katex-mathml annotation[encoding="application/x-tex"], annotation[encoding="application/x-tex"]'
        );
        const attributeCandidates = [
            katexElement.getAttribute('data-tex'),
            katexElement.getAttribute('data-latex'),
            katexElement.getAttribute('data-formula'),
            displayRoot && displayRoot.getAttribute('data-tex'),
            displayRoot && displayRoot.getAttribute('data-latex')
        ];
        const exactLatex = annotation && annotation.textContent
            ? annotation.textContent
            : attributeCandidates.find((value) => value && value.trim());
        const reconstructed = exactLatex || katexHtmlToLatex(katexElement);
        const latex = stripMathDelimiters(reconstructed || katexElement.textContent || '');
        if (!latex) {
            return null;
        }

        return {
            latex,
            html: sanitizeKatexHtml(displayRoot || katexElement),
            display
        };
    };

    const shouldSkipLineNumber = (node) => {
        if (node.nodeType !== Node.TEXT_NODE) {
            return false;
        }
        const parent = node.parentElement;
        if (!parent || !parent.matches('span[data-start-index]')) {
            return false;
        }
        const paragraph = parent.closest('.paragraph');
        if (!paragraph || !paragraph.hasAttribute('data-start-index')) {
            return false;
        }
        return /^\s*\d+\s*$/.test(node.textContent || '');
    };

    const trimInlines = (inlines) => {
        if (inlines.length === 0) {
            return inlines;
        }
        inlines[0].text = inlines[0].text.replace(/^\s+/, '');
        inlines[inlines.length - 1].text = inlines[inlines.length - 1].text.replace(/\s+$/, '');
        return inlines.filter((inline) => inline.text.length > 0 || inline.citation || inline.math);
    };

    const pushInline = (inlines, text, style) => {
        const normalized = normalizeWhitespace(text);
        if (normalized.trim().length === 0) {
            return;
        }
        const last = inlines[inlines.length - 1];
        if (
            last
            && !last.citation
            && !last.math
            && last.bold === style.bold
            && last.italic === style.italic
        ) {
            last.text += normalized;
            return;
        }
        inlines.push({ text: normalized, bold: style.bold, italic: style.italic });
    };

    const collectInlines = (element, options = {}) => {
        const inlines = [];
        const includeCitations = options.includeCitations !== false;
        const skipLineNumbers = options.skipLineNumbers === true;

        const walk = (node, style) => {
            if (node.nodeType === Node.TEXT_NODE) {
                if (!skipLineNumbers || !shouldSkipLineNumber(node)) {
                    pushInline(inlines, node.textContent || '', style);
                }
                return;
            }
            if (node.nodeType !== Node.ELEMENT_NODE) {
                return;
            }

            const current = node;
            if (current.classList.contains('katex-display') || current.classList.contains('katex')) {
                const math = collectMathExpression(current);
                if (math) {
                    inlines.push({ text: '', ...style, math });
                }
                return;
            }

            if (current.matches('span[aria-label]')) {
                const ariaLabel = current.getAttribute('aria-label');
                if (ariaLabel && /^\d+\s*:/.test(ariaLabel)) {
                    const citation = formatCitation(ariaLabel, current.textContent);
                    if (citation && includeCitations) {
                        inlines.push({ text: '', ...style, citation });
                    } else if (citation) {
                        pushInline(inlines, `[${citation.id}]`, style);
                    }
                    return;
                }
            }

            const nextStyle = { ...style };
            if (current.tagName === 'B' || current.tagName === 'STRONG') {
                nextStyle.bold = true;
            }
            if (current.tagName === 'I' || current.tagName === 'EM') {
                nextStyle.italic = true;
            }
            current.childNodes.forEach((child) => walk(child, nextStyle));
        };

        element.childNodes.forEach((child) => walk(child, {}));
        const trimmed = trimInlines(inlines);
        if (element.tagName === 'LI' && trimmed.length > 0) {
            const list = element.closest('ol, ul');
            if (list?.tagName === 'OL') {
                const siblings = Array.from(list.querySelectorAll('li'))
                    .filter((item) => item.closest('ol, ul') === list);
                const start = Number.parseInt(list.getAttribute('start') || '1', 10);
                const index = siblings.indexOf(element);
                const number = Number.isFinite(start) && index >= 0 ? start + index : index + 1;
                trimmed.unshift({ text: `${number}. ` });
            } else {
                trimmed.unshift({ text: '• ' });
            }
        }
        return trimmed;
    };

    const collectCodeText = (element) => {
        const codeElement = element.querySelector('code') || element;
        const rawText = codeElement.textContent || '';
        return rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').replace(/\n+$/, '');
    };

    const inlineToText = (inline) => {
        if (inline.citation) {
            return `[${inline.citation.id}]`;
        }
        if (inline.math) {
            return inline.math.display
                ? `\n$$\n${inline.math.latex}\n$$\n`
                : `$${inline.math.latex}$`;
        }
        return inline.text;
    };

    const isSeparator = (inlines) => {
        const raw = inlines.map((inline) => inline.text).join('');
        const compact = raw.replace(/\s+/g, '');
        return compact.length > 0 && /^-+$/.test(compact);
    };

    globalThis[helperKey] = {
        collectCodeText,
        collectInlines,
        collectMathExpression,
        inlineToText,
        isSeparator,
        normalizeWhitespace
    };
})();
