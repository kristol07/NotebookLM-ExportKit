
export interface ExtractMessage {
    type: 'EXTRACT_CONTENT';
    format: 'PDF' | 'CSV' | 'PPTX';
}

export interface ExtractResponse {
    success: boolean;
    data?: any;
    error?: string;
}
