function forEachBucketKey2D(bounds, bucketSize, visit) {
  const startX = Math.floor(bounds.left / bucketSize);
  const endX = Math.floor(bounds.right / bucketSize);
  const startY = Math.floor(bounds.top / bucketSize);
  const endY = Math.floor(bounds.bottom / bucketSize);
  for (let bx = startX; bx <= endX; bx += 1) {
    for (let by = startY; by <= endY; by += 1) {
      visit(`${bx}:${by}`);
    }
  }
}

function forEachBucketKey1D(bounds, bucketSize, visit) {
  const startX = Math.floor(bounds.left / bucketSize);
  const endX = Math.floor(bounds.right / bucketSize);
  for (let bx = startX; bx <= endX; bx += 1) {
    visit(String(bx));
  }
}

const overlapsX = (a, b) => a.left < b.right && a.right > b.left;
const overlapsXY = (a, b) =>
  overlapsX(a, b) && a.top < b.bottom && a.bottom > b.top;

function collidesInBuckets(
  forEachBucketKey,
  overlaps,
  bounds,
  bucketStore,
  bucketSize,
) {
  let collided = false;
  forEachBucketKey(bounds, bucketSize, (key) => {
    if (collided) return;
    const bucket = bucketStore.get(key);
    if (!bucket) return;
    for (let i = 0; i < bucket.length; i += 1) {
      if (overlaps(bounds, bucket[i])) {
        collided = true;
        return;
      }
    }
  });
  return collided;
}

function addToBuckets(forEachBucketKey, bounds, bucketStore, bucketSize) {
  forEachBucketKey(bounds, bucketSize, (key) => {
    const bucket = bucketStore.get(key);
    if (bucket) bucket.push(bounds);
    else bucketStore.set(key, [bounds]);
  });
}

export function collides2D(bounds, bucketStore, bucketSize) {
  return collidesInBuckets(
    forEachBucketKey2D,
    overlapsXY,
    bounds,
    bucketStore,
    bucketSize,
  );
}

export function addBounds2D(bounds, bucketStore, bucketSize) {
  addToBuckets(forEachBucketKey2D, bounds, bucketStore, bucketSize);
}

export function collides1D(bounds, bucketStore, bucketSize) {
  return collidesInBuckets(
    forEachBucketKey1D,
    overlapsX,
    bounds,
    bucketStore,
    bucketSize,
  );
}

export function addBounds1D(bounds, bucketStore, bucketSize) {
  addToBuckets(forEachBucketKey1D, bounds, bucketStore, bucketSize);
}
