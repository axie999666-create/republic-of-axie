(() => {
  const MAX_SOURCE_BYTES = 8 * 1024 * 1024;
  const MAX_OUTPUT_BYTES = 240_000;
  const MAX_DIMENSION = 480;

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();
      image.onload = () => resolve({ image, objectUrl });
      image.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("无法读取这张图片，请更换文件后重试。"));
      };
      image.src = objectUrl;
    });
  }

  function canvasBlob(canvas, quality) {
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("图片压缩失败，请更换文件后重试。"));
      }, "image/jpeg", quality);
    });
  }

  async function blobToDataUrl(blob) {
    const bytes = new Uint8Array(await blob.arrayBuffer());
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    return `data:image/jpeg;base64,${btoa(binary)}`;
  }

  async function toJpegDataUrl(file) {
    if (!file || !file.type.startsWith("image/")) {
      throw new Error("请选择有效的图片文件。");
    }
    if (file.size > MAX_SOURCE_BYTES) {
      throw new Error("原始照片不能超过 8 MB。");
    }
    const { image, objectUrl } = await loadImage(file);
    try {
      if (!image.naturalWidth || !image.naturalHeight) {
        throw new Error("图片尺寸无效，请更换文件后重试。");
      }
      const scale = Math.min(1, MAX_DIMENSION / image.naturalWidth, MAX_DIMENSION / image.naturalHeight);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const context = canvas.getContext("2d");
      if (!context) throw new Error("浏览器无法处理图片，请换用较新的浏览器。");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.82, 0.72, 0.62]) {
        const blob = await canvasBlob(canvas, quality);
        if (blob.size <= MAX_OUTPUT_BYTES) return await blobToDataUrl(blob);
      }
      throw new Error("照片压缩后仍过大，请选择尺寸较小的图片。");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  window.AxieCitizenPhoto = Object.freeze({ toJpegDataUrl });
})();
