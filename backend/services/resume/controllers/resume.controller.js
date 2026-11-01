import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs";

// Normalize AI-generated resume data before saving to MongoDB
const normalizeResumeData = (data) => {
    // Convert project strings into objects
    const projects = Array.isArray(data.projects)
        ? data.projects.map((project) => {
              if (typeof project === "string") {
                  return {
                      name: project.trim(),
                      title: project.trim(),
                      description: project.trim(),
                      technologies: [],
                      techStack: [],
                      achievements: [],
                      responsibilities: [],
                  };
              }

              if (project && typeof project === "object") {
                  return project;
              }

              return null;
          }).filter(Boolean)
        : [];

    // Normalize education year values
    const education = Array.isArray(data.education)
        ? data.education.map((item) => {
              if (!item || typeof item !== "object") {
                  return {};
              }

              const normalized = { ...item };

              if (typeof normalized.year === "string") {
                  const years =
                      normalized.year.match(/\b(?:19|20)\d{2}\b/g) || [];

                  if (years.length > 0) {
                      normalized.startYear =
                          normalized.startYear ?? Number(years[0]);

                      normalized.endYear =
                          normalized.endYear ??
                          Number(years[years.length - 1]);

                      normalized.year = Number(years[years.length - 1]);
                  } else {
                      delete normalized.year;
                  }
              }

              // Convert numeric year strings to numbers too
              if (
                  typeof normalized.year === "string" &&
                  /^\d{4}$/.test(normalized.year.trim())
              ) {
                  normalized.year = Number(normalized.year);
              }

              // Remove invalid numeric values
              for (const key of ["year", "startYear", "endYear"]) {
                  if (
                      normalized[key] !== undefined &&
                      normalized[key] !== null &&
                      !Number.isFinite(Number(normalized[key]))
                  ) {
                      delete normalized[key];
                  }
              }

              return normalized;
          })
        : [];

    return {
        ...data,
        projects,
        education,
    };
};

export const uploadResume = async (req, res) => {
    let file;

    try {
        file = req.file;

        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF is required",
            });
        }

        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required",
            });
        }

        // Extract text from the uploaded PDF
        const resumeText = await extractText(file.path);

        // Generate structured resume data using AI
        const aiResponse = await resumeAgent(resumeText);

        // Parse and normalize AI output
        const parsedData =
            typeof aiResponse === "string"
                ? JSON.parse(aiResponse)
                : aiResponse;

        if (!parsedData || typeof parsedData !== "object" || Array.isArray(parsedData)) {
            throw new Error("AI returned invalid resume data");
        }

        const resumeData = normalizeResumeData(parsedData);

        // Update an existing resume or create a new one
        let resume = await Resume.findOne({ userId });

        if (resume) {
            Object.assign(resume, {
                ...resumeData,
                extractedText: resumeText,
            });

            await resume.save();
        } else {
            resume = await Resume.create({
                userId,
                extractedText: resumeText,
                ...resumeData,
            });
        }

        // Refresh the Redis cache after successful database save
        await redis.set(
            `resume:${userId}`,
            JSON.stringify(resume)
        );

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            data: resume,
        });
    } catch (error) {
        console.error("Resume upload error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to upload and analyze resume",
        });
    } finally {
        // Delete the temporary PDF
        if (file?.path) {
            try {
                await fs.promises.unlink(file.path);
            } catch (cleanupError) {
                if (cleanupError.code !== "ENOENT") {
                    console.error("PDF cleanup error:", cleanupError);
                }
            }
        }
    }
};

export const getResume = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "UserId is required",
            });
        }

        // Try Redis first
        const cache = await redis.get(`resume:${userId}`);

        if (cache) {
            return res.status(200).json({
                success: true,
                source: "redis",
                data: JSON.parse(cache),
            });
        }

        // Fall back to MongoDB
        const resume = await Resume.findOne({ userId });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "Resume not found",
            });
        }

        // Populate Redis cache
        await redis.set(
            `resume:${userId}`,
            JSON.stringify(resume)
        );

        return res.status(200).json({
            success: true,
            source: "mongoDb",
            data: resume,
        });
    } catch (error) {
        console.error("Get resume error:", error);

        return res.status(500).json({
            success: false,
            message: error.message || "Failed to retrieve resume",
        });
    }
};
