import AppError from "../utils/AppError.js";
import milestoneService from "../services/milestone.service.js";
import { Milestone } from "../models/index.js";

export async function getOwnedMilestones(req, res, next) {
  try {
    const user = req?.user;
    if (!user?.id) throw new AppError("User ID not found", 400, "BAD_DATA");

    const owned = await milestoneService.getMilestones(user);

    // Build image URLs (relative or absolute)
    const base = req.baseUrl ? req.baseUrl : ""; // depends on your router mount
    const milestones = owned.map((r) => ({
      milestone: r.milestone,
      imageUrl: `/api/v1/milestone/milestones/${r.milestone}/image`, // adjust path as needed
    }));

    res.status(200).json({
      data: { milestones },
      message: "Successfully retrieved completed milestones",
    });
  } catch (err) {
    next(err);
  }
}

export async function getMilestoneImage(req, res, next) {
  try {
    const user = req?.user;
    if (!user?.id) throw new AppError("User ID not found", 400, "BAD_DATA");

    const id = Number(req.params.milestone);
    if (!Number.isFinite(id))
      throw new AppError("Invalid milestone id", 400, "BAD_DATA");

    // Fetch the image buffer for THIS user’s milestone
    const row = await Milestone.findOne({
      where: { userId: user.id, milestone: id },
      attributes: ["image", "imageMime"], // imageMime optional but recommended
      raw: true,
    });
    if (!row?.image) throw new AppError("Image not found", 404, "NOT_FOUND");

    const mime = row.imageMime || "image/png"; // default if you don't store mime
    res.setHeader("Content-Type", mime);
    res.setHeader("Cache-Control", "private, max-age=600"); // tweak to taste

    // Express can send a Buffer directly
    return res.status(200).send(row.image);
  } catch (err) {
    next(err);
  }
}

export async function getMilestoneData(req, res, next) {
  try {
    const user = req?.user ?? null;
    if (!user) {
      throw new AppError("User ID not found", 400, "BAD_DATA");
    }

    const mileStoneData = await milestoneService.getMilestoneData();

    res.status(200).json({
      data: {
        milestoneData: mileStoneData,
      },
      message: "Succesfully retrieved milestone data",
    });
  } catch (err) {
    next(err);
  }
}

export async function uploadMilestonePhoto(req, res, next) {
  const user = req?.user ?? null;
  const imgBuf = req?.file?.buffer ?? null; // Buffer | undefined
  const milestoneId = req?.body?.data?.milestoneId ?? null;

  try {
    if (!user) {
      throw new AppError("Malfored User ID", 400, "BAD_DATA");
    }

    if (!imgBuf) {
      throw new AppError("Image data Malformed", 400, "BAD_DATA");
    }

    if (!milestoneId) {
      throw new AppError("Milestone ID Missing", 400, "BAD_DATA");
    }

    await milestoneService.uploadMilestonePhoto(user, imgBuf, milestoneId);

    res.status(201).json({
      message: "MilestoneID Saved",
    });
  } catch (err) {
    next(err);
  }
}

export default { uploadMilestonePhoto, getMilestoneData, getOwnedMilestones };
