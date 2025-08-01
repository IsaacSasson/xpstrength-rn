import sharp from "sharp";

export async function validateProfilePic(pic) {
  try {
    if (pic === null) {
      return;
    }

    const image = sharp(pic);
    const metadata = await image.metadata();

    if (metadata.format !== "jpeg" && metadata.format !== "png") {
      throw new Error("Unsupported image type");
    }
  } catch (err) {
    console.log(err);
    throw new Error("Invalid image uploaded");
  }
}
