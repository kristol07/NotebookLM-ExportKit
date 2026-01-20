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
import { ExportFormat, ExportResult, MindmapNode } from './export-core';

type JsonCanvasNode = {
    id: string;
    type: 'text';
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
};

type JsonCanvasEdge = {
    id: string;
    fromNode: string;
    toNode: string;
    fromSide?: 'top' | 'right' | 'bottom' | 'left';
    toSide?: 'top' | 'right' | 'bottom' | 'left';
    toEnd?: 'none' | 'arrow';
    color?: string;
};

type JsonCanvasDocument = {
    nodes: JsonCanvasNode[];
    edges: JsonCanvasEdge[];
};

const SVG_NS = 'http://www.w3.org/2000/svg';

const parseTranslate = (value: string | null): { x: number; y: number } | null => {
    if (!value) return null;
    const match = value.match(/translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/);
    if (!match) return null;
    return { x: parseFloat(match[1]), y: parseFloat(match[2]) };
};

const parseNumberAttr = (value: string | null): number | null => {
    if (value === null || value === undefined) return null;
    const num = parseFloat(value);
    return Number.isFinite(num) ? num : null;
};

type TransformToken = { type: 'translate' | 'scale'; values: number[] };

const parseTransformTokens = (value: string | null): TransformToken[] => {
    if (!value) return [];
    const tokens: TransformToken[] = [];
    const regex = /(\w+)\(([^)]+)\)/g;
    let match: RegExpExecArray | null = null;
    while ((match = regex.exec(value))) {
        const type = match[1];
        const raw = match[2]
            .split(/[\s,]+/)
            .map((part) => parseFloat(part))
            .filter((num) => Number.isFinite(num));
        if (type === 'translate' && raw.length >= 1) {
            tokens.push({ type: 'translate', values: raw });
        } else if (type === 'scale' && raw.length >= 1) {
            tokens.push({ type: 'scale', values: raw });
        }
    }
    return tokens;
};

const applyTokensToPoint = (point: { x: number; y: number }, tokens: TransformToken[]) => {
    let { x, y } = point;
    for (let i = tokens.length - 1; i >= 0; i -= 1) {
        const token = tokens[i];
        if (token.type === 'translate') {
            const tx = token.values[0] ?? 0;
            const ty = token.values[1] ?? 0;
            x += tx;
            y += ty;
        } else if (token.type === 'scale') {
            const sx = token.values[0] ?? 1;
            const sy = token.values.length > 1 ? token.values[1] : sx;
            x *= sx;
            y *= sy;
        }
    }
    return { x, y };
};

const applyAncestorTransforms = (point: { x: number; y: number }, element: Element | null) => {
    let current = element;
    let output = { ...point };
    while (current && current.tagName.toLowerCase() !== 'svg') {
        const tokens = parseTransformTokens(current.getAttribute('transform'));
        if (tokens.length > 0) {
            output = applyTokensToPoint(output, tokens);
        }
        current = current.parentElement;
    }
    return output;
};

const enhanceSvg = (svgContent: string): string | null => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svg = doc.querySelector('svg');
    if (!svg) return null;

    if (!svg.getAttribute('xmlns')) {
        svg.setAttribute('xmlns', SVG_NS);
    }

    const nodes = Array.from(svg.querySelectorAll('g.node[role="treeitem"]'));
    const links = Array.from(svg.querySelectorAll('path.link'));

    const nodeMeta = new Map<
        string,
        {
            leftAnchorX: number;
            leftAnchorY: number;
            rightAnchorX: number;
            rightAnchorY: number;
        }
    >();

    nodes.forEach((node, index) => {
        const nodeId = `node-${index}`;
        node.setAttribute('data-node-id', nodeId);
        const nodeTranslate = parseTranslate(node.getAttribute('transform')) || { x: 0, y: 0 };
        const rect = node.querySelector('rect');
        const rectX = parseNumberAttr(rect ? rect.getAttribute('x') : null) ?? 0;
        const rectWidth = parseNumberAttr(rect ? rect.getAttribute('width') : null) ?? 0;
        const rectY = parseNumberAttr(rect ? rect.getAttribute('y') : null) ?? 0;
        const rectHeight = parseNumberAttr(rect ? rect.getAttribute('height') : null) ?? 0;
        const circle = node.querySelector('circle');
        const circleTranslate = parseTranslate(circle ? circle.getAttribute('transform') : null);
        const rightAnchorX = nodeTranslate.x + (circleTranslate?.x ?? rectX + rectWidth);
        const rightAnchorY = nodeTranslate.y + (circleTranslate?.y ?? 0);
        const leftAnchorX = nodeTranslate.x + rectX;
        const leftAnchorY = nodeTranslate.y;

        nodeMeta.set(nodeId, {
            leftAnchorX,
            leftAnchorY,
            rightAnchorX,
            rightAnchorY
        });
    });

    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;

    const updateBounds = (x: number, y: number) => {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
    };

    nodes.forEach((node) => {
        const nodeTranslate = parseTranslate(node.getAttribute('transform')) || { x: 0, y: 0 };
        const rect = node.querySelector('rect');
        const rectX = parseNumberAttr(rect ? rect.getAttribute('x') : null) ?? 0;
        const rectY = parseNumberAttr(rect ? rect.getAttribute('y') : null) ?? 0;
        const rectWidth = parseNumberAttr(rect ? rect.getAttribute('width') : null) ?? 0;
        const rectHeight = parseNumberAttr(rect ? rect.getAttribute('height') : null) ?? 0;

        const rectLeft = nodeTranslate.x + rectX;
        const rectTop = nodeTranslate.y + rectY;
        const rectRight = rectLeft + rectWidth;
        const rectBottom = rectTop + rectHeight;

        const rectTopLeft = applyAncestorTransforms({ x: rectLeft, y: rectTop }, node.parentElement);
        const rectBottomRight = applyAncestorTransforms({ x: rectRight, y: rectBottom }, node.parentElement);
        updateBounds(rectTopLeft.x, rectTopLeft.y);
        updateBounds(rectBottomRight.x, rectBottomRight.y);

        const circle = node.querySelector('circle');
        const circleTranslate = parseTranslate(circle ? circle.getAttribute('transform') : null);
        const circleRadius = parseNumberAttr(circle ? circle.getAttribute('r') : null) ?? 0;
        if (circleTranslate) {
            const cx = nodeTranslate.x + circleTranslate.x;
            const cy = nodeTranslate.y + circleTranslate.y;
            const topLeft = applyAncestorTransforms({ x: cx - circleRadius, y: cy - circleRadius }, node.parentElement);
            const bottomRight = applyAncestorTransforms(
                { x: cx + circleRadius, y: cy + circleRadius },
                node.parentElement
            );
            updateBounds(topLeft.x, topLeft.y);
            updateBounds(bottomRight.x, bottomRight.y);
        }
    });

    links.forEach((link) => {
        const d = link.getAttribute('d') || '';
        const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
        if (!numbers || numbers.length < 2) return;
        for (let i = 0; i + 1 < numbers.length; i += 2) {
            const x = parseFloat(numbers[i]);
            const y = parseFloat(numbers[i + 1]);
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            const point = applyAncestorTransforms({ x, y }, link.parentElement);
            updateBounds(point.x, point.y);
        }
    });

    const findNodeByAnchor = (
        x: number,
        y: number,
        anchorSelector: (meta: {
            leftAnchorX: number;
            leftAnchorY: number;
            rightAnchorX: number;
            rightAnchorY: number;
        }) => { ax: number; ay: number }
    ): string | null => {
        let bestId: string | null = null;
        let bestDistance = Number.POSITIVE_INFINITY;
        const anchorXMatches: Array<{ id: string; distance: number }> = [];

        for (const [id, meta] of nodeMeta.entries()) {
            const anchor = anchorSelector(meta);
            const dx = Math.abs(anchor.ax - x);
            if (dx <= 2) {
                const dy = Math.abs(anchor.ay - y);
                anchorXMatches.push({ id, distance: dy });
            }
        }

        if (anchorXMatches.length > 0) {
            anchorXMatches.sort((a, b) => a.distance - b.distance);
            return anchorXMatches[0].id;
        }

        for (const [id, meta] of nodeMeta.entries()) {
            const anchor = anchorSelector(meta);
            const dx = anchor.ax - x;
            const dy = anchor.ay - y;
            const distance = dx * dx + dy * dy;
            if (distance < bestDistance) {
                bestDistance = distance;
                bestId = id;
            }
        }

        return bestId;
    };

    links.forEach((link) => {
        const d = link.getAttribute('d') || '';
        const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
        if (!numbers || numbers.length < 4) return;
        const startX = parseFloat(numbers[0]);
        const startY = parseFloat(numbers[1]);
        const endX = parseFloat(numbers[numbers.length - 2]);
        const endY = parseFloat(numbers[numbers.length - 1]);
        if (![startX, startY, endX, endY].every((value) => Number.isFinite(value))) return;

        const parentId = findNodeByAnchor(startX, startY, (meta) => ({
            ax: meta.rightAnchorX,
            ay: meta.rightAnchorY
        }));
        const childId = findNodeByAnchor(endX, endY, (meta) => ({
            ax: meta.leftAnchorX,
            ay: meta.leftAnchorY
        }));
        if (!parentId || !childId || parentId === childId) return;

        link.setAttribute('data-parent-id', parentId);
        link.setAttribute('data-child-id', childId);
    });

    if (Number.isFinite(minX) && Number.isFinite(minY) && Number.isFinite(maxX) && Number.isFinite(maxY)) {
        const padding = 40;
        const controlMinX = 0;
        const controlMinY = 0;
        const controlMaxX = 180;
        const controlMaxY = 100;
        minX = Math.min(minX, controlMinX) - padding;
        minY = Math.min(minY, controlMinY) - padding;
        maxX = Math.max(maxX, controlMaxX) + padding;
        maxY = Math.max(maxY, controlMaxY) + padding;
        const width = Math.max(1, maxX - minX);
        const height = Math.max(1, maxY - minY);
        svg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`);
        svg.setAttribute('width', `${width}`);
        svg.setAttribute('height', `${height}`);
        const style = svg.getAttribute('style');
        const nextStyle = style ? `${style}; overflow: visible;` : 'overflow: visible;';
        svg.setAttribute('style', nextStyle);
        svg.setAttribute('overflow', 'visible');
        if (!svg.getAttribute('preserveAspectRatio')) {
            svg.setAttribute('preserveAspectRatio', 'xMinYMin meet');
        }
    }

    const controls = doc.createElementNS(SVG_NS, 'g');
    controls.setAttribute('id', 'export-controls');
    controls.setAttribute('transform', 'translate(20,20)');
    controls.setAttribute('font-family', 'sans-serif');

    const addControlButton = (label: string, action: string, y: number) => {
        const group = doc.createElementNS(SVG_NS, 'g');
        group.setAttribute('data-action', action);
        group.setAttribute('cursor', 'pointer');

        const rect = doc.createElementNS(SVG_NS, 'rect');
        rect.setAttribute('x', '0');
        rect.setAttribute('y', String(y));
        rect.setAttribute('rx', '6');
        rect.setAttribute('ry', '6');
        rect.setAttribute('width', '140');
        rect.setAttribute('height', '28');
        rect.setAttribute('fill', '#ffffff');
        rect.setAttribute('fill-opacity', '0.92');
        rect.setAttribute('stroke', '#1b1b1b');
        rect.setAttribute('stroke-width', '1');

        const text = doc.createElementNS(SVG_NS, 'text');
        text.setAttribute('x', '12');
        text.setAttribute('y', String(y + 18));
        text.setAttribute('font-size', '12');
        text.setAttribute('fill', '#1b1b1b');
        text.textContent = label;

        group.append(rect, text);
        controls.appendChild(group);
    };

    addControlButton('Expand all', 'expand-all', 0);
    addControlButton('Collapse all', 'collapse-all', 36);

    svg.insertBefore(controls, svg.firstChild);

    const script = doc.createElementNS(SVG_NS, 'script');
    script.textContent = `
(function () {
  const svg = document.documentElement;
  const nodeSelector = 'g.node[role="treeitem"][data-node-id]';
  const linkSelector = 'path.link[data-parent-id][data-child-id]';
  const nodes = Array.from(svg.querySelectorAll(nodeSelector));
  const links = Array.from(svg.querySelectorAll(linkSelector));
  if (!nodes.length) return;

  const nodeById = new Map();
  nodes.forEach((node) => {
    const id = node.getAttribute('data-node-id');
    if (!id) return;
    nodeById.set(id, node);
    if (!node.getAttribute('data-expanded')) {
      node.setAttribute('data-expanded', 'true');
    }
  });

  const children = new Map();
  const parent = new Map();
  const linkByPair = new Map();
  links.forEach((link) => {
    const pid = link.getAttribute('data-parent-id');
    const cid = link.getAttribute('data-child-id');
    if (!pid || !cid) return;
    if (!children.has(pid)) children.set(pid, []);
    children.get(pid).push(cid);
    parent.set(cid, pid);
    linkByPair.set(pid + '::' + cid, link);
  });

  const rootIds = nodes
    .map((node) => node.getAttribute('data-node-id'))
    .filter((id) => id && !parent.has(id));

  const setSymbol = (node, expanded) => {
    if (!node) return;
    const symbol = node.querySelector('text.expand-symbol');
    if (symbol) {
      symbol.textContent = expanded ? '-' : '+';
    }
  };

  const showNode = (id) => {
    const node = nodeById.get(id);
    if (node) node.style.display = '';
  };

  const hideNode = (id) => {
    const node = nodeById.get(id);
    if (node) node.style.display = 'none';
  };

  const showLink = (pid, cid) => {
    const link = linkByPair.get(pid + '::' + cid);
    if (link) link.style.display = '';
  };

  const hideLink = (pid, cid) => {
    const link = linkByPair.get(pid + '::' + cid);
    if (link) link.style.display = 'none';
  };

  const hideDescendants = (id) => {
    const kids = children.get(id) || [];
    kids.forEach((cid) => {
      hideLink(id, cid);
      hideNode(cid);
      hideDescendants(cid);
    });
  };

  const revealChildren = (id) => {
    const kids = children.get(id) || [];
    kids.forEach((cid) => {
      showNode(cid);
      showLink(id, cid);
      const childNode = nodeById.get(cid);
      const expanded = childNode && childNode.getAttribute('data-expanded') !== 'false';
      setSymbol(childNode, expanded);
      if (expanded) {
        revealChildren(cid);
      } else {
        hideDescendants(cid);
      }
    });
  };

  const expandNode = (id) => {
    const node = nodeById.get(id);
    if (!node) return;
    node.setAttribute('data-expanded', 'true');
    setSymbol(node, true);
    revealChildren(id);
  };

  const collapseNode = (id) => {
    const node = nodeById.get(id);
    if (!node) return;
    node.setAttribute('data-expanded', 'false');
    setSymbol(node, false);
    hideDescendants(id);
  };

  const toggleNode = (id) => {
    const node = nodeById.get(id);
    if (!node) return;
    if (!(children.get(id) || []).length) return;
    const expanded = node.getAttribute('data-expanded') !== 'false';
    if (expanded) {
      collapseNode(id);
    } else {
      expandNode(id);
    }
  };

  const expandAll = () => {
    nodes.forEach((node) => {
      const id = node.getAttribute('data-node-id');
      if (!id) return;
      node.style.display = '';
      node.setAttribute('data-expanded', 'true');
      setSymbol(node, true);
    });
    links.forEach((link) => {
      link.style.display = '';
    });
  };

  const collapseAll = () => {
    nodes.forEach((node) => {
      const id = node.getAttribute('data-node-id');
      if (!id) return;
      node.setAttribute('data-expanded', 'false');
      setSymbol(node, false);
    });
    links.forEach((link) => {
      link.style.display = 'none';
    });
    nodes.forEach((node) => {
      const id = node.getAttribute('data-node-id');
      if (!id) return;
      if (rootIds.includes(id)) {
        node.style.display = '';
      } else {
        node.style.display = 'none';
      }
    });
  };

  nodes.forEach((node) => {
    const id = node.getAttribute('data-node-id');
    if (!id) return;
    node.addEventListener('click', (event) => {
      const target = event.target;
      if (target && target.closest && target.closest('#export-controls')) return;
      toggleNode(id);
    });
  });

  const controls = svg.querySelectorAll('#export-controls [data-action]');
  controls.forEach((control) => {
    control.addEventListener('click', (event) => {
      event.stopPropagation();
      const action = control.getAttribute('data-action');
      if (action === 'expand-all') expandAll();
      if (action === 'collapse-all') collapseAll();
    });
  });
})();
`;

    svg.appendChild(script);

    const serializer = new XMLSerializer();
    return serializer.serializeToString(svg);
};

const escapeXml = (value: string) => {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};

const escapeHtml = (value: string) => {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const normalizeOpmlText = (value: string) => value.replace(/\s+/g, ' ').trim();

const normalizeFreemindText = (value: string) => value.replace(/\s+/g, ' ').trim();

const buildOpmlOutline = (nodes: MindmapNode[], depth = 2): string => {
    return nodes
        .map((node) => {
            const text = escapeXml(normalizeOpmlText(node.title));
            const attrs = [`text="${text}"`];
            if (node.id) {
                attrs.push(`id="${escapeXml(node.id)}"`);
            }
            const indent = '  '.repeat(depth);
            if (node.children && node.children.length > 0) {
                return `${indent}<outline ${attrs.join(' ')}>\n${buildOpmlOutline(node.children, depth + 1)}\n${indent}</outline>`;
            }
            return `${indent}<outline ${attrs.join(' ')} />`;
        })
        .join('\n');
};

const buildFreemindNode = (node: MindmapNode, depth: number): string => {
    const text = escapeXml(normalizeFreemindText(node.title));
    const attrs = [`TEXT="${text}"`];
    if (node.id) {
        attrs.push(`ID="${escapeXml(node.id)}"`);
    }
    const indent = '  '.repeat(depth);
    if (node.children && node.children.length > 0) {
        return `${indent}<node ${attrs.join(' ')}>\n${buildFreemindNodes(node.children, depth + 1)}\n${indent}</node>`;
    }
    return `${indent}<node ${attrs.join(' ')} />`;
};

const buildFreemindNodes = (nodes: MindmapNode[], depth: number): string => {
    return nodes.map((node) => buildFreemindNode(node, depth)).join('\n');
};

const generateOpml = (nodes: MindmapNode[], title: string) => {
    const safeTitle = normalizeOpmlText(title) || 'NotebookLM Mindmap';
    const outline = buildOpmlOutline(nodes);
    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(safeTitle)}</title>
  </head>
  <body>
${outline}
  </body>
</opml>`;
};

const generateFreemind = (nodes: MindmapNode[], title: string) => {
    const safeTitle = normalizeFreemindText(title) || 'NotebookLM Mindmap';
    let rootNode: string;
    if (nodes.length === 1) {
        rootNode = buildFreemindNode(nodes[0], 1);
    } else {
        const children = buildFreemindNodes(nodes, 2);
        const indent = '  '.repeat(1);
        rootNode = `${indent}<node TEXT="${escapeXml(safeTitle)}">\n${children}\n${indent}</node>`;
    }
    return `<?xml version="1.0" encoding="UTF-8"?>
<map version="1.0.1">
${rootNode}
</map>`;
};

const normalizeMarkdownText = (value: string) => value.replace(/\s+/g, ' ').trim();

const buildMarkdownList = (nodes: MindmapNode[], depth = 0): string => {
    return nodes
        .map((node) => {
            const text = normalizeMarkdownText(node.title);
            const indent = '  '.repeat(depth);
            const line = `${indent}- ${text}`;
            if (node.children && node.children.length > 0) {
                return `${line}\n${buildMarkdownList(node.children, depth + 1)}`;
            }
            return line;
        })
        .join('\n');
};

const generateMarkdown = (nodes: MindmapNode[], _title: string) => {
    const list = buildMarkdownList(nodes);
    if (!list) {
        return '';
    }
    return `${list}\n`;
};

const generateMindmapHtml = (nodes: MindmapNode[], title: string) => {
    const safeTitle = escapeHtml(title || 'NotebookLM Mindmap');
    const serializedNodes = JSON.stringify(nodes).replace(/</g, '\\u003c');
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${safeTitle} - Mindmap Export</title>
    <style>
        :root {
            --ink: #1c1b1a;
            --muted: #5b5a57;
            --panel: rgba(255, 255, 255, 0.88);
            --panel-border: rgba(24, 24, 24, 0.12);
            --accent: #ff6b3d;
            --accent-2: #1b7f7a;
            --shadow: 0 20px 60px rgba(24, 24, 24, 0.12);
            --glow: 0 0 0 1px rgba(255, 255, 255, 0.4) inset;
            --node-bg: #ffffff;
            --node-border: rgba(24, 24, 24, 0.2);
            --edge: rgba(27, 27, 27, 0.25);
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            min-height: 100vh;
            font-family: "Sora", "Manrope", "Avenir Next", "Noto Sans", sans-serif;
            color: var(--ink);
            background:
                radial-gradient(circle at 10% 20%, rgba(255, 209, 176, 0.35), transparent 55%),
                radial-gradient(circle at 80% 10%, rgba(182, 222, 255, 0.4), transparent 60%),
                linear-gradient(140deg, #f7f2ea, #eef4ff 55%, #f6f5f1);
        }

        .page {
            min-height: 100vh;
            display: grid;
            grid-template-rows: auto 1fr auto;
            gap: 20px;
            padding: 28px;
        }

        .toolbar {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 16px;
            padding: 18px 22px;
            border-radius: 18px;
            background: var(--panel);
            border: 1px solid var(--panel-border);
            box-shadow: var(--shadow);
            backdrop-filter: blur(8px);
        }

        .title-block {
            display: flex;
            flex-direction: column;
            gap: 6px;
            min-width: 220px;
        }

        .title {
            font-size: 20px;
            font-weight: 600;
            letter-spacing: 0.2px;
        }

        .subtitle {
            font-size: 13px;
            color: var(--muted);
        }

        .controls {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-left: auto;
        }

        .control-btn {
            border: 1px solid transparent;
            background: #fff;
            color: var(--ink);
            padding: 8px 14px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease;
            box-shadow: var(--glow);
        }

        .control-btn:hover {
            transform: translateY(-1px);
            border-color: rgba(0, 0, 0, 0.08);
            box-shadow: 0 10px 20px rgba(24, 24, 24, 0.12);
        }

        .control-btn.primary {
            background: linear-gradient(135deg, var(--accent), #ff9b5a);
            color: #fff;
        }

        .control-btn.active {
            border-color: rgba(27, 127, 122, 0.4);
            box-shadow: 0 0 0 2px rgba(27, 127, 122, 0.18);
        }

        .mindmap-stage {
            position: relative;
            border-radius: 28px;
            background: linear-gradient(140deg, #fffdf8, #f0f6ff);
            border: 1px solid rgba(20, 20, 20, 0.08);
            box-shadow: var(--shadow);
            overflow: hidden;
            min-height: 60vh;
            touch-action: none;
            cursor: grab;
            user-select: none;
        }

        .mindmap-stage.dragging {
            cursor: grabbing;
        }

        .mindmap-canvas {
            position: relative;
            transform-origin: 0 0;
            will-change: transform;
        }

        .nodes-layer,
        .edges-layer {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
        }

        .edges-layer {
            z-index: 1;
        }

        .nodes-layer {
            z-index: 2;
        }

        .edge {
            position: absolute;
            height: 2px;
            background: linear-gradient(90deg, rgba(27, 27, 27, 0.15), var(--edge));
            transform-origin: 0 50%;
            pointer-events: none;
        }

        .node {
            position: absolute;
            background: var(--node-bg);
            border: 1px solid var(--node-border);
            border-radius: 16px;
            padding: 12px 16px;
            box-shadow: 0 12px 24px rgba(24, 24, 24, 0.12);
            display: inline-flex;
            align-items: center;
            gap: 10px;
            cursor: pointer;
            transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .node:hover {
            transform: translateY(-2px);
            box-shadow: 0 18px 30px rgba(24, 24, 24, 0.16);
        }

        .node-title {
            font-size: 14px;
            font-weight: 600;
            line-height: 1.4;
            white-space: pre-wrap;
        }

        .node-toggle {
            width: 24px;
            height: 24px;
            border-radius: 999px;
            border: 1px solid rgba(27, 27, 27, 0.3);
            background: #fff;
            color: var(--ink);
            font-weight: 700;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .node[data-collapsible="false"] .node-toggle {
            display: none;
        }

        .legend {
            display: flex;
            flex-wrap: wrap;
            gap: 12px 18px;
            padding: 14px 18px;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.75);
            border: 1px solid rgba(20, 20, 20, 0.08);
            color: var(--muted);
            font-size: 12px;
            letter-spacing: 0.2px;
        }

        .legend strong {
            color: var(--ink);
        }

        .empty-state {
            padding: 32px;
            text-align: center;
            color: var(--muted);
        }

        @media (max-width: 720px) {
            .page {
                padding: 18px;
            }

            .toolbar {
                gap: 12px;
            }

            .controls {
                width: 100%;
                justify-content: flex-start;
                margin-left: 0;
            }
        }
    </style>
</head>
<body>
    <div class="page">
        <header class="toolbar">
            <div class="title-block">
                <div class="title">${safeTitle}</div>
                <div class="subtitle">Interactive mindmap export</div>
            </div>
            <div class="controls">
                <button class="control-btn active" data-layout="horizontal">Horizontal</button>
                <button class="control-btn" data-layout="vertical">Vertical</button>
                <button class="control-btn" data-layout="radial">Radial</button>
                <button class="control-btn" data-action="zoom-out">Zoom out</button>
                <button class="control-btn" data-action="zoom-in">Zoom in</button>
                <button class="control-btn" data-action="fit">Fit to view</button>
                <button class="control-btn" data-action="expand-all">Expand all</button>
                <button class="control-btn" data-action="collapse-all">Collapse all</button>
                <button class="control-btn primary" data-action="reset">Reset</button>
            </div>
        </header>

        <main id="mindmap-stage" class="mindmap-stage">
            <div id="mindmap-canvas" class="mindmap-canvas"></div>
        </main>

        <div class="legend">
            <div><strong>Pan:</strong> drag the canvas</div>
            <div><strong>Zoom:</strong> mouse wheel or buttons</div>
            <div><strong>Nodes:</strong> click to expand/collapse</div>
            <div><strong>Layout:</strong> switch via toolbar</div>
        </div>
    </div>

    <script>
        (function () {
            const data = ${serializedNodes};
            const stage = document.getElementById('mindmap-stage');
            const canvas = document.getElementById('mindmap-canvas');
            if (!stage || !canvas) {
                return;
            }

            const state = { scale: 1, x: 0, y: 0 };
            const minScale = 0.2;
            const maxScale = 3.5;
            let draggedRecently = false;

            const clampScale = (value) => Math.min(maxScale, Math.max(minScale, value));

            const applyTransform = () => {
                canvas.style.transform =
                    'translate(' + state.x + 'px, ' + state.y + 'px) scale(' + state.scale + ')';
            };

            const zoomAt = (delta, clientX, clientY) => {
                const rect = stage.getBoundingClientRect();
                const originX = clientX - rect.left;
                const originY = clientY - rect.top;
                const nextScale = clampScale(state.scale * delta);
                const ratio = nextScale / state.scale;
                state.x = originX - (originX - state.x) * ratio;
                state.y = originY - (originY - state.y) * ratio;
                state.scale = nextScale;
                applyTransform();
            };

            const fitToView = () => {
                const rect = stage.getBoundingClientRect();
                const contentWidth = canvas.offsetWidth;
                const contentHeight = canvas.offsetHeight;
                if (!contentWidth || !contentHeight) return;
                const scale = clampScale(Math.min(rect.width / contentWidth, rect.height / contentHeight) * 0.92);
                state.scale = scale;
                state.x = (rect.width - contentWidth * scale) / 2;
                state.y = (rect.height - contentHeight * scale) / 2;
                applyTransform();
            };

            const scheduleFit = () => {
                requestAnimationFrame(() => fitToView());
            };

            const nodeMap = new Map();
            const rootIds = [];

            const buildTree = (nodes, parentId, depth) => {
                nodes.forEach((node, index) => {
                    const id =
                        node.id ||
                        ('node-' + depth + '-' + index + '-' + Math.random().toString(36).slice(2, 7));
                    const record = {
                        id,
                        title: String(node.title || ''),
                        parentId,
                        children: [],
                        depth,
                        expanded: true,
                        width: 0,
                        height: 0,
                        x: 0,
                        y: 0
                    };
                    nodeMap.set(id, record);
                    if (!parentId) {
                        rootIds.push(id);
                    } else {
                        const parent = nodeMap.get(parentId);
                        if (parent) parent.children.push(id);
                    }
                    if (Array.isArray(node.children) && node.children.length > 0) {
                        buildTree(node.children, id, depth + 1);
                    }
                });
            };

            buildTree(data, null, 0);

            if (nodeMap.size === 0) {
                const empty = document.createElement('div');
                empty.className = 'empty-state';
                empty.textContent = 'No mindmap nodes found.';
                stage.appendChild(empty);
                return;
            }

            const edgesLayer = document.createElement('div');
            edgesLayer.className = 'edges-layer';
            const nodesLayer = document.createElement('div');
            nodesLayer.className = 'nodes-layer';
            canvas.append(edgesLayer, nodesLayer);

            const measureNode = (node) => {
                const minWidth = 160;
                const maxWidth = 320;
                const width = Math.min(maxWidth, Math.max(minWidth, node.title.length * 7 + 56));
                node.width = width;
                node.height = 54;
            };

            nodeMap.forEach((node) => {
                measureNode(node);
            });

            const layoutHorizontal = () => {
                const H_SPACING = 260;
                const V_GAP = 30;

                const subtreeHeight = (id) => {
                    const node = nodeMap.get(id);
                    if (!node.children.length) {
                        return node.height + V_GAP;
                    }
                    return node.children.reduce((sum, childId) => sum + subtreeHeight(childId), 0);
                };

                const layout = (id, depth, offsetY) => {
                    const node = nodeMap.get(id);
                    const totalHeight = subtreeHeight(id);
                    let currentY = offsetY;
                    if (node.children.length) {
                        currentY = offsetY + totalHeight / 2 - node.height / 2;
                    }
                    node.x = depth * H_SPACING;
                    node.y = currentY;
                    let childOffset = offsetY;
                    node.children.forEach((childId) => {
                        const childHeight = subtreeHeight(childId);
                        layout(childId, depth + 1, childOffset);
                        childOffset += childHeight;
                    });
                    return totalHeight;
                };

                let offset = 0;
                rootIds.forEach((id) => {
                    const height = layout(id, 0, offset);
                    offset += height + V_GAP;
                });
            };

            const layoutVertical = () => {
                const V_SPACING = 150;
                const H_GAP = 30;

                const subtreeWidth = (id) => {
                    const node = nodeMap.get(id);
                    if (!node.children.length) {
                        return node.width + H_GAP;
                    }
                    return node.children.reduce((sum, childId) => sum + subtreeWidth(childId), 0);
                };

                const layout = (id, depth, offsetX) => {
                    const node = nodeMap.get(id);
                    const totalWidth = subtreeWidth(id);
                    node.x = offsetX + totalWidth / 2 - node.width / 2;
                    node.y = depth * V_SPACING;
                    let childOffset = offsetX;
                    node.children.forEach((childId) => {
                        const childWidth = subtreeWidth(childId);
                        layout(childId, depth + 1, childOffset);
                        childOffset += childWidth;
                    });
                    return totalWidth;
                };

                let offset = 0;
                rootIds.forEach((id) => {
                    const width = layout(id, 0, offset);
                    offset += width + H_GAP;
                });
            };

            const layoutRadial = () => {
                const radialSpacing = 180;
                const virtualRootId = 'virtual-root';
                const virtualRoot = {
                    id: virtualRootId,
                    title: '',
                    parentId: null,
                    children: rootIds.slice(),
                    depth: -1,
                    expanded: true,
                    width: 0,
                    height: 0,
                    x: 0,
                    y: 0
                };

                const leafOrder = [];
                const collectLeaves = (id) => {
                    const node = id === virtualRootId ? virtualRoot : nodeMap.get(id);
                    if (!node.children.length) {
                        leafOrder.push(id);
                        return;
                    }
                    node.children.forEach((childId) => collectLeaves(childId));
                };

                collectLeaves(virtualRootId);
                const totalLeaves = leafOrder.length || 1;
                const angles = new Map();
                leafOrder.forEach((id, index) => {
                    const angle = -Math.PI / 2 + (index / totalLeaves) * Math.PI * 2;
                    angles.set(id, angle);
                });

                const resolveAngle = (id) => {
                    const node = id === virtualRootId ? virtualRoot : nodeMap.get(id);
                    if (!node.children.length) {
                        return angles.get(id) || 0;
                    }
                    const childAngles = node.children.map((childId) => resolveAngle(childId));
                    const avg = childAngles.reduce((sum, value) => sum + value, 0) / childAngles.length;
                    angles.set(id, avg);
                    return avg;
                };

                resolveAngle(virtualRootId);

                const layoutNode = (id, depth) => {
                    const node = nodeMap.get(id);
                    const angle = angles.get(id) || 0;
                    const radius = Math.max(0, depth) * radialSpacing;
                    node.x = Math.cos(angle) * radius;
                    node.y = Math.sin(angle) * radius;
                    node.children.forEach((childId) => layoutNode(childId, depth + 1));
                };

                rootIds.forEach((id) => layoutNode(id, 0));
            };

            const layoutOptions = {
                horizontal: layoutHorizontal,
                vertical: layoutVertical,
                radial: layoutRadial
            };

            let activeLayout = 'horizontal';

            const renderNodes = () => {
                nodesLayer.innerHTML = '';
                edgesLayer.innerHTML = '';
                nodeMap.forEach((node) => {
                    const nodeEl = document.createElement('div');
                    nodeEl.className = 'node';
                    nodeEl.dataset.id = node.id;
                    nodeEl.dataset.collapsible = node.children.length ? 'true' : 'false';
                    nodeEl.style.width = node.width + 'px';
                    nodeEl.style.left = node.x + 'px';
                    nodeEl.style.top = node.y + 'px';

                    const titleEl = document.createElement('span');
                    titleEl.className = 'node-title';
                    titleEl.textContent = node.title;

                    const toggle = document.createElement('button');
                    toggle.className = 'node-toggle';
                    toggle.type = 'button';
                    toggle.textContent = node.expanded ? '-' : '+';
                    toggle.addEventListener('click', (event) => {
                        event.stopPropagation();
                        if (!node.children.length) return;
                        node.expanded = !node.expanded;
                        toggle.textContent = node.expanded ? '-' : '+';
                        updateVisibility();
                    });

                    nodeEl.addEventListener('click', () => {
                        if (draggedRecently || !node.children.length) return;
                        node.expanded = !node.expanded;
                        toggle.textContent = node.expanded ? '-' : '+';
                        updateVisibility();
                    });

                    nodeEl.append(titleEl, toggle);
                    nodesLayer.appendChild(nodeEl);
                    node.element = nodeEl;
                    node.edges = [];
                });

                nodeMap.forEach((node) => {
                    node.children.forEach((childId) => {
                        const edge = document.createElement('div');
                        edge.className = 'edge';
                        edge.dataset.parentId = node.id;
                        edge.dataset.childId = childId;
                        edgesLayer.appendChild(edge);
                        node.edges.push(edge);
                    });
                });
            };

            const updateEdges = () => {
                nodeMap.forEach((node) => {
                    if (!node.edges) return;
                    node.children.forEach((childId, index) => {
                        const child = nodeMap.get(childId);
                        const edge = node.edges[index];
                        if (!child || !edge) return;
                        const startX = node.x + node.width / 2;
                        const startY = node.y + node.height / 2;
                        const endX = child.x + child.width / 2;
                        const endY = child.y + child.height / 2;
                        const dx = endX - startX;
                        const dy = endY - startY;
                        const length = Math.hypot(dx, dy);
                        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
                        edge.style.width = length + 'px';
                        edge.style.transform =
                            'translate(' + startX + 'px, ' + startY + 'px) rotate(' + angle + 'deg)';
                    });
                });
            };

            const updateVisibility = () => {
                const isVisible = (id) => {
                    let current = nodeMap.get(id);
                    while (current && current.parentId) {
                        const parent = nodeMap.get(current.parentId);
                        if (!parent || !parent.expanded) return false;
                        current = parent;
                    }
                    return true;
                };

                nodeMap.forEach((node) => {
                    const visible = isVisible(node.id);
                    if (node.element) {
                        node.element.style.display = visible ? 'inline-flex' : 'none';
                        const toggle = node.element.querySelector('.node-toggle');
                        if (toggle) toggle.textContent = node.expanded ? '-' : '+';
                    }
                    if (node.edges) {
                        node.children.forEach((childId, index) => {
                            const edge = node.edges[index];
                            if (!edge) return;
                            const childVisible = isVisible(childId);
                            edge.style.display = visible && childVisible && node.expanded ? 'block' : 'none';
                        });
                    }
                });
            };

            const applyLayout = (layout) => {
                activeLayout = layout;
                const layoutFn = layoutOptions[layout] || layoutHorizontal;
                layoutFn();
                const bounds = {
                    minX: Infinity,
                    minY: Infinity,
                    maxX: -Infinity,
                    maxY: -Infinity
                };
                nodeMap.forEach((node) => {
                    bounds.minX = Math.min(bounds.minX, node.x);
                    bounds.minY = Math.min(bounds.minY, node.y);
                    bounds.maxX = Math.max(bounds.maxX, node.x + node.width);
                    bounds.maxY = Math.max(bounds.maxY, node.y + node.height);
                });
                const padding = 120;
                const offsetX = -bounds.minX + padding;
                const offsetY = -bounds.minY + padding;
                const width = Math.max(1, bounds.maxX - bounds.minX + padding * 2);
                const height = Math.max(1, bounds.maxY - bounds.minY + padding * 2);
                canvas.style.width = width + 'px';
                canvas.style.height = height + 'px';
                nodeMap.forEach((node) => {
                    node.x += offsetX;
                    node.y += offsetY;
                });
                renderNodes();
                updateEdges();
                updateVisibility();
                scheduleFit();
            };

            const expandAll = () => {
                nodeMap.forEach((node) => {
                    node.expanded = true;
                });
                updateVisibility();
            };

            const collapseAll = () => {
                nodeMap.forEach((node) => {
                    node.expanded = false;
                });
                rootIds.forEach((id) => {
                    const root = nodeMap.get(id);
                    if (root) root.expanded = true;
                });
                updateVisibility();
            };

            let pointerDown = false;
            let isDragging = false;
            let startX = 0;
            let startY = 0;
            let originX = 0;
            let originY = 0;

            stage.addEventListener('pointerdown', (event) => {
                if (event.button !== 0) return;
                if (event.target && event.target.closest && event.target.closest('.node')) return;
                pointerDown = true;
                isDragging = false;
                startX = event.clientX;
                startY = event.clientY;
                originX = state.x;
                originY = state.y;
                stage.setPointerCapture(event.pointerId);
            });

            stage.addEventListener('pointermove', (event) => {
                if (!pointerDown) return;
                const deltaX = event.clientX - startX;
                const deltaY = event.clientY - startY;
                if (!isDragging) {
                    if (Math.hypot(deltaX, deltaY) < 4) {
                        return;
                    }
                    isDragging = true;
                    stage.classList.add('dragging');
                }
                state.x = originX + deltaX;
                state.y = originY + deltaY;
                applyTransform();
            });

            stage.addEventListener('pointerup', (event) => {
                if (!pointerDown) return;
                pointerDown = false;
                if (isDragging) {
                    isDragging = false;
                    stage.classList.remove('dragging');
                    draggedRecently = true;
                    setTimeout(() => {
                        draggedRecently = false;
                    }, 0);
                }
                stage.releasePointerCapture(event.pointerId);
            });

            stage.addEventListener('wheel', (event) => {
                event.preventDefault();
                const delta = event.deltaY < 0 ? 1.12 : 0.9;
                zoomAt(delta, event.clientX, event.clientY);
            }, { passive: false });

            const runAction = (action) => {
                if (action === 'zoom-in') {
                    const rect = stage.getBoundingClientRect();
                    zoomAt(1.2, rect.left + rect.width / 2, rect.top + rect.height / 2);
                } else if (action === 'zoom-out') {
                    const rect = stage.getBoundingClientRect();
                    zoomAt(0.85, rect.left + rect.width / 2, rect.top + rect.height / 2);
                } else if (action === 'fit') {
                    fitToView();
                } else if (action === 'expand-all') {
                    expandAll();
                } else if (action === 'collapse-all') {
                    collapseAll();
                } else if (action === 'reset') {
                    state.scale = 1;
                    state.x = 0;
                    state.y = 0;
                    applyTransform();
                }
            };

            document.querySelectorAll('.controls [data-action]').forEach((button) => {
                button.addEventListener('click', () => {
                    const action = button.getAttribute('data-action');
                    if (action) runAction(action);
                });
            });

            document.querySelectorAll('[data-layout]').forEach((button) => {
                button.addEventListener('click', () => {
                    const layout = button.getAttribute('data-layout');
                    if (!layout) return;
                    document.querySelectorAll('[data-layout]').forEach((item) => item.classList.remove('active'));
                    button.classList.add('active');
                    applyLayout(layout);
                });
            });

            window.addEventListener('resize', () => {
                fitToView();
            });

            applyLayout(activeLayout);
        })();
    </script>
</body>
</html>`;
};

/**
 * Calculate dynamic node width based on text length
 */
const calculateNodeWidth = (text: string): number => {
    const baseWidth = 200;
    const charWidth = 8; // approximate pixels per character
    const calculatedWidth = text.length * charWidth + 40; // add padding
    return Math.max(baseWidth, Math.min(calculatedWidth, 400)); // clamp between 200-400
};

/**
 * Get preset color based on depth level (1-6 as per spec)
 */
const getColorForDepth = (depth: number): string | undefined => {
    const colors = ['1', '2', '3', '4', '5', '6']; // red, orange, yellow, green, cyan, purple
    return depth < colors.length ? colors[depth] : undefined;
};

/**
 * Calculate the height of a subtree (total vertical space needed)
 */
const calculateSubtreeHeight = (node: MindmapNode): number => {
    if (!node.children || node.children.length === 0) {
        return 150; // height for a single node including spacing
    }
    return node.children.reduce((sum, child) => sum + calculateSubtreeHeight(child), 0);
};

const generateJsonCanvas = (nodes: MindmapNode[]): JsonCanvasDocument => {
    const canvasNodes: JsonCanvasNode[] = [];
    const canvasEdges: JsonCanvasEdge[] = [];
    let edgeIndex = 0;

    const NODE_HEIGHT = 100;
    const HORIZONTAL_SPACING = 400;
    const VERTICAL_PADDING = 50;

    /**
     * Recursive layout function with improved spacing to prevent overlaps
     */
    const layout = (node: MindmapNode, depth: number, offsetY: number, parentId?: string): number => {
        const id = node.id ?? `node-${Math.random().toString(36).substr(2, 9)}`;
        const width = calculateNodeWidth(node.title);
        const x = depth * HORIZONTAL_SPACING;

        // Calculate vertical position for this node
        let currentY = offsetY;

        if (node.children && node.children.length > 0) {
            // For parent nodes, calculate total height needed for all children
            const totalChildrenHeight = node.children.reduce(
                (sum, child) => sum + calculateSubtreeHeight(child),
                0
            );

            // Center parent node vertically relative to its children
            currentY = offsetY + (totalChildrenHeight / 2) - (NODE_HEIGHT / 2);
        }

        // Create the node
        canvasNodes.push({
            id,
            type: 'text',
            text: node.title,
            x,
            y: Math.round(currentY),
            width,
            height: NODE_HEIGHT,
            color: getColorForDepth(depth)
        });

        // Create edge from parent
        if (parentId) {
            canvasEdges.push({
                id: `edge-${edgeIndex++}`,
                fromNode: parentId,
                toNode: id,
                fromSide: 'right',
                toSide: 'left',
                toEnd: 'arrow'
            });
        }

        // Layout children
        let childOffsetY = offsetY;
        if (node.children && node.children.length > 0) {
            node.children.forEach((child) => {
                const childHeight = calculateSubtreeHeight(child);
                layout(child, depth + 1, childOffsetY, id);
                childOffsetY += childHeight;
            });
        }

        return calculateSubtreeHeight(node);
    };

    // Layout all root nodes
    let currentY = 0;
    nodes.forEach((node) => {
        const height = layout(node, 0, currentY);
        currentY += height + VERTICAL_PADDING;
    });

    return { nodes: canvasNodes, edges: canvasEdges };
};

export const exportMindmap = (
    mindmapData: MindmapNode[],
    format: ExportFormat,
    tabTitle: string,
    timestamp: string,
    svgContent?: string
): ExportResult => {
    if (format === 'OPML') {
        const content = generateOpml(mindmapData, tabTitle);
        const filename = `notebooklm_mindmap_${tabTitle}_${timestamp}.opml`;
        const blob = new Blob([content], { type: 'text/xml' });
        return { success: true, count: mindmapData.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'FreeMind') {
        const content = generateFreemind(mindmapData, tabTitle);
        const filename = `notebooklm_mindmap_${tabTitle}_${timestamp}.mm`;
        const blob = new Blob([content], { type: 'text/xml' });
        return { success: true, count: mindmapData.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'JSONCanvas') {
        const content = JSON.stringify(generateJsonCanvas(mindmapData), null, 2);
        const filename = `notebooklm_mindmap_${tabTitle}_${timestamp}.canvas`;
        const blob = new Blob([content], { type: 'application/json' });
        return { success: true, count: mindmapData.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'Markdown') {
        const content = generateMarkdown(mindmapData, tabTitle);
        const filename = `notebooklm_mindmap_${tabTitle}_${timestamp}.md`;
        const blob = new Blob([content], { type: 'text/markdown' });
        return { success: true, count: mindmapData.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'SVG') {
        if (!svgContent) {
            return { success: false, error: 'Missing SVG content.' };
        }
        const enhanced = enhanceSvg(svgContent);
        if (!enhanced) {
            return { success: false, error: 'Failed to parse SVG content.' };
        }
        const content = `<?xml version="1.0" encoding="UTF-8"?>\n${enhanced}`;
        const filename = `notebooklm_mindmap_${tabTitle}_${timestamp}.svg`;
        const blob = new Blob([content], { type: 'image/svg+xml' });
        return { success: true, count: mindmapData.length, filename, mimeType: blob.type, blob };
    }

    if (format === 'HTML') {
        const content = generateMindmapHtml(mindmapData, tabTitle);
        const filename = `notebooklm_mindmap_${tabTitle}_${timestamp}.html`;
        const blob = new Blob([content], { type: 'text/html' });
        return { success: true, count: mindmapData.length, filename, mimeType: blob.type, blob };
    }

    return { success: false, error: 'Unsupported format' };
};

