// マツボックリ検出用の型定義
interface PineconeArea {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  areaSize: number;
  yRatio: number;
  score?: number;
}

interface CellCandidate {
  cellInfo: {
    columnIndex: number;
    rowIndex: number;
  };
  area: PineconeArea & { score: number };
}

export interface MineCandidate {
  columnIndex: number;
  rowIndex: number;
  x: number;
  y: number;
}

export const getImageBasedMineCandidates = (
  size: number,
  imageData: ImageData,
): MineCandidate[] => {
  // セルの実際のピクセルサイズを計算
  const cellWidth = Math.floor(imageData.width / size);
  const cellHeight = Math.floor(imageData.height / size);

  // マツボックリ検出のための閾値
  const PINE_CONE_MIN_SIZE = 3; // 最小検出サイズ (ピクセル)

  // 画像を分析して爆弾候補を作成
  const candidatesByCell = [...Array(size).keys()].map((rowIndex) =>
    [...Array(size).keys()].map((columnIndex) => {
      // セルの範囲を定義
      const startX = Math.floor((columnIndex * imageData.width) / size);
      const startY = Math.floor((rowIndex * imageData.height) / size);
      const endX = Math.min(
        Math.floor(((columnIndex + 1) * imageData.width) / size),
        imageData.width,
      );
      const endY = Math.min(
        Math.floor(((rowIndex + 1) * imageData.height) / size),
        imageData.height,
      );

      // マツボックリ候補領域の検出
      const potentialAreas: PineconeArea[] = [];

      // セル内を走査してマツボックリらしいエリアを探す
      // 簡易スキャン (全ピクセルではなく間引きしたサンプリング)
      const scanStep = Math.max(
        1,
        Math.floor(Math.min(cellWidth, cellHeight) / 10),
      );

      for (let y = startY; y < endY; y += scanStep) {
        for (let x = startX; x < endX; x += scanStep) {
          const index = (y * imageData.width + x) * 4;
          const [r, g, b] = imageData.data.slice(index, index + 3);

          // マツボックリの特徴を検出 - より詳細な色分析

          // 1. 茶色っぽさの計算 (赤と緑が青より高く、特定の比率を持つ)
          const isBrownish = r > b * 1.2 && g > b * 1.1 && r > 60;

          // 2. 色相・彩度・明度の計算（近似）
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;

          // 明度 (0-1)
          const lightness = (max + min) / 510; // 255*2

          // 彩度 (0-1)
          const saturation =
            delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1)) / 255;

          // 色相 (0-360)
          let hue = 0;
          if (delta !== 0) {
            if (max === r) {
              hue = ((g - b) / delta) % 6;
            } else if (max === g) {
              hue = (b - r) / delta + 2;
            } else {
              hue = (r - g) / delta + 4;
            }
            hue = Math.round(hue * 60);
            if (hue < 0) hue += 360;
          }

          // 3. マツボックリの色相範囲 (通常は茶色: 20-40度)
          const isInPineconeBrownRange = hue >= 15 && hue <= 45;

          // 4. マツボックリに適した彩度と明度
          const hasGoodSaturation = saturation > 0.1 && saturation < 0.9;
          const hasGoodLightness = lightness > 0.1 && lightness < 0.6; // 暗めから中間

          // 5. 色のコントラスト (各色チャネル間の差異)
          const colorContrast =
            Math.abs(r - g) + Math.abs(g - b) + Math.abs(b - r);
          const hasGoodContrast = colorContrast > 30;

          // 総合的な判定
          const isPotentialPinecone =
            isBrownish &&
            (isInPineconeBrownRange || hasGoodContrast) &&
            hasGoodSaturation &&
            hasGoodLightness;

          if (isPotentialPinecone) {
            // 候補領域の周囲を調べて、マツボックリのサイズを推定
            let areaSize = 0;
            const checkRadius = 4; // 検査する周囲の半径

            for (let dy = -checkRadius; dy <= checkRadius; dy++) {
              for (let dx = -checkRadius; dx <= checkRadius; dx++) {
                const checkX = x + dx;
                const checkY = y + dy;

                // 画像範囲内かチェック
                if (
                  checkX >= startX &&
                  checkX < endX &&
                  checkY >= startY &&
                  checkY < endY
                ) {
                  const checkIndex = (checkY * imageData.width + checkX) * 4;
                  const [cr, cg, cb] = imageData.data.slice(
                    checkIndex,
                    checkIndex + 3,
                  );

                  // 近接ピクセルがマツボックリらしい色かチェック
                  // 色相の近さも考慮
                  const isSimilarColor =
                    Math.abs(cr - r) < 50 &&
                    Math.abs(cg - g) < 50 &&
                    cb < Math.max(cr, cg) * 0.8 && // 青が他より十分に低い
                    (cr > cb || cg > cb); // 赤か緑が青より大きい

                  if (isSimilarColor) {
                    areaSize++;
                  }
                }
              }
            }

            // マツボックリらしい領域のサイズが一定以上なら候補に追加
            if (areaSize >= PINE_CONE_MIN_SIZE) {
              // スコア計算 - 色と形状の特徴を組み合わせる
              const colorScore = isInPineconeBrownRange ? 2.0 : 1.0;
              const contrastScore = hasGoodContrast ? 1.5 : 1.0;
              const sizeScore = Math.min(5, Math.log2(areaSize + 1));

              // 位置による調整 (画面全体に分散させる)
              const positionFactor = 1.0 + (y / imageData.height) * 0.3;

              // 最終スコア
              const score =
                colorScore * contrastScore * sizeScore * positionFactor;

              potentialAreas.push({
                x,
                y,
                r,
                g,
                b,
                areaSize,
                yRatio: y / imageData.height,
                score, // スコアを直接設定
              });
            }
          }
        }
      }

      // 候補が見つからなかった場合のフォールバック
      if (potentialAreas.length === 0) {
        // ランダムな位置を選択
        const x = Math.floor(startX + Math.random() * (endX - startX));
        const y = Math.floor(startY + Math.random() * (endY - startY));
        const index = (y * imageData.width + x) * 4;
        const [r, g, b] = imageData.data.slice(index, index + 3);

        potentialAreas.push({
          x,
          y,
          r,
          g,
          b,
          areaSize: 1,
          yRatio: y / imageData.height,
          score: 0.1, // 低いスコアを設定
        });
      }

      // 最もマツボックリらしい領域を選択 (すでにスコア付けされている)
      const bestArea = potentialAreas.reduce(
        (best, current) =>
          (current.score ?? 0) > (best.score ?? 0) ? current : best,
        potentialAreas[0],
      );

      return {
        cellInfo: { columnIndex, rowIndex },
        area: bestArea as PineconeArea & { score: number },
      };
    }),
  );

  // 画像全体でのスコア分布を見て正規化
  const candidatesByCellTyped = candidatesByCell as CellCandidate[][];
  const allScores = candidatesByCellTyped.flat().map((item) => item.area.score);
  const minScore = Math.min(...allScores.filter((s) => s > 0));
  const maxScore = Math.max(...allScores);
  const scoreRange = maxScore - minScore;

  // 最終的な候補リストを作成
  const finalCandidates = candidatesByCellTyped.flat().flatMap((cellData) => {
    const { cellInfo, area } = cellData;

    // スコアを0-1の範囲に正規化
    const normalizedScore =
      scoreRange > 0 && area.score >= minScore
        ? (area.score - minScore) / scoreRange
        : 0.1;

    // 正規化したスコアに基づく候補数を決定
    const baseCount = Math.floor(normalizedScore * 25);
    const adjustedCount = Math.max(1, Math.min(30, baseCount));

    return [...Array(adjustedCount).keys()].map(() => ({
      columnIndex: cellInfo.columnIndex,
      rowIndex: cellInfo.rowIndex,
      x: area.x,
      y: area.y,
    }));
  });

  return finalCandidates;
};
