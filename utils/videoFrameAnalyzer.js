/**
 * 简易视频帧质量分析工具
 * 提供帧评分与帧差异度计算，帮助挑选更清晰、曝光适中的画面
 */

const DEFAULT_SAMPLE_LIMIT = 5000;

function computeSampleStep(pixelCount) {
  if (pixelCount <= DEFAULT_SAMPLE_LIMIT) {
    return 1;
  }
  return Math.floor(pixelCount / DEFAULT_SAMPLE_LIMIT);
}

function grayscale(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * 计算单帧得分
 * @param {ImageData} imageData
 * @returns {{score: number, stats: Object}}
 */
function scoreFrame(imageData) {
  if (!imageData) {
    return { score: 0, stats: {} };
  }

  const { data, width, height } = imageData;
  const pixelCount = width * height;
  const step = computeSampleStep(pixelCount);

  let sampleTotal = 0;
  let brightnessSum = 0;
  let brightnessSqSum = 0;
  let highlight = 0;
  let shadow = 0;
  let edgeAccum = 0;
  let edgeSamples = 0;

  const stride = step * 4;
  const rowStride = width * 4;

  for (let y = 0; y < height; y += Math.max(1, step)) {
    const rowOffset = y * rowStride;
    for (let x = 0; x < width; x += Math.max(1, step)) {
      const idx = rowOffset + x * 4;
      const gray = grayscale(data[idx], data[idx + 1], data[idx + 2]);
      brightnessSum += gray;
      brightnessSqSum += gray * gray;
      sampleTotal += 1;

      if (gray >= 240) {
        highlight += 1;
      } else if (gray <= 15) {
        shadow += 1;
      }

      const nextX = x + step;
      const nextY = y + step;
      if (nextX < width) {
        const rightIdx = rowOffset + nextX * 4;
        const rightGray = grayscale(data[rightIdx], data[rightIdx + 1], data[rightIdx + 2]);
        edgeAccum += Math.abs(gray - rightGray);
        edgeSamples += 1;
      }
      if (nextY < height) {
        const downIdx = (rowOffset + nextY * rowStride) + x * 4;
        const downGray = grayscale(data[downIdx], data[downIdx + 1], data[downIdx + 2]);
        edgeAccum += Math.abs(gray - downGray);
        edgeSamples += 1;
      }
    }
  }

  if (sampleTotal === 0) {
    return { score: 0, stats: {} };
  }

  const mean = brightnessSum / sampleTotal;
  const variance = Math.max(brightnessSqSum / sampleTotal - mean * mean, 0);
  const std = Math.sqrt(variance);
  const highlightRatio = highlight / sampleTotal;
  const shadowRatio = shadow / sampleTotal;
  const exposurePenalty = Math.min(highlightRatio + shadowRatio, 0.75);

  const edgeStrength = edgeSamples ? edgeAccum / edgeSamples : 0;
  const normalizedEdge = Math.min(edgeStrength / 128, 1);
  const normalizedContrast = Math.min(std / 64, 1);
  const exposureScore = 1 - exposurePenalty;

  const score = normalizedEdge * 0.55 + normalizedContrast * 0.35 + exposureScore * 0.1;

  return {
    score,
    stats: {
      meanBrightness: mean,
      stdBrightness: std,
      highlightRatio,
      shadowRatio,
      edgeStrength: normalizedEdge,
      contrastScore: normalizedContrast,
      exposureScore
    }
  };
}

/**
 * 计算两帧之间的平均差异值
 * @param {ImageData} current
 * @param {ImageData} previous
 * @returns {number}
 */
function frameDifference(current, previous) {
  if (!current || !previous) {
    return 1;
  }

  if (current.width !== previous.width || current.height !== previous.height) {
    return 1;
  }

  const { data: cur, width, height } = current;
  const { data: prev } = previous;
  const totalPixels = width * height;
  const step = computeSampleStep(totalPixels);

  let diffSum = 0;
  let samples = 0;
  const stride = step * 4;

  for (let i = 0; i < cur.length; i += stride) {
    const grayCur = grayscale(cur[i], cur[i + 1], cur[i + 2]);
    const grayPrev = grayscale(prev[i], prev[i + 1], prev[i + 2]);
    diffSum += Math.abs(grayCur - grayPrev);
    samples += 1;
  }

  if (samples === 0) {
    return 1;
  }

  return diffSum / samples / 255; // 0 - 1 范围
}

module.exports = {
  scoreFrame,
  frameDifference
};
