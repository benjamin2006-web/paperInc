// Simple PDF cache for faster loading
const pdfCache = new Map();

export const preloadPDF = (paperId, pdfUrl) => {
  if (pdfCache.has(paperId)) return pdfCache.get(paperId);

  const promise = fetch(pdfUrl, { mode: 'cors' })
    .then((response) => response.blob())
    .then((blob) => URL.createObjectURL(blob));

  pdfCache.set(paperId, promise);
  return promise;
};

export const getCachedPDF = (paperId) => {
  return pdfCache.get(paperId);
};

export const clearPDFCache = () => {
  pdfCache.clear();
};
