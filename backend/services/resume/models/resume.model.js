
import mongoose from "../../../shared/mongoose.js";
import { databaseConnections } from "../../../shared/databaseConnections.js";

const { Schema } = mongoose;

// Reusable link schema
const linkSchema = new Schema(
  {
    label: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

// Education
const educationSchema = new Schema(
  {
    degree: { type: String, default: "" },
    qualification: { type: String, default: "" },
    fieldOfStudy: { type: String, default: "" },
    institution: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    startYear: { type: Number },
    endYear: { type: Number },
    year: { type: Number },
    percentage: { type: String, default: "" },
    grade: { type: String, default: "" },
    gpa: { type: String, default: "" },
    coursework: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// Projects

const projectSchema = new Schema(
  {
    name: { type: String, default: "" },
    title: { type: String, default: "" },

    // AI may return description as a string or bullet points.
    description: {
      type: Schema.Types.Mixed,
      default: "",
    },

    role: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    techStack: { type: [String], default: [] },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    url: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    achievements: { type: [String], default: [] },
    responsibilities: { type: [String], default: [] },
  },
  { _id: false }
);

// Work experience and internships
const experienceSchema = new Schema(
  {
    title: { type: String, default: "" },
    role: { type: String, default: "" },
    position: { type: String, default: "" },
    company: { type: String, default: "" },
    organization: { type: String, default: "" },
    location: { type: String, default: "" },
    employmentType: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    dates: { type: String, default: "" },
    currentlyWorking: { type: Boolean, default: false },
    description: { type: String, default: "" },
    responsibilities: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
    technologies: { type: [String], default: [] },
  },
  { _id: false }
);

// Certifications, courses, and training
const certificationSchema = new Schema(
  {
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    organization: { type: String, default: "" },
    issueDate: { type: String, default: "" },
    expiryDate: { type: String, default: "" },
    credentialId: { type: String, default: "" },
    credentialUrl: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// Volunteering and extracurricular activities
const activitySchema = new Schema(
  {
    title: { type: String, default: "" },
    organization: { type: String, default: "" },
    role: { type: String, default: "" },
    location: { type: String, default: "" },
    startDate: { type: String, default: "" },
    endDate: { type: String, default: "" },
    description: { type: String, default: "" },
    responsibilities: { type: [String], default: [] },
    achievements: { type: [String], default: [] },
  },
  { _id: false }
);

// Awards, honors, and accomplishments
const achievementSchema = new Schema(
  {
    title: { type: String, default: "" },
    issuer: { type: String, default: "" },
    date: { type: String, default: "" },
    description: { type: String, default: "" },
    url: { type: String, default: "" },
  },
  { _id: false }
);

// Languages
const languageSchema = new Schema(
  {
    name: { type: String, default: "" },
    proficiency: { type: String, default: "" },
  },
  { _id: false }
);

// Publications, research, and papers
const publicationSchema = new Schema(
  {
    title: { type: String, default: "" },
    publisher: { type: String, default: "" },
    publicationDate: { type: String, default: "" },
    authors: { type: [String], default: [] },
    url: { type: String, default: "" },
    description: { type: String, default: "" },
  },
  { _id: false }
);

// Main resume schema
const resumeSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      unique: true,
      index: true,
    },

    // Original PDF text and contact information
    extractedText: { type: String, required: true },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    alternatePhone: { type: String, default: "" },
    location: { type: String, default: "" },
    address: { type: String, default: "" },
    professionalTitle: { type: String, default: "" },
    summary: { type: String, default: "" },
    objective: { type: String, default: "" },

    // Online profiles
    website: { type: String, default: "" },
    linkedin: { type: String, default: "" },
    github: { type: String, default: "" },
    portfolio: { type: String, default: "" },
    links: { type: [linkSchema], default: [] },

    // Resume sections
    education: { type: [educationSchema], default: [] },
    skills: { type: [String], default: [] },
    technicalSkills: { type: [String], default: [] },
    softSkills: { type: [String], default: [] },
    projects: { type: [projectSchema], default: [] },
    experience: { type: [experienceSchema], default: [] },
    certifications: { type: [certificationSchema], default: [] },
    internships: { type: [experienceSchema], default: [] },
    activities: { type: [activitySchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
    languages: { type: [languageSchema], default: [] },
    publications: { type: [publicationSchema], default: [] },
    coursework: { type: [String], default: [] },
    interests: { type: [String], default: [] },
    references: { type: [String], default: [] },

    // AI resume analysis
    score: { type: Number, default: 0, min: 0, max: 100 },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    missingSkills: { type: [String], default: [] },
    recommendations: { type: [String], default: [] },
    suggestedRole: { type: String, default: "" },
    atsKeywords: { type: [String], default: [] },
    atsFeedback: { type: String, default: "" },

  },
  { timestamps: true }
);

const Resume = databaseConnections.resume.model("Resume", resumeSchema);

export default Resume;
