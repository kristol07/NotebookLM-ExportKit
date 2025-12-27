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
    timestamp: string
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

    return { success: false, error: 'Unsupported format' };
};
