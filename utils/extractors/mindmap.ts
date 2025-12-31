import { browser } from 'wxt/browser';
import { ExportFormat, MindmapNode, NormalizedExportPayload, validateMindmapItems } from '../export-core';
import { RawExtractResult } from './common';

export interface TypeExtractResult {
    success: boolean;
    payload?: NormalizedExportPayload<MindmapNode>;
    error?: string;
    raw?: RawExtractResult;
}

/**
 * Extract mindmap data from NotebookLM's SVG-based mindmap viewer
 */
export const extractMindmap = async (tabId: number, format: ExportFormat): Promise<TypeExtractResult> => {
    try {
        const results = await browser.scripting.executeScript({
            target: { tabId, allFrames: true },
            args: [format],
            func: (formatArg: ExportFormat) => {
                try {
                    /**
                     * Parse a node's aria-label to extract the title and child count
                     * Format: "Node Title" or "Node Title, N children"
                     */
                    const parseAriaLabel = (label: string): { title: string; childCount: number } => {
                        const match = label.match(/^(.+?),\s*(\d+)\s+children?$/);
                        if (match) {
                            return { title: match[1].trim(), childCount: parseInt(match[2], 10) };
                        }
                        return { title: label.trim(), childCount: 0 };
                    };

                    /**
                     * Build tree structure from explicit SVG links.
                     */
                    const buildTreeFromLinks = (
                        nodeRecords: Array<{
                            id: string;
                            title: string;
                            x: number;
                            y: number;
                            leftAnchorX: number;
                            leftAnchorY: number;
                            rightAnchorX: number;
                            rightAnchorY: number;
                        }>,
                        links: Array<{ startX: number; startY: number; endX: number; endY: number }>
                    ): MindmapNode[] => {
                        if (nodeRecords.length === 0) return [];

                        const nodeMap = new Map<string, MindmapNode>();
                        const nodeMeta = new Map<
                            string,
                            {
                                x: number;
                                y: number;
                                leftAnchorX: number;
                                leftAnchorY: number;
                                rightAnchorX: number;
                                rightAnchorY: number;
                            }
                        >();

                        for (const record of nodeRecords) {
                            nodeMap.set(record.id, { id: record.id, title: record.title, children: [] });
                            nodeMeta.set(record.id, {
                                x: record.x,
                                y: record.y,
                                leftAnchorX: record.leftAnchorX,
                                leftAnchorY: record.leftAnchorY,
                                rightAnchorX: record.rightAnchorX,
                                rightAnchorY: record.rightAnchorY
                            });
                        }

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

                        const childrenByParent = new Map<string, Set<string>>();
                        const childIds = new Set<string>();

                        for (const link of links) {
                            const parentId = findNodeByAnchor(link.startX, link.startY, (meta) => ({
                                ax: meta.rightAnchorX,
                                ay: meta.rightAnchorY
                            }));
                            const childId = findNodeByAnchor(link.endX, link.endY, (meta) => ({
                                ax: meta.leftAnchorX,
                                ay: meta.leftAnchorY
                            }));

                            if (!parentId || !childId || parentId === childId) continue;

                            if (!childrenByParent.has(parentId)) {
                                childrenByParent.set(parentId, new Set());
                            }
                            childrenByParent.get(parentId)?.add(childId);
                            childIds.add(childId);
                        }

                        for (const [parentId, childSet] of childrenByParent.entries()) {
                            const parent = nodeMap.get(parentId);
                            if (!parent) continue;
                            const sortedChildren = Array.from(childSet).sort((a, b) => {
                                const metaA = nodeMeta.get(a);
                                const metaB = nodeMeta.get(b);
                                if (!metaA || !metaB) return 0;
                                return metaA.y - metaB.y;
                            });
                            for (const childId of sortedChildren) {
                                const child = nodeMap.get(childId);
                                if (child) {
                                    parent.children?.push(child);
                                }
                            }
                        }

                        const rootNodes: MindmapNode[] = [];
                        for (const [id, node] of nodeMap.entries()) {
                            if (!childIds.has(id)) {
                                rootNodes.push(node);
                            }
                        }

                        rootNodes.sort((a, b) => {
                            const metaA = a.id ? nodeMeta.get(a.id) : undefined;
                            const metaB = b.id ? nodeMeta.get(b.id) : undefined;
                            if (!metaA || !metaB) return 0;
                            return metaA.y - metaB.y;
                        });

                        const cleanupNode = (node: MindmapNode, visited: Set<string>) => {
                            if (!node.id) return;
                            if (visited.has(node.id)) return;
                            visited.add(node.id);
                            if (node.children && node.children.length === 0) {
                                delete node.children;
                            } else if (node.children) {
                                node.children.forEach((child) => cleanupNode(child, visited));
                            }
                        };
                        rootNodes.forEach((root) => cleanupNode(root, new Set()));

                        return rootNodes;
                    };

                    const tryExtractFromDocument = (doc: Document, depth: number): any => {
                        if (!doc || depth > 4) return null;

                        // Only extract mindmap for mindmap formats
                        if (formatArg === 'OPML' || formatArg === 'FreeMind' || formatArg === 'JSONCanvas' || formatArg === 'SVG' || formatArg === 'Markdown') {
                            // Look for mindmap viewer component
                            const mindmapViewer = doc.querySelector('mindmap-viewer');
                            if (mindmapViewer) {
                                // Find all SVG nodes with role="treeitem"
                                const svgNodes = Array.from(mindmapViewer.querySelectorAll('g.node[role="treeitem"]'));
                                const svgLinks = Array.from(mindmapViewer.querySelectorAll('path.link'));
                                const svgElement = mindmapViewer.querySelector('svg');

                                if (svgNodes.length === 0) {
                                    return { success: false, error: 'no_nodes_found', frameUrl: doc.URL };
                                }

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

                                // Extract data from each node
                                const nodeRecords = svgNodes.map((node, index) => {
                                    const ariaLabel = node.getAttribute('aria-label') || '';
                                    const { title } = parseAriaLabel(ariaLabel);
                                    const nodeTranslate = parseTranslate(node.getAttribute('transform')) || { x: 0, y: 0 };
                                    const rect = node.querySelector('rect');
                                    const rectX = parseNumberAttr(rect ? rect.getAttribute('x') : null) ?? 0;
                                    const rectY = parseNumberAttr(rect ? rect.getAttribute('y') : null) ?? 0;
                                    const rectWidth = parseNumberAttr(rect ? rect.getAttribute('width') : null) ?? 0;
                                    const circle = node.querySelector('circle');
                                    const circleTranslate = parseTranslate(circle ? circle.getAttribute('transform') : null);
                                    const rightAnchorX = nodeTranslate.x + (circleTranslate?.x ?? rectX + rectWidth);
                                    const rightAnchorY = nodeTranslate.y + (circleTranslate?.y ?? 0);
                                    const leftAnchorX = nodeTranslate.x + rectX;
                                    const leftAnchorY = nodeTranslate.y;

                                    return {
                                        id: `node-${index}`,
                                        title,
                                        x: nodeTranslate.x,
                                        y: nodeTranslate.y,
                                        leftAnchorX,
                                        leftAnchorY,
                                        rightAnchorX,
                                        rightAnchorY
                                    };
                                });

                                const links = svgLinks
                                    .map((link) => {
                                        const d = link.getAttribute('d') || '';
                                        const numbers = d.match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
                                        if (!numbers || numbers.length < 4) return null;
                                        const startX = parseFloat(numbers[0]);
                                        const startY = parseFloat(numbers[1]);
                                        const endX = parseFloat(numbers[numbers.length - 2]);
                                        const endY = parseFloat(numbers[numbers.length - 1]);
                                        if (![startX, startY, endX, endY].every((value) => Number.isFinite(value))) {
                                            return null;
                                        }
                                        return { startX, startY, endX, endY };
                                    })
                                    .filter((link): link is { startX: number; startY: number; endX: number; endY: number } =>
                                        Boolean(link)
                                    );

                                // Build hierarchical tree structure from explicit links
                                const mindmapTree = buildTreeFromLinks(nodeRecords, links);

                                return {
                                    success: true,
                                    data: { mindmap: mindmapTree, svg: svgElement?.outerHTML || null },
                                    frameUrl: doc.URL
                                };
                            }
                        }

                        // Try nested iframes
                        const iframes = Array.from(doc.querySelectorAll('iframe'));
                        for (const frame of iframes) {
                            try {
                                const frameDoc = frame.contentDocument || frame.contentWindow?.document;
                                if (!frameDoc) continue;
                                const nestedResult = tryExtractFromDocument(frameDoc, depth + 1);
                                if (nestedResult?.success) return nestedResult;
                            } catch (innerErr) {
                                // Cross-origin or inaccessible frame; ignore.
                            }
                        }

                        return null;
                    };

                    if (formatArg === 'OPML' || formatArg === 'FreeMind' || formatArg === 'JSONCanvas' || formatArg === 'SVG' || formatArg === 'Markdown') {
                        const result = tryExtractFromDocument(document, 0);
                        if (result) return result;
                        return { success: false, error: 'mindmap_not_found', frameUrl: window.location.href };
                    }

                    return { success: false, error: 'unsupported_format', frameUrl: window.location.href };
                } catch (error) {
                    return { success: false, error: 'script_error', frameUrl: window.location.href };
                }
            }
        });

        const success = results.find((result) => result.result?.success);
        if (success?.result?.success) {
            const raw: RawExtractResult = success.result;

            if (!raw.data || !Array.isArray(raw.data.mindmap)) {
                return { success: false, error: 'mindmap_not_found', raw };
            }

            const validation = validateMindmapItems(raw.data.mindmap);
            if (!validation.valid) {
                return {
                    success: false,
                    error: `Invalid mindmap data: ${validation.errors.join('; ')}`,
                    raw
                };
            }

            return {
                success: true,
                payload: {
                    type: 'mindmap',
                    items: raw.data.mindmap as MindmapNode[],
                    source: 'notebooklm',
                    meta: raw.data.svg ? { svg: raw.data.svg } : undefined
                },
                raw
            };
        }

        const firstResult = results.find((result) => result.result)?.result;
        return {
            success: false,
            error: firstResult?.error || 'no_results',
            raw: firstResult
        };
    } catch (error) {
        return { success: false, error: 'script_error' };
    }
};
