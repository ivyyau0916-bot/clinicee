const MAX_EDGE = 1280;
const START_QUALITY = 0.72;
const MIN_QUALITY = 0.4;

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Couldn't read that photo. Try a JPEG or PNG."));
    };
    image.src = url;
  });
}

export async function fileToJpegBlob(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose a photo.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("That photo is larger than 20 MB.");
  }

  const image = await loadImage(file);
  if (!image.width || !image.height) {
    throw new Error("Couldn't read that photo. Try a JPEG or PNG.");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Couldn't prepare that photo.");
  context.drawImage(image, 0, 0, width, height);

  let quality = START_QUALITY;
  let blob = await canvasToJpeg(canvas, quality);
  while (blob.size > 900_000 && quality > MIN_QUALITY) {
    quality = Math.round((quality - 0.12) * 100) / 100;
    blob = await canvasToJpeg(canvas, quality);
  }
  return blob;
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Couldn't prepare that photo."))),
      "image/jpeg",
      quality,
    );
  });
}
