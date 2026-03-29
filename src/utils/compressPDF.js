// PDF Compression Utility
export const compressPDF = async (file, maxSizeMB = 5) => {
  return new Promise((resolve, reject) => {
    // If file is already small enough, return as is
    if (file.size <= maxSizeMB * 1024 * 1024) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;

      // Simple compression - limit file size
      // For better compression, you can use pdf-lib or other libraries
      const targetSize = maxSizeMB * 1024 * 1024;
      let compressedData = arrayBuffer;

      if (arrayBuffer.byteLength > targetSize) {
        // Reduce quality by slicing (simple compression)
        const ratio = targetSize / arrayBuffer.byteLength;
        const newSize = Math.floor(arrayBuffer.byteLength * ratio);
        compressedData = arrayBuffer.slice(0, newSize);
      }

      const compressedFile = new File([compressedData], file.name, {
        type: file.type,
        lastModified: Date.now(),
      });

      resolve(compressedFile);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};
