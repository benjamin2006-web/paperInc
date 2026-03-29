// Chunked Upload Utility for slow connections
export const chunkedUpload = async (
  file,
  onProgress,
  chunkSize = 1024 * 1024,
) => {
  const chunks = Math.ceil(file.size / chunkSize);
  const uploadedChunks = [];

  for (let i = 0; i < chunks; i++) {
    const start = i * chunkSize;
    const end = Math.min(start + chunkSize, file.size);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', i);
    formData.append('totalChunks', chunks);
    formData.append('filename', file.name);
    formData.append('fileSize', file.size);

    // Upload chunk with retry logic
    let retries = 0;
    let success = false;

    while (!success && retries < 3) {
      try {
        const response = await fetch('/api/upload/chunk', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        uploadedChunks.push(data.chunkId);
        success = true;

        // Report progress
        const progress = ((i + 1) / chunks) * 100;
        if (onProgress) onProgress(progress);
      } catch (error) {
        retries++;
        if (retries === 3) throw error;
        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, 1000 * retries));
      }
    }
  }

  // Combine chunks
  const combineResponse = await fetch('/api/upload/combine', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      chunks: uploadedChunks,
      totalChunks: chunks,
    }),
  });

  if (!combineResponse.ok) throw new Error('Failed to combine chunks');

  return combineResponse.json();
};
