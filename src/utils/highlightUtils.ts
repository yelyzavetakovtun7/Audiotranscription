// Функція визначення активного сегмента
export const isSegmentActive = (segment: any, currentTime: number) => {
  const SEGMENT_OVERLAP = 0.1;
  return currentTime >= segment.start && currentTime < segment.end + SEGMENT_OVERLAP;
};

// Функція форматування тексту з підсвіткою
export const formatTextWithHighlight = (text: string, isActive: boolean) => {
  if (!isActive) return text;

  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = text;

  const walker = document.createTreeWalker(
    tempDiv,
    NodeFilter.SHOW_TEXT,
    null
  );

  const nodesToWrap: Text[] = [];
  let currentNode: Text | null;

  while ((currentNode = walker.nextNode() as Text | null)) {
    if (currentNode && 
        currentNode.nodeType === Node.TEXT_NODE && 
        !currentNode.parentElement?.hasAttribute('data-annotation') &&
        !currentNode.parentElement?.classList.contains('highlight-active') &&
        currentNode.textContent?.trim()) {
      nodesToWrap.push(currentNode);
    }
  }

  nodesToWrap.forEach(node => {
    const span = document.createElement('span');
    span.className = 'highlight-active';
    node.parentNode?.insertBefore(span, node);
    span.appendChild(node);
  });

  return tempDiv.innerHTML;
};

// Функція формування повного тексту з підсвіткою
export const getFullTextWithHighlight = (editedSegments: any[], currentTime: number) => {
  return editedSegments.map((segment) => {
    const shouldHighlight = isSegmentActive(segment, currentTime);
    const html = segment.htmlContent || segment.text;
    if (shouldHighlight) {
      return `<span class="highlight-active">${html}</span>`;
    }
    return html;
  }).join('');
}; 