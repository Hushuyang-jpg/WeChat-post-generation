import { WECHAT_STYLES } from '../constants';

export const parseMarkdownToWeChatHtml = (md: string, imageUrls: Record<string, string>): string => {
  let html = md;

  // 1. Sanitize basics
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // 2. Handle Images ((IMG: ...))
  // We first replace the keys with the HTML structure using the pre-generated URLs
  html = html.replace(/\(\(IMG:\s*(.*?)\)\)/g, (match, p1) => {
    const promptKey = p1.trim();
    const url = imageUrls[promptKey];
    
    if (!url) {
        return `<section style="color:red; text-align:center; padding: 20px;">[图片生成失败: ${promptKey}]</section>`;
    }

    // WeChat prefers blocks for images to avoid inline reflow issues
    return `
      <section style="${WECHAT_STYLES.imgWrapper}">
        <img src="${url}" style="${WECHAT_STYLES.img}" alt="${promptKey}" />
        <section style="${WECHAT_STYLES.imgCaption}">▲ ${promptKey}</section>
      </section>
    `;
  });

  // 3. Headers
  // Use section for headers to ensure block-level behavior
  html = html.replace(/^# (.*$)/gm, `<h1 style="${WECHAT_STYLES.h1}">$1</h1>`);
  html = html.replace(/^## (.*$)/gm, `<h2 style="${WECHAT_STYLES.h2}">$1</h2>`);
  html = html.replace(/^### (.*$)/gm, `<section style="font-size: 17px; font-weight: bold; margin: 30px 0 15px; color: #222;">$1</section>`);

  // 4. Bold
  html = html.replace(/\*\*(.*?)\*\*/g, `<strong style="${WECHAT_STYLES.strong}">$1</strong>`);
  html = html.replace(/__(.*?)__/g, `<strong style="${WECHAT_STYLES.strong}">$1</strong>`);

  // 5. Blockquotes
  html = html.replace(/^\> (.*$)/gm, `<section style="${WECHAT_STYLES.blockquote}">$1</section>`);

  // 6. Highlight Box 【...】
  html = html.replace(/【(.*?)】/g, `<section style="${WECHAT_STYLES.highlightBox}">$1</section>`);

  // 7. Tables (Simple regex parser for Markdown tables)
  // This is a simplified parser. For robust tables, a library is better, but this fits the "no external deps" constraint better.
  const tableRow = (content: string, isHeader: boolean) => {
      const cells = content.split('|').filter(c => c.trim() !== '');
      const style = isHeader 
        ? "background: #f8f8f8; font-weight: bold; color: #b48e4d; padding: 10px; border: 1px solid #eee;" 
        : "padding: 10px; border: 1px solid #eee; color: #555;";
      
      const cols = cells.map(c => `<td style="${style}">${c.trim()}</td>`).join('');
      return `<tr>${cols}</tr>`;
  };

  // Find table blocks
  html = html.replace(/((?:\|.*\|\r?\n)+)/g, (match) => {
      const lines = match.trim().split('\n');
      if (lines.length < 2) return match;
      
      // Check if second line is separator
      if (!lines[1].includes('---')) return match;

      const header = tableRow(lines[0], true);
      const body = lines.slice(2).map(line => tableRow(line, false)).join('');
      
      return `<section style="overflow-x: auto;"><table style="width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px;"><tbody>${header}${body}</tbody></table></section>`;
  });

  // 8. Paragraphs (Match non-tag lines)
  // We need to be careful not to wrap already formatted tags.
  // A simple way is to split by double newlines and wrap plain text.
  
  // Using explicit <p> tags with style is the safest for WeChat text content.
  const lines = html.split('\n');
  const processedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      // If it starts with a tag we already processed, leave it alone.
      if (trimmed.startsWith('<section') || trimmed.startsWith('<h') || trimmed.startsWith('<div') || trimmed.startsWith('<table') || trimmed.startsWith('<tr') || trimmed.startsWith('<td')) return trimmed;
      
      return `<p style="${WECHAT_STYLES.p}">${trimmed}</p>`;
  });
  
  // Use a section wrapper instead of div for the root.
  // We removed max-width: 677px from inline style because WeChat's container handles width. 
  // Adding it inline can sometimes cause weird centering issues if margin:auto is stripped.
  return `<section style="font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif; background:#fff; line-height: 2.0; letter-spacing: 0.5px;">
    ${processedLines.join('')}
  </section>`;
};