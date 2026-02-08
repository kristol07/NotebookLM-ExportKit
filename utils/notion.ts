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
import type {
  ChatInline,
  ChatMessage,
  ContentType,
  DataTableRow,
  ExportFormat,
  ExportResult,
  FlashcardItem,
  MindmapNode,
  NoteBlock,
  NoteInline,
  QuizItem,
  SourceItem,
} from './export-core';
import {
  getNotionAccessToken,
  getNotionDatabaseId,
  getNotionNotebookMap,
  getNotionPageDatabaseMap,
  setNotionNotebookMap,
  setNotionPageDatabaseMap,
  clearNotionNotebookMap,
  setNotionDatabaseId,
  setNotionWorkspaceName,
} from './notion-auth';

const NOTION_API_BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2025-09-03';
const DEFAULT_DATABASE_TITLE = 'NotebookLM ExportKit';
const MAX_RICH_TEXT_CHARS = 1800;
const MAX_BLOCKS_PER_PAGE = 100;

const CONTENT_TYPE_LABELS: Record<ContentType, string> = {
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  mindmap: 'Mindmap',
  datatable: 'Data table',
  note: 'Note',
  report: 'Report',
  chat: 'Chat',
  source: 'Sources',
};

export const NOTION_SUPPORTED_FORMATS_BY_TYPE: Record<ContentType, ExportFormat[]> = {
  quiz: ['CSV', 'JSON', 'HTML'],
  flashcards: ['CSV', 'JSON', 'HTML'],
  mindmap: ['HTML', 'Markdown'],
  datatable: ['CSV', 'Markdown'],
  note: ['Markdown'],
  report: ['Markdown'],
  chat: ['Markdown', 'JSON'],
  source: ['Markdown'],
};

export type NotionExportContext = {
  contentType?: ContentType;
  format?: ExportFormat;
  sourceTitle?: string;
  sourceUrl?: string;
  notebookId?: string;
  notebookTitle?: string;
  items?: QuizItem[] | FlashcardItem[] | MindmapNode[] | DataTableRow[] | NoteBlock[] | ChatMessage[] | SourceItem[];
  meta?: {
    title?: string;
    svg?: string;
    sources?: string[];
  };
};

export type NotionPageChoice = {
  id: string;
  title: string;
};

type NotionDatabaseInfo = {
  id: string;
  title: string;
  titlePropertyName: string;
  properties: Record<string, { type?: string }>;
  parentPageId?: string;
  dataSourceId?: string;
  dataSources?: Array<{ id: string; name: string }>;
};

const notionFetch = async (accessToken: string, path: string, init?: RequestInit) => {
  return fetch(`${NOTION_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Notion-Version': NOTION_VERSION,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
};

const normalizeNotionId = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  const directMatch = trimmed.match(/[0-9a-fA-F]{32}/);
  if (directMatch) {
    return directMatch[0];
  }
  const cleaned = trimmed.replace(/-/g, '');
  if (/^[0-9a-fA-F]{32}$/.test(cleaned)) {
    return cleaned;
  }
  return null;
};

export const getNotebookIdFromUrl = (value?: string | null) => {
  if (!value) {
    return null;
  }
  try {
    const url = new URL(value);
    const pathMatch = url.pathname.match(/\/notebook\/([a-zA-Z0-9_-]+)/);
    if (pathMatch?.[1]) {
      return pathMatch[1];
    }
    const queryMatch = url.searchParams.get('notebookId');
    if (queryMatch) {
      return queryMatch;
    }
  } catch {
    return null;
  }
  return null;
};

const buildRichText = (content: string) => [{ type: 'text', text: { content } }];

const isUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim());

const buildTextRichText = (
  content: string,
  options?: { bold?: boolean; italic?: boolean; link?: string; color?: string }
) =>
  chunkText(content, MAX_RICH_TEXT_CHARS).map((chunk) => ({
    type: 'text',
    text: {
      content: chunk,
      link: options?.link ? { url: options.link } : undefined,
    },
    annotations: options?.bold || options?.italic || options?.color
      ? { bold: !!options?.bold, italic: !!options?.italic, color: options?.color }
      : undefined,
  }));

const buildInlineRichText = (inlines: Array<NoteInline | ChatInline>) => {
  const richText: any[] = [];
  inlines.forEach((inline) => {
    if (inline.citation) {
      const link = inline.citation.source && isUrl(inline.citation.source) ? inline.citation.source : undefined;
      richText.push(
        ...buildTextRichText(` [${inline.citation.id}]`, { italic: true, link })
      );
      return;
    }
    if (inline.text) {
      richText.push(...buildTextRichText(inline.text, { bold: inline.bold, italic: inline.italic }));
    }
  });
  return richText.length > 0 ? richText : buildTextRichText('');
};

const chunkText = (text: string, size: number) => {
  const chunks: string[] = [];
  let index = 0;
  while (index < text.length) {
    chunks.push(text.slice(index, index + size));
    index += size;
  }
  return chunks.length ? chunks : [''];
};

const mapFormatToLanguage = (format?: ExportFormat) => {
  switch (format) {
    case 'JSON':
      return 'json';
    case 'Markdown':
      return 'markdown';
    case 'HTML':
      return 'html';
    default:
      return 'plain text';
  }
};

const buildParagraphBlock = (richText: any[], children?: any[]) => ({
  object: 'block',
  type: 'paragraph',
  paragraph: {
    rich_text: richText,
    ...(children && children.length > 0 ? { children } : {}),
  },
});

const buildHeadingBlock = (level: 1 | 2 | 3, text: string, color?: string) => {
  const safeLevel = level === 1 ? 1 : level === 2 ? 2 : 3;
  const type = safeLevel === 1 ? 'heading_1' : safeLevel === 2 ? 'heading_2' : 'heading_3';
  return {
    object: 'block',
    type,
    [type]: {
      rich_text: buildTextRichText(text, color ? { color } : undefined),
    },
  };
};

const buildToggleBlock = (text: string, children?: any[]) => ({
  object: 'block',
  type: 'toggle',
  toggle: {
    rich_text: buildTextRichText(text),
    ...(children && children.length > 0 ? { children } : {}),
  },
});

const buildBulletedItem = (text: string, children?: any[]) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: {
    rich_text: buildTextRichText(text),
    ...(children && children.length > 0 ? { children } : {}),
  },
});

const buildCodeBlock = (text: string, format?: ExportFormat) => ({
  object: 'block',
  type: 'code',
  code: {
    language: mapFormatToLanguage(format),
    rich_text: buildTextRichText(text),
  },
});

const buildTableBlock = (
  rows: Array<{ cells: any[] }>,
  options?: { hasColumnHeader?: boolean }
) => {
  const width = rows.reduce((max, row) => Math.max(max, row.cells.length), 0);
  if (width === 0) {
    return null;
  }
  const tableRows = rows.map((row) => {
    const padded = [...row.cells];
    while (padded.length < width) {
      padded.push([]);
    }
    return {
      object: 'block',
      type: 'table_row',
      table_row: {
        cells: padded,
      },
    };
  });
  return {
    object: 'block',
    type: 'table',
    table: {
      table_width: width,
      has_column_header: options?.hasColumnHeader ?? false,
      has_row_header: false,
      children: tableRows,
    },
  };
};

const buildDividerBlock = () => ({
  object: 'block',
  type: 'divider',
  divider: {},
});

const buildCalloutBlock = (text: string, children?: any[], icon = '❓') => ({
  object: 'block',
  type: 'callout',
  callout: {
    rich_text: buildTextRichText(text),
    icon: { type: 'emoji', emoji: icon },
    ...(children && children.length > 0 ? { children } : {}),
  },
});

const buildReferenceRichText = (citation: { id?: string; source?: string }) => {
  const label = citation.id ? `[${citation.id}]` : 'Reference';
  if (citation.source && isUrl(citation.source)) {
    return [
      { type: 'text', text: { content: `${label} ` } },
      { type: 'text', text: { content: citation.source, link: { url: citation.source } } },
    ];
  }
  const suffix = citation.source ? ` ${citation.source}` : '';
  return buildTextRichText(`${label}${suffix}`);
};

const QUIZ_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const buildQuizOptionBlock = (label: string, text: string) => {
  return buildBulletedItem(`${label}. ${text}`);
};

const buildQuizAnswerBlocks = (item: QuizItem) => {
  const answerChildren: any[] = [];
  const labels = item.answerOptions.map((_, index) => QUIZ_LABELS[index] || `Option ${index + 1}`);
  const correctOption = item.answerOptions.find((option) => option.isCorrect);
  const correctIndex = item.answerOptions.findIndex((option) => option.isCorrect);
  if (correctOption) {
    const label = labels[correctIndex] || 'Correct';
    answerChildren.push(
      buildParagraphBlock(buildTextRichText(`Correct answer: ${label}`))
    );
    answerChildren.push(buildParagraphBlock(buildTextRichText(`${label}. ${correctOption.text}`)));
    if (correctOption.rationale) {
      answerChildren.push(buildParagraphBlock(buildTextRichText(correctOption.rationale)));
    }
  } else {
    answerChildren.push(buildParagraphBlock(buildTextRichText('Correct answer not provided.')));
  }
  return answerChildren;
};

const buildQuizBlocksDetailed = (items: QuizItem[]) => {
  const blocks: any[] = [buildHeadingBlock(2, 'Quiz')];
  items.forEach((item, index) => {
    const questionText = item.question?.trim() || `Question ${index + 1}`;
    const children: any[] = [];
    const labels = item.answerOptions.map((_, idx) => QUIZ_LABELS[idx] || `Option ${idx + 1}`);

    if (item.answerOptions.length > 0) {
      item.answerOptions.forEach((option, optionIndex) => {
        children.push(buildQuizOptionBlock(labels[optionIndex], option.text));
      });
    }

    if (item.hint && item.hint.trim()) {
      children.push(buildToggleBlock('Hint', [buildParagraphBlock(buildTextRichText(item.hint))]));
    }

    children.push(buildToggleBlock('Answer', buildQuizAnswerBlocks(item)));

    const incorrectWithRationale = item.answerOptions
      .map((option, optionIndex) => ({ option, label: labels[optionIndex] }))
      .filter(({ option }) => !option.isCorrect && option.rationale);
    if (incorrectWithRationale.length > 0) {
      const whyChildren = incorrectWithRationale.map(({ option, label }) =>
        buildBulletedItem(`${label}. ${option.text}: ${option.rationale}`)
      );
      children.push(buildToggleBlock('Why other answers are incorrect', whyChildren));
    }
    blocks.push(buildCalloutBlock(`Q${index + 1}. ${questionText}`, children));

    if (index < items.length - 1) {
      blocks.push(buildDividerBlock());
    }
  });
  return blocks;
};

const buildQuizBlocksCompact = (items: QuizItem[]) => {
  const blocks: any[] = [buildHeadingBlock(2, 'Quiz (Compact)')];
  if (items.length === 0) {
    blocks.push(buildParagraphBlock(buildTextRichText('No questions found.')));
    return blocks;
  }

  const rows = [
    {
      cells: [
        buildTextRichText('Question #'),
        buildTextRichText('Question'),
        buildTextRichText('Options'),
        buildTextRichText('Answer'),
      ],
    },
    ...items.map((item, index) => {
      const options = item.answerOptions
        .map((option, optionIndex) => {
          const label = QUIZ_LABELS[optionIndex] || `Option ${optionIndex + 1}`;
          return `${label}. ${option.text}`;
        })
        .join('\n');
      return {
        cells: [
          buildTextRichText(`${index + 1}`),
          buildTextRichText(item.question?.trim() || `Question ${index + 1}`),
          buildTextRichText(options || '—'),
          buildTextRichText(`Toggle below (Q${index + 1})`),
        ],
      };
    }),
  ];
  const table = buildTableBlock(rows, { hasColumnHeader: true });
  if (table) {
    blocks.push(table);
  }

  items.forEach((item, index) => {
    const answerChildren = buildQuizAnswerBlocks(item);
    blocks.push(buildToggleBlock(`Answer Q${index + 1}`, answerChildren));
  });
  return blocks;
};

const parseFlashcardBack = (back: string) => {
  const lines = back
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  return lines;
};

const buildFlashcardBlocks = (items: FlashcardItem[]) => {
  const blocks: any[] = [buildHeadingBlock(2, 'Flashcards')];
  items.forEach((item, index) => {
    const front = item.f?.trim() || `Card ${index + 1}`;
    const back = item.b?.trim() || '';
    const children = back
      ? parseFlashcardBack(back).map((line) =>
          buildParagraphBlock(buildTextRichText(line, { color: 'blue' }))
        )
      : [];
    blocks.push(buildToggleBlock(front, children.length ? children : undefined));
    if (index < items.length - 1) {
      blocks.push(buildDividerBlock());
    }
  });
  return blocks;
};

const buildMindmapBulletedItems = (nodes: MindmapNode[]) => {
  return nodes.map((node) => {
    const title = node.title?.trim() || 'Untitled';
    const children = node.children && node.children.length > 0
      ? buildMindmapBulletedItems(node.children)
      : undefined;
    return buildBulletedItem(title, children);
  });
};

const buildMindmapBlocks = (items: MindmapNode[]) => {
  const blocks: any[] = [buildHeadingBlock(2, 'Mindmap')];
  items.forEach((node, index) => {
    const title = node.title?.trim() || `Section ${index + 1}`;
    blocks.push(buildHeadingBlock(3, title));
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        if (child.children && child.children.length > 0) {
          const toggleChildren = buildMindmapBulletedItems(child.children);
          blocks.push(buildToggleBlock(child.title || 'Untitled', toggleChildren));
        } else {
          blocks.push(buildBulletedItem(child.title || 'Untitled'));
        }
      });
    } else {
      blocks.push(buildBulletedItem(title));
    }

    if (index < items.length - 1) {
      blocks.push(buildDividerBlock());
    }
  });
  return blocks;
};

const buildDataTableBlocks = (items: DataTableRow[], sources?: string[]) => {
  const blocks: any[] = [buildHeadingBlock(2, 'Data table')];
  if (items.length === 0) {
    blocks.push(buildParagraphBlock(buildTextRichText('No rows found.')));
    return blocks;
  }
  const rows = items.map((row) => ({
    cells: row.cells.map((cell) => buildTextRichText(cell)),
  }));
  const table = buildTableBlock(rows, { hasColumnHeader: items.length > 1 });
  if (table) {
    blocks.push(table);
  }
  if (sources && sources.length > 0) {
    blocks.push(buildHeadingBlock(3, 'Sources'));
    sources.forEach((source) => {
      const cleaned = source?.trim();
      if (cleaned) {
        blocks.push(buildBulletedItem(cleaned));
      }
    });
  }
  return blocks;
};

const buildNoteContentBlocks = (items: NoteBlock[]) => {
  const blocks: any[] = [];
  items.forEach((block) => {
    if (block.type === 'paragraph') {
      blocks.push(buildParagraphBlock(buildInlineRichText(block.inlines)));
      return;
    }
    if (block.type === 'heading') {
      const text = block.inlines.map((inline) => inline.text).join('').trim();
      if (text) {
        blocks.push(buildHeadingBlock(block.level, text));
      }
      return;
    }
    if (block.type === 'code') {
      blocks.push(buildCodeBlock(block.text, 'Markdown'));
      return;
    }
    const rows = block.rows.map((row) => ({
      cells: row.map((cell) => buildInlineRichText(cell)),
    }));
    const table = buildTableBlock(rows);
    if (table) {
      blocks.push(table);
    }
  });
  return blocks;
};

const buildNoteBlocks = (items: NoteBlock[], label = 'Note') => {
  return [buildHeadingBlock(2, label), ...buildNoteContentBlocks(items)];
};

const buildChatBlocks = (items: ChatMessage[]) => {
  const blocks: any[] = [buildHeadingBlock(2, 'Chat')];
  items.forEach((message) => {
    const roleLabel = message.role === 'assistant' ? 'Assistant' : 'User';
    const roleColor = message.role === 'assistant' ? 'green' : 'blue';
    blocks.push(buildHeadingBlock(3, roleLabel, roleColor));
    message.chunks.forEach((chunk) => {
      if (chunk.type === 'paragraph') {
        blocks.push(buildParagraphBlock(buildInlineRichText(chunk.inlines)));
        return;
      }
      if (chunk.type === 'code') {
        blocks.push(buildCodeBlock(chunk.text, 'Markdown'));
        return;
      }
      const rows = chunk.rows.map((row) => ({
        cells: row.map((cell) => buildInlineRichText(cell)),
      }));
      const table = buildTableBlock(rows);
      if (table) {
        blocks.push(table);
      }
    });
  });
  return blocks;
};

const buildSourceBlocks = (items: SourceItem[]) => {
  const blocks: any[] = [];
  if (items.length === 0) {
    return [buildHeadingBlock(2, 'Source'), buildParagraphBlock(buildTextRichText('No source content found.'))];
  }
  items.forEach((item, index) => {
    const title = item.title?.trim() || `Source ${index + 1}`;
    blocks.push(buildHeadingBlock(2, title));

    if (item.summary && item.summary.length > 0) {
      blocks.push(buildHeadingBlock(3, 'Summary'));
      blocks.push(...buildNoteContentBlocks(item.summary));
    }

    if (item.keyTopics && item.keyTopics.length > 0) {
      blocks.push(buildHeadingBlock(3, 'Key topics'));
      item.keyTopics.forEach((topic) => {
        const cleaned = topic?.trim();
        if (cleaned) {
          blocks.push(buildBulletedItem(cleaned));
        }
      });
    }

    if (item.content && item.content.length > 0) {
      blocks.push(buildHeadingBlock(3, 'Source content'));
      blocks.push(...buildNoteContentBlocks(item.content));
    }

    if (index < items.length - 1) {
      blocks.push(buildDividerBlock());
    }
  });
  return blocks;
};

const buildCodeBlocks = (content: string, format?: ExportFormat) => {
  return [buildCodeBlock(content, format)];
};

const collectCitationsFromInlines = (inlines: Array<NoteInline | ChatInline>) => {
  const citations: Array<{ id?: string; source?: string }> = [];
  inlines.forEach((inline) => {
    if (!inline.citation) return;
    citations.push({
      id: inline.citation.id,
      source: inline.citation.source,
    });
  });
  return citations;
};

const collectCitations = (contentType: ContentType, items: any[]) => {
  const citations: Array<{ id?: string; source?: string }> = [];
  if (contentType === 'note' || contentType === 'report') {
    (items as NoteBlock[]).forEach((block) => {
      if (block.type === 'paragraph' || block.type === 'heading') {
        citations.push(...collectCitationsFromInlines(block.inlines));
      }
    });
  }
  if (contentType === 'chat') {
    (items as ChatMessage[]).forEach((message) => {
      message.chunks.forEach((chunk) => {
        if (chunk.type === 'paragraph') {
          citations.push(...collectCitationsFromInlines(chunk.inlines));
        }
      });
    });
  }
  const seen = new Set<string>();
  return citations.filter((citation) => {
    const key = `${citation.id || ''}|${citation.source || ''}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

const buildReferenceBlocks = (citations: Array<{ id?: string; source?: string }>) => {
  if (citations.length === 0) {
    return [];
  }
  const blocks: any[] = [buildHeadingBlock(2, 'References')];
  citations.forEach((citation) => {
    blocks.push({
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: buildReferenceRichText(citation),
      },
    });
  });
  return blocks;
};

const getNotionTitle = (title: any) => {
  if (typeof title === 'string') {
    return title.trim();
  }
  if (Array.isArray(title)) {
    return title.map((item: any) => item?.plain_text || '').join('').trim();
  }
  return '';
};

const getNotionPageTitle = (page: any) => {
  if (!page || typeof page !== 'object') {
    return '';
  }
  const directTitle = getNotionTitle(page.title);
  if (directTitle) {
    return directTitle;
  }
  const properties = page.properties;
  if (!properties || typeof properties !== 'object') {
    return '';
  }
  const titleEntry = Object.values(properties as Record<string, { type?: string; title?: any[] }>)
    .find((value) => value?.type === 'title');
  return getNotionTitle(titleEntry?.title);
};

const parseNotionProperties = (properties: any) => {
  if (!properties || typeof properties !== 'object') {
    return null;
  }
  const titleEntry = Object.entries(properties as Record<string, { type?: string }>)
    .find(([, value]) => value?.type === 'title');
  if (!titleEntry) {
    return null;
  }
  const [titlePropertyName] = titleEntry;
  return {
    titlePropertyName,
    properties: properties as Record<string, { type?: string }>,
  };
};

const getDatabaseDataSources = (database: any) => {
  const sources = Array.isArray(database?.data_sources) ? database.data_sources : [];
  return sources
    .map((source: any) => ({
      id: source?.id,
      name: getNotionTitle(source?.title),
    }))
    .filter((entry: { id?: string }) => Boolean(entry.id)) as Array<{ id: string; name: string }>;
};

const parseDatabaseInfo = (database: any, dataSource?: any): NotionDatabaseInfo | null => {
  if (
    !database
    || typeof database !== 'object'
    || !database.id
    || database.archived
    || database.in_trash
  ) {
    return null;
  }
  const databaseTitle = getNotionTitle(database.title);
  const dataSourceTitle = getNotionTitle(dataSource?.title);
  const parsed = parseNotionProperties(database.properties)
    || parseNotionProperties(dataSource?.properties);
  if (!parsed) {
    return null;
  }
  const dataSourceId = dataSource?.id || database?.data_sources?.[0]?.id;
  const parentPageId = normalizeNotionId(database?.parent?.page_id || '');
  return {
    id: database.id,
    title: (databaseTitle || dataSourceTitle).trim(),
    titlePropertyName: parsed.titlePropertyName,
    properties: parsed.properties,
    parentPageId: parentPageId || undefined,
    dataSourceId,
    dataSources: getDatabaseDataSources(database),
  };
};

const fetchDataSource = async (accessToken: string, dataSourceId: string) => {
  let response = await notionFetch(accessToken, `/data_sources/${dataSourceId}`);
  if (!response.ok) {
    response = await notionFetch(accessToken, `/databases/${dataSourceId}`);
  }
  if (!response.ok) {
    return null;
  }
  return response.json();
};

const fetchDatabase = async (accessToken: string, databaseId: string) => {
  const response = await notionFetch(accessToken, `/databases/${databaseId}`);
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  const parsedFromDatabase = parseDatabaseInfo(data);
  if (parsedFromDatabase?.properties && parsedFromDatabase.titlePropertyName) {
    return parsedFromDatabase;
  }
  const dataSourceId = data?.data_sources?.[0]?.id;
  if (!dataSourceId) {
    return parsedFromDatabase;
  }
  const dataSource = await fetchDataSource(accessToken, dataSourceId);
  if (!dataSource) {
    return parsedFromDatabase;
  }
  return parseDatabaseInfo(data, dataSource);
};

const fetchPage = async (accessToken: string, pageId: string) => {
  const response = await notionFetch(accessToken, `/pages/${pageId}`);
  if (!response.ok) {
    return null;
  }
  return response.json();
};

const createDatabase = async (accessToken: string, parentPageId: string) => {
  const response = await notionFetch(accessToken, '/databases', {
    method: 'POST',
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: parentPageId },
      title: buildRichText(DEFAULT_DATABASE_TITLE),
      initial_data_source: {
        properties: {
          Name: { title: {} },
          Type: {
            select: {
              options: [
                { name: 'Quiz' },
                { name: 'Flashcards' },
                { name: 'Mindmap' },
                { name: 'Note' },
                { name: 'Report' },
                { name: 'Chat' },
                { name: 'Data table' },
                { name: 'Sources' },
              ],
            },
          },
          Format: {
            select: {
              options: [
                { name: 'CSV' },
                { name: 'JSON' },
                { name: 'HTML' },
                { name: 'Markdown' },
              ],
            },
          },
          Source: { rich_text: {} },
          'Notebook URL': { url: {} },
          Exported: { date: {} },
          Items: { number: { format: 'number' } },
        },
      },
    }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || 'Notion API error creating database.');
  }
  const data = await response.json();
  return parseDatabaseInfo(data) || (data?.id ? fetchDatabase(accessToken, data.id) : null);
};

export const fetchNotionWorkspace = async (accessToken: string) => {
  const response = await notionFetch(accessToken, '/users/me');
  if (!response.ok) {
    return null;
  }
  const data = await response.json();
  const workspaceName = data?.bot?.workspace_name || null;
  if (workspaceName) {
    await setNotionWorkspaceName(workspaceName);
  }
  return workspaceName;
};

export const listNotionPages = async (accessToken: string): Promise<NotionPageChoice[]> => {
  const results: NotionPageChoice[] = [];
  let cursor: string | null | undefined = undefined;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore && pageCount < 5) {
    const response = await notionFetch(accessToken, '/search', {
      method: 'POST',
      body: JSON.stringify({
        query: '',
        filter: { property: 'object', value: 'page' },
        sort: { timestamp: 'last_edited_time', direction: 'descending' },
        page_size: 100,
        ...(cursor ? { start_cursor: cursor } : {}),
      }),
    });
    if (!response.ok) {
      break;
    }
    const data = await response.json();
    const pageResults = Array.isArray(data?.results) ? data.results : [];
    pageResults
      .filter((item: any) => {
        if (item?.object !== 'page' || !item?.id) {
          return false;
        }
        return item?.parent?.type === 'workspace';
      })
      .forEach((item: any) => {
        results.push({
          id: item.id,
          title: getNotionPageTitle(item) || item.id,
        });
      });
    hasMore = Boolean(data?.has_more);
    cursor = data?.next_cursor;
    pageCount += 1;
  }

  const seen = new Set<string>();
  return results.filter((entry) => {
    if (seen.has(entry.id)) {
      return false;
    }
    seen.add(entry.id);
    return true;
  });
};

const findDatabaseUnderPage = async (accessToken: string, parentPageId: string) => {
  let cursor: string | null | undefined = undefined;
  let hasMore = true;
  let pageCount = 0;

  while (hasMore && pageCount < 5) {
    const query = cursor ? `?start_cursor=${encodeURIComponent(cursor)}` : '';
    const response = await notionFetch(accessToken, `/blocks/${parentPageId}/children${query}`, {
      method: 'GET',
    });
    if (!response.ok) {
      break;
    }
    const data = await response.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    for (const block of results) {
      if (block?.type !== 'child_database' || !block?.id) {
        continue;
      }
      if (block?.archived || block?.in_trash) {
        continue;
      }
      const title = getNotionTitle(block.child_database?.title);
      if (title !== DEFAULT_DATABASE_TITLE) {
        continue;
      }
      const candidate = await fetchDatabase(accessToken, block.id);
      if (candidate?.title === DEFAULT_DATABASE_TITLE) {
        return candidate;
      }
    }
    hasMore = Boolean(data?.has_more);
    cursor = data?.next_cursor;
    pageCount += 1;
  }

  return null;
};

const isNotebookExportDatabase = (database: NotionDatabaseInfo | null) =>
  Boolean(database && database.title === DEFAULT_DATABASE_TITLE);

const isDatabaseUnderPage = (database: NotionDatabaseInfo | null, pageId: string) =>
  Boolean(database && database.parentPageId === pageId);

const updatePageDatabaseMap = async (pageId: string, databaseId: string) => {
  const pageMap = await getNotionPageDatabaseMap();
  if (pageMap[pageId] === databaseId) {
    return;
  }
  await setNotionPageDatabaseMap({
    ...pageMap,
    [pageId]: databaseId,
  });
};

const createDataSource = async (accessToken: string, databaseId: string, title: string) => {
  const response = await notionFetch(accessToken, '/data_sources', {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: databaseId },
      title: buildRichText(title),
    }),
  });
  if (!response.ok) {
    return null;
  }
  return response.json();
};

const resolveNotebookKey = (context?: NotionExportContext) =>
  context?.notebookId || context?.sourceUrl || context?.sourceTitle || null;

const resolveNotebookName = (context?: NotionExportContext) => {
  const name = context?.notebookTitle || context?.sourceTitle || '';
  return name.trim() || 'Notebook';
};

const resolveNotebookDataSource = async (
  accessToken: string,
  database: NotionDatabaseInfo,
  context?: NotionExportContext
) => {
  const notebookKey = resolveNotebookKey(context);
  if (!notebookKey) {
    return database.dataSourceId;
  }

  const notebookName = resolveNotebookName(context);
  const notebookMap = await getNotionNotebookMap();
  const existing = notebookMap[notebookKey];
  if (existing?.dataSourceId) {
    const dataSource = await fetchDataSource(accessToken, existing.dataSourceId);
    if (dataSource?.id) {
      return existing.dataSourceId;
    }
  }

  const matched = database.dataSources?.find(
    (source) => source.name && source.name.toLowerCase() === notebookName.toLowerCase()
  );
  if (matched?.id) {
    await setNotionNotebookMap({
      ...notebookMap,
      [notebookKey]: { dataSourceId: matched.id, name: notebookName },
    });
    return matched.id;
  }

  const created = await createDataSource(accessToken, database.id, notebookName);
  if (!created?.id) {
    return database.dataSourceId;
  }

  await setNotionNotebookMap({
    ...notebookMap,
    [notebookKey]: { dataSourceId: created.id, name: notebookName },
  });
  return created.id;
};

export const configureNotionDestination = async (accessToken: string, rawInput: string) => {
  const normalized = normalizeNotionId(rawInput);
  if (!normalized) {
    throw new Error('Enter a valid Notion page URL or ID.');
  }

  const pageMap = await getNotionPageDatabaseMap();
  const mappedDatabaseId = pageMap[normalized];
  if (mappedDatabaseId) {
    const mappedDatabase = await fetchDatabase(accessToken, mappedDatabaseId);
    if (isNotebookExportDatabase(mappedDatabase) && isDatabaseUnderPage(mappedDatabase, normalized)) {
      await setNotionDatabaseId(mappedDatabase.id);
      return mappedDatabase;
    }
    const { [normalized]: _removed, ...rest } = pageMap;
    await setNotionPageDatabaseMap(rest);
  }

  const page = await fetchPage(accessToken, normalized);
  if (!page) {
    throw new Error('Notion page not found.');
  }

  const previousDatabaseId = await getNotionDatabaseId();
  if (previousDatabaseId) {
    const existingDatabase = await fetchDatabase(accessToken, previousDatabaseId);
    if (isNotebookExportDatabase(existingDatabase) && isDatabaseUnderPage(existingDatabase, normalized)) {
      await setNotionDatabaseId(existingDatabase.id);
      await updatePageDatabaseMap(normalized, existingDatabase.id);
      return existingDatabase;
    }
  }

  let database = await findDatabaseUnderPage(accessToken, normalized);
  if (!database) {
    database = await createDatabase(accessToken, normalized);
  }
  if (!database) {
    throw new Error('Could not create the Notion destination. Check page access and try again.');
  }

  if (previousDatabaseId && previousDatabaseId !== database.id) {
    await clearNotionNotebookMap();
  }
  await setNotionDatabaseId(database.id);
  await updatePageDatabaseMap(normalized, database.id);
  return database;
};

const buildNotionProperties = (
  database: NotionDatabaseInfo,
  title: string,
  contentType?: ContentType,
  format?: ExportFormat,
  sourceTitle?: string,
  notebookUrl?: string,
  count?: number
) => {
  const properties: Record<string, any> = {
    [database.titlePropertyName]: { title: buildRichText(title) },
  };

  if (database.properties.Type?.type === 'select' && contentType) {
    properties.Type = { select: { name: CONTENT_TYPE_LABELS[contentType] } };
  }

  if (database.properties.Format?.type === 'select' && format) {
    properties.Format = { select: { name: format } };
  }

  if (database.properties.Source?.type === 'rich_text' && sourceTitle) {
    properties.Source = { rich_text: buildRichText(sourceTitle) };
  }

  if (notebookUrl) {
    if (database.properties['Notebook URL']?.type === 'url') {
      properties['Notebook URL'] = { url: notebookUrl };
    } else if (database.properties['Notebook URL']?.type === 'rich_text') {
      properties['Notebook URL'] = { rich_text: buildRichText(notebookUrl) };
    }
  }

  if (database.properties.Exported?.type === 'date') {
    properties.Exported = { date: { start: new Date().toISOString() } };
  }

  if (database.properties.Items?.type === 'number' && typeof count === 'number') {
    properties.Items = { number: count };
  }

  return properties;
};

const buildNotionTitle = (
  exportResult: ExportResult,
  fallback: string,
  context?: NotionExportContext
) => {
  if ((context?.contentType === 'note' || context?.contentType === 'report') && context?.meta?.title?.trim()) {
    return context.meta.title.trim();
  }
  if (exportResult.success) {
    const name = exportResult.filename.replace(/\.[^/.]+$/, '');
    if (name.trim()) {
      return name;
    }
  }
  return fallback;
};

export const uploadToNotion = async (
  exportResult: ExportResult,
  context?: NotionExportContext
) => {
  if (!exportResult.success) {
    return exportResult;
  }

  const accessToken = await getNotionAccessToken();
  if (!accessToken) {
    return { success: false, error: 'Connect Notion to continue.' };
  }

  const databaseId = await getNotionDatabaseId();
  if (!databaseId) {
    return { success: false, error: 'Set a Notion destination page to continue.' };
  }

  const database = await fetchDatabase(accessToken, databaseId);
  if (!database) {
    return { success: false, error: 'Notion destination not found or access missing.' };
  }

  const contentType = context?.contentType;
  const format = context?.format;
  const sourceTitle = context?.sourceTitle;
  const sourceUrl = context?.sourceUrl;
  const fallbackTitle = contentType ? CONTENT_TYPE_LABELS[contentType] : 'Export';
  const title = buildNotionTitle(exportResult, fallbackTitle, context);
  const properties = buildNotionProperties(
    database,
    title,
    contentType,
    format,
    sourceTitle,
    sourceUrl,
    exportResult.count
  );
  let blocks: any[] = [];
  const items = context?.items;
  if (contentType && items) {
    switch (contentType) {
      case 'quiz':
        blocks = format === 'CSV'
          ? buildQuizBlocksCompact(items as QuizItem[])
          : buildQuizBlocksDetailed(items as QuizItem[]);
        break;
      case 'flashcards':
        blocks = buildFlashcardBlocks(items as FlashcardItem[]);
        break;
      case 'mindmap':
        blocks = buildMindmapBlocks(items as MindmapNode[]);
        break;
      case 'datatable':
        blocks = buildDataTableBlocks(items as DataTableRow[], context?.meta?.sources);
        break;
      case 'note':
        blocks = buildNoteBlocks(items as NoteBlock[], 'Note');
        break;
      case 'report':
        blocks = buildNoteBlocks(items as NoteBlock[], 'Report');
        break;
      case 'chat':
        blocks = buildChatBlocks(items as ChatMessage[]);
        break;
      case 'source':
        blocks = buildSourceBlocks(items as SourceItem[]);
        break;
      default:
        blocks = [];
    }
  }
  if (blocks.length === 0) {
    const content = await exportResult.blob.text();
    blocks = buildCodeBlocks(content, format);
  }
  if (contentType && items) {
    const references = buildReferenceBlocks(collectCitations(contentType, items));
    if (references.length > 0) {
      blocks.push(...references);
    }
  }

  if (blocks.length > MAX_BLOCKS_PER_PAGE) {
    blocks = blocks.slice(0, MAX_BLOCKS_PER_PAGE - 1);
    blocks.push(buildParagraphBlock(buildTextRichText('Content truncated due to Notion block limits.')));
  }

  const dataSourceId = await resolveNotebookDataSource(accessToken, database, context);
  const response = await notionFetch(accessToken, '/pages', {
    method: 'POST',
    body: JSON.stringify({
      parent: dataSourceId ? { data_source_id: dataSourceId } : { database_id: database.id },
      properties,
      children: blocks,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error('Notion export failed:', detail);
    return { success: false, error: 'Notion export failed. Check your Notion connection and destination.' };
  }

  return { success: true };
};

