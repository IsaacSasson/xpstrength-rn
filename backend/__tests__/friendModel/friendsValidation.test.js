import Friend from "../../models/friends.model.js";
import User from "../../models/user.model.js";

describe.skip("validation check for friends", () => {
  it("Friends only accepts Integer Ids", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.friends = [1, "2", 3];
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("friends doesnt accept duplicates", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.friends = [1, 1, 3];
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("friends save must be an array", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.friends = { 1: [1, 2, 3] };
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("friends save not empty", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.friends = null;
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("Outgoing only accepts Integer Ids", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.outgoingRequests = [1, "2", 3];
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("outgoing doesnt accept duplicates", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.outgoingRequests = [1, 1, 3];
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("outgoing save must be an array", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.outgoingRequests = { 1: [1, 2, 3] };
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("outgoing save not empty", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.outgoingRequests = null;
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("incoming only accepts Integer Ids", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.incomingRequests = [1, "2", 3];
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("incoming doesnt accept duplicates", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.incomingRequests = [1, 1, 3];
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("incoming save must be an array", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.incomingRequests = { 1: [1, 2, 3] };
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });

  it("incoming save not empty", async () => {
    const user = await User.create({
      username: "testUser",
      password: "StrongPass12!",
      email: "test@gmail.com",
    });

    const friendData = await Friend.findOne({ where: { userId: user.id } });

    friendData.incomingRequests = null;
    expect(friendData.save()).rejects.toThrow();

    await user.destroy();
  });
});
