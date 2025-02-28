import { Client, Account, ID, Avatars, Databases, Query } from "react-native-appwrite";
export const config = {
  endpoint: "https://cloud.appwrite.io/v1", // Your API Endpoint
  platform: "com.elicky.appraisal", // Your platform
  projectId: "67b8f9ce000b488553b2", // Your project ID
  databaseId: "67b8fbb10033d57cff74", // Your database ID
  userCollectionId: "67b8fbc7000db66d2c4a", // Your user collection ID
  appraisedCollectionId: "67b8fc0f0022d73cecb3", // Your appraised collection ID
  storageId: "67b8fdc7001e11054f57",
};

const client = new Client();
client
  .setEndpoint(config.endpoint) // Your API Endpoint
  .setProject(config.projectId)
  .setPlatform(config.platform);

const avatars = new Avatars(client);
const databases = new Databases(client);
const account = new Account(client);

export const createUser = async (
  email: string,
  password: string,
  username: string
) => {
  try {
    const newAccount = await account.create(
      ID.unique(),
      email,
      password,
      username
    );
    if (!newAccount) throw Error;

    const avatarUrl = avatars.getInitials(username);

    await signIn(email, password);

    const newUser = await databases.createDocument(
      config.databaseId,
      config.userCollectionId,
      ID.unique(),
      {
        accountId: newAccount.$id,
        email,
        username,
        avatar: avatarUrl,
      }
    );
    return newUser;
  } catch (error) {
    console.log(error);
  }
};

export const signIn = async(email: string, password: string) => {
  try {
    const session = await account.createEmailPasswordSession(email, password);
    return session;
  } catch (error) {
    console.log(error);
  }
}

export const getCurrentUser = async () => {
  try {
    const currentAccount = await account.get();
    if (!currentAccount) throw Error;

    const currentUser = await databases.listDocuments(
      config.databaseId,
      config.userCollectionId,
      [Query.equal('accountId', currentAccount.$id)]
    )

    if(!currentUser) throw Error;

    return currentUser.documents[0];
  } catch (error) {
    console.log(error)
  }
}
export const getAllPosts = async () => {
  try {
    const posts = await databases.listDocuments(
      config.databaseId,
      config.appraisedCollectionId
    );
    return posts.documents;
  } catch (error) {
    console.log(error);
  }
};
