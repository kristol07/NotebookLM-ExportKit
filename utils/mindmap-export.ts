import { downloadBlob, ExportFormat, ExportResult, MindmapNode } from './export-core';

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

const buildOpmlOutline = (nodes: MindmapNode[]): string => {
    return nodes
        .map((node) => {
            const text = escapeXml(node.title);
            if (node.children && node.children.length > 0) {
                return `<outline text="${text}">${buildOpmlOutline(node.children)}</outline>`;
            }
            return `<outline text="${text}" />`;
        })
        .join('');
};

const generateOpml = (nodes: MindmapNode[], title: string) => {
    const outline = buildOpmlOutline(nodes);
    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${escapeXml(title)}</title>
  </head>
  <body>
    ${outline}
  </body>
</opml>`;
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
        downloadBlob(content, filename, 'text/xml');
        return { success: true, count: mindmapData.length };
    }

    if (format === 'JSONCanvas') {
        const content = JSON.stringify(generateJsonCanvas(mindmapData), null, 2);
        const filename = `notebooklm_mindmap_${tabTitle}_${timestamp}.canvas`;
        downloadBlob(content, filename, 'application/json');
        return { success: true, count: mindmapData.length };
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
        downloadBlob(content, filename, 'image/svg+xml');
        return { success: true, count: mindmapData.length };
    }

    return { success: false, error: 'Unsupported format' };
};
