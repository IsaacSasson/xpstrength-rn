export function attachSyncHandlers(io, socket, buckets) {
  const userId = socket.data.user.id;

  /*
  // immediately prompt client to sync
  socket.emit("requestSync", { message: "Succesful connection" });

  // client asks for current snapshot
  socket.on("syncNow", () => {
    const bucket = buckets.get(userId);
    if (!bucket) return;
    socket.emit("syncData", {
      friends: bucket.friends,
      incomingRequests: bucket.incomingRequests,
      outgoingRequests: bucket.outgoingRequests,
      blocked: bucket.blocked,
      expAt: socket.data.expAt,
    });
  });

  */
}
