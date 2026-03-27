// db/schemas/doctor.schema.js

import mongoose from "mongoose";

const doctorSchema = new mongoose.Schema({
  // 🧑 Basic Info
  name: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
  },

  phone: {
    type: String,
    required: true,
  },

  password: {
    type: String,
    required: true,
  },

  profileImage: {
    type: String,
  },

  // 🎓 Professional Info
  specialization: {
    type: String, // Psychologist, Psychiatrist, Therapist
    required: true,
  },

  experience: {
    type: Number, // years
  },

  qualifications: {
    type: String, // MBBS, MD, etc.
  },

  licenseNumber: {
    type: String,
    required: true,
  },

  bio: {
    type: String,
  },

  // 💰 Consultation
  consultationFee: {
    type: Number,
    default: 0,
  },

  // 🟢 Availability
  availability: [
    {
      day: String,        // Monday, Tuesday
      startTime: String,  // "10:00 AM"
      endTime: String,    // "5:00 PM"
    },
  ],

  // ⭐ Rating & Reviews
  rating: {
    type: Number,
    default: 0,
  },

  totalReviews: {
    type: Number,
    default: 0,
  },

  // 📅 Sessions
  sessions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VideoSession",
    },
  ],

  // 📍 Location (for physical visit)
  clinicAddress: {
    type: String,
  },

  city: {
    type: String,
  },

  // 🟢 Status
  isVerified: {
    type: Boolean,
    default: false,
  },

  isAvailable: {
    type: Boolean,
    default: true,
  },

  // 🕒 Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Doctor = mongoose.model("Doctor", doctorSchema);
export default Doctor;