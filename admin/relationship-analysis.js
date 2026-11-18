export const smallGroupSize = 5;

function orderedCounts(counts) {
  return Object.entries(counts).map(([value, count]) => ({value: Number(value), count}))
    .filter(({value, count}) => Number.isFinite(value) && Number.isInteger(count) && count > 0)
    .sort((a, b) => a.value - b.value);
}

export function distributionStats(counts) {
  const values = orderedCounts(counts);
  const n = values.reduce((total, value) => total + value.count, 0);
  if (!n) return null;
  const valueAt = index => {
    let offset = index;
    for (const {value, count} of values) {
      if (offset < count) return value;
      offset -= count;
    }
  };
  const quantile = probability => {
    const index = (n - 1) * probability;
    const lower = Math.floor(index);
    const value = valueAt(lower);
    return value + (index - lower) * (valueAt(Math.ceil(index)) - value);
  };
  const q1 = quantile(.25), median = quantile(.5), q3 = quantile(.75);
  const iqr = q3 - q1;
  const inside = values.filter(({value}) => value >= q1 - 1.5 * iqr && value <= q3 + 1.5 * iqr);
  return {
    n, values, q1, median, q3, iqr,
    min: values[0].value, max: values.at(-1).value,
    lowerWhisker: inside[0].value, upperWhisker: inside.at(-1).value,
    mean: values.reduce((total, {value, count}) => total + value * count, 0) / n
  };
}

function midranks(counts) {
  let seen = 0;
  return new Map(orderedCounts(counts).map(({value, count}) => {
    const rank = seen + (count + 1) / 2;
    seen += count;
    return [value, rank];
  }));
}

export function scatterStats(minutesStress) {
  const points = [], minutesCounts = {}, scoreCounts = {};
  let n = 0;
  for (const [minuteKey, scores] of Object.entries(minutesStress)) {
    const minutes = Number(minuteKey);
    for (const {value: score, count} of orderedCounts(scores)) {
      points.push({minutes, score, count});
      minutesCounts[minutes] = (minutesCounts[minutes] || 0) + count;
      scoreCounts[score] = (scoreCounts[score] || 0) + count;
      n += count;
    }
  }
  if (!n) return null;
  const minutes = distributionStats(minutesCounts), scores = distributionStats(scoreCounts);
  const minuteRanks = midranks(minutesCounts), scoreRanks = midranks(scoreCounts);
  const meanRank = (n + 1) / 2;
  let cross = 0, spreadMinutes = 0, spreadScores = 0;
  for (const point of points) {
    const x = minuteRanks.get(point.minutes) - meanRank;
    const y = scoreRanks.get(point.score) - meanRank;
    cross += point.count * x * y;
    spreadMinutes += point.count * x * x;
    spreadScores += point.count * y * y;
  }
  const rho = n >= 3 && spreadMinutes && spreadScores ? cross / Math.sqrt(spreadMinutes * spreadScores) : null;
  return {n, points, minutes, scores, rho};
}
export function durationSensitivity({points, minutes: duration}) {
  const cutoff = duration.q3 + 1.5 * duration.iqr;
  const retained = {};
  let omitted = 0;
  for (const {minutes, score, count} of points) {
    if (minutes > cutoff) {
      omitted += count;
    } else {
      const scores = retained[minutes] ??= {};
      scores[score] = count;
    }
  }
  if (!omitted) return null;
  const reduced = scatterStats(retained);
  return {cutoff, omitted, n: reduced.n, rho: reduced.rho};
}
