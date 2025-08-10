// userId -> { friends, incomingRequests, outgoingRequests, blocked, status?, sockets:Set<Socket> }
export const buckets = new Map();

export function ensureBucket(userId) {
  if (!buckets.has(userId)) {
    buckets.set(userId, {
      friends: null,
      incomingRequests: null,
      outgoingRequests: null,
      blocked: null,
      status: null,
      sockets: new Set(),
    });
  }
  return buckets.get(userId);
}
