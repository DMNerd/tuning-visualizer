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

export function collides2D(bounds, bucketStore, bucketSize) {
  let collided = false;
  forEachBucketKey2D(bounds, bucketSize, (key) => {
    if (collided) return;
    const bucket = bucketStore.get(key);
    if (!bucket) return;
    for (let i = 0; i < bucket.length; i += 1) {
      const b = bucket[i];
      if (
        bounds.left < b.right &&
        bounds.right > b.left &&
        bounds.top < b.bottom &&
        bounds.bottom > b.top
      ) {
        collided = true;
        return;
      }
    }
  });
  return collided;
}

export function addBounds2D(bounds, bucketStore, bucketSize) {
  forEachBucketKey2D(bounds, bucketSize, (key) => {
    const bucket = bucketStore.get(key);
    if (bucket) bucket.push(bounds);
    else bucketStore.set(key, [bounds]);
  });
}

function forEachBucketKey1D(bounds, bucketSize, visit) {
  const startX = Math.floor(bounds.left / bucketSize);
  const endX = Math.floor(bounds.right / bucketSize);
  for (let bx = startX; bx <= endX; bx += 1) {
    visit(String(bx));
  }
}

export function collides1D(bounds, bucketStore, bucketSize) {
  let collided = false;
  forEachBucketKey1D(bounds, bucketSize, (key) => {
    if (collided) return;
    const bucket = bucketStore.get(key);
    if (!bucket) return;
    for (let i = 0; i < bucket.length; i += 1) {
      const b = bucket[i];
      if (bounds.left < b.right && bounds.right > b.left) {
        collided = true;
        return;
      }
    }
  });
  return collided;
}

export function addBounds1D(bounds, bucketStore, bucketSize) {
  forEachBucketKey1D(bounds, bucketSize, (key) => {
    const bucket = bucketStore.get(key);
    if (bucket) bucket.push(bounds);
    else bucketStore.set(key, [bounds]);
  });
}
