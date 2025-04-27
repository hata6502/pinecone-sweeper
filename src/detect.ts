import cv from "@techstark/opencv-js";

await new Promise<void>((resolve) => {
  cv.onRuntimeInitialized = resolve;
});

export const getImageBasedMineCandidates = async (
  size: number,
  mineCount: number,
  imageURL: string,
) => {
  const image = new Image();
  image.src = imageURL;
  await image.decode();

  const imageSize = 256;
  const mat = cv.imread(image);
  cv.resize(mat, mat, new cv.Size(imageSize, imageSize));
  cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
  cv.goodFeaturesToTrack(mat, mat, mineCount, 0.01, 10);

  const mineCandidates = [];
  for (let i = 0; i < mat.rows; i++) {
    for (let j = 0; j < mat.cols; j++) {
      const [x, y] = mat.floatPtr(i, j);
      mineCandidates.push({
        columnIndex: Math.floor(size * (x / imageSize)),
        rowIndex: Math.floor(size * (y / imageSize)),
        x: x / (imageSize - 1),
        y: y / (imageSize - 1),
      });
    }
  }

  return mineCandidates;
};
