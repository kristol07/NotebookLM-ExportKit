
// import { defineContentScript } from 'wxt/sandbox'; // Auto-imported

export default defineContentScript({
  // Match NotebookLM and potential iframe domains (like usercontent.goog)
  matches: [
    'https://notebooklm.google.com/*',
    'https://*.usercontent.goog/*'
  ],
  allFrames: true,
  matchOriginAsFallback: true,
  main() {
    console.log('NotebookLM Export Pro content script running in:', window.location.href);

    browser.runtime.onMessage.addListener((message: any, sender, sendResponse) => {
      // Only process messages relevant to this frame
      // We can check if this frame actually has the data we need

      if (message.type === 'EXTRACT_CONTENT') {
        // We log in every frame so we can see where the message lands
        console.log('Frame received extract request:', window.location.href);

        try {
          if (message.format === 'CSV') {
            const decodeDataAttribute = (raw: string) => {
              const txt = document.createElement("textarea");
              txt.innerHTML = raw;
              return txt.value;
            };

            const tryExtractFromDocument = (doc: Document, depth: number): any => {
              if (!doc || depth > 4) return null;

              const dataElement = doc.querySelector('[data-app-data]');
              if (dataElement) {
                console.log('SUCCESS: Found data element in frame:', doc.URL);
                const rawData = dataElement.getAttribute('data-app-data');
                if (!rawData) {
                  return { success: false, error: 'empty_data', frameUrl: doc.URL };
                }

                const jsonString = decodeDataAttribute(rawData);
                try {
                  const jsonData = JSON.parse(jsonString);
                  if (jsonData.quiz || jsonData.notes || jsonData.sources) {
                    console.log("Extracted Valid Data:", jsonData);
                    return { success: true, data: jsonData, frameUrl: doc.URL };
                  }
                  return { success: false, error: 'invalid_payload', frameUrl: doc.URL };
                } catch (parseErr) {
                  console.error('JSON Parse Error:', parseErr);
                  return { success: false, error: 'parse_error', frameUrl: doc.URL };
                }
              }

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

            const result = tryExtractFromDocument(document, 0);
            if (result?.success) {
              sendResponse(result);
              return;
            }
            console.log('No data element in this frame or its same-origin iframes.');
          } else {
            // Fallback for PDF text extraction
            // Only return body text if it's substantial?
            const content = document.body.innerText;
            if (content.length > 500) {
              sendResponse({ success: true, data: content.substring(0, 100) + '...', frameUrl: window.location.href });
              return;
            }
          }

        } catch (e) {
          console.error("Extraction error in frame:", e);
        }

        sendResponse({ success: false, error: 'not_found', frameUrl: window.location.href });
        return false;
      }
    });
  },
});
