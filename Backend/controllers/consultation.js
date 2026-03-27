import { StreamClient } from "@stream-io/node-sdk";
import Doctor from "../models/Doctor.js";
import Consultation from "../models/Consultation.js";

function ensureStreamConfig() {
  const apiKey = process.env.STREAM_API_KEY;
  const apiSecret = process.env.STREAM_API_SECRET;

  if (!apiKey || !apiSecret) {
    throw new Error("Stream env vars are missing. Set STREAM_API_KEY and STREAM_API_SECRET.");
  }

  return { apiKey, apiSecret };
}

function createStreamToken({ userId }) {
  const { apiKey, apiSecret } = ensureStreamConfig();
  const streamClient = new StreamClient(apiKey, apiSecret);

  const token = streamClient.generateUserToken({
    user_id: userId,
    validity_in_seconds: 60 * 60 * 2,
  });

  return {
    token,
    apiKey,
  };
}

function assertConsultationJoinAllowed(consultation) {
  if (!consultation) {
    return { ok: false, status: 404, message: "Consultation not found" };
  }

  if (consultation.status === "completed" || consultation.status === "cancelled") {
    return { ok: false, status: 400, message: "This consultation is no longer active" };
  }

  const scheduledTime = new Date(consultation.scheduledAt).getTime();
  if (Number.isNaN(scheduledTime)) {
    return { ok: false, status: 400, message: "Consultation has invalid schedule time" };
  }

  if (Date.now() < scheduledTime) {
    return {
      ok: false,
      status: 403,
      message: `You can join only at the scheduled time: ${new Date(scheduledTime).toLocaleString()}`,
    };
  }

  return { ok: true };
}

export const listAvailableDoctors = async (_req, res) => {
  try {
    const doctors = await Doctor.find({ isAvailable: true })
      .select("name specialization experience consultationFee rating city")
      .sort({ rating: -1, experience: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      message: "Available doctors fetched successfully",
      doctors,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createConsultation = async (req, res) => {
  try {
    const { doctorId, concern, scheduledAt } = req.body;

    if (!doctorId) {
      return res.status(400).json({ message: "doctorId is required" });
    }

    if (!scheduledAt) {
      return res.status(400).json({ message: "scheduledAt is required" });
    }

    const scheduledDate = new Date(scheduledAt);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: "Invalid scheduledAt date/time" });
    }

    if (scheduledDate.getTime() <= Date.now()) {
      return res.status(400).json({ message: "Please choose a future date/time for booking" });
    }

    const doctor = await Doctor.findById(doctorId).lean();
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const existing = await Consultation.findOne({
      doctorId,
      studentEmail: req.user.email,
      status: { $in: ["pending", "ongoing"] },
    })
      .sort({ createdAt: -1 })
      .lean();

    if (existing) {
      return res.status(200).json({
        message: "Existing active consultation found",
        consultation: existing,
      });
    }

    const consultation = await Consultation.create({
      doctorId,
      studentName: req.user.name,
      studentEmail: req.user.email,
      concern: concern?.trim() || "General consultation",
      scheduledAt: scheduledDate,
      status: "pending",
    });

    res.status(201).json({
      message: "Consultation created successfully",
      consultation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentCurrentConsultations = async (req, res) => {
  try {
    const consultations = await Consultation.find({
      studentEmail: req.user.email,
      status: { $in: ["pending", "ongoing"] },
    })
      .sort({ updatedAt: -1 })
      .populate("doctorId", "name specialization experience consultationFee rating")
      .lean();

    res.status(200).json({
      message: "Current consultations fetched successfully",
      consultations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentConsultationHistory = async (req, res) => {
  try {
    const consultations = await Consultation.find({
      studentEmail: req.user.email,
    })
      .sort({ updatedAt: -1 })
      .populate("doctorId", "name specialization experience consultationFee rating city")
      .lean();

    res.status(200).json({
      message: "Consultation history fetched successfully",
      consultations,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getStudentStreamToken = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId);
    const joinCheck = assertConsultationJoinAllowed(consultation);
    if (!joinCheck.ok) {
      return res.status(joinCheck.status).json({ message: joinCheck.message });
    }

    if (consultation.studentEmail !== req.user.email) {
      return res.status(403).json({ message: "Not allowed for this consultation" });
    }

    if (consultation.status === "pending") {
      consultation.status = "ongoing";
      await consultation.save();
    }

    const callId = `consultation-${consultation._id}`;
    const tokenPayload = createStreamToken({
      userId: `student-${req.user._id}`,
    });

    res.status(200).json({
      message: "Stream token created",
      callId,
      ...tokenPayload,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorStreamToken = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId);
    const joinCheck = assertConsultationJoinAllowed(consultation);
    if (!joinCheck.ok) {
      return res.status(joinCheck.status).json({ message: joinCheck.message });
    }

    if (String(consultation.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed for this consultation" });
    }

    if (consultation.status === "pending") {
      consultation.status = "ongoing";
      await consultation.save();
    }

    const callId = `consultation-${consultation._id}`;
    const tokenPayload = createStreamToken({
      userId: `doctor-${req.user._id}`,
    });

    res.status(200).json({
      message: "Stream token created",
      callId,
      ...tokenPayload,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const completeConsultation = async (req, res) => {
  try {
    const { consultationId } = req.params;

    const consultation = await Consultation.findById(consultationId);
    if (!consultation) {
      return res.status(404).json({ message: "Consultation not found" });
    }

    if (String(consultation.doctorId) !== String(req.user._id)) {
      return res.status(403).json({ message: "Not allowed for this consultation" });
    }

    consultation.status = "completed";
    consultation.completedAt = new Date();
    await consultation.save();

    res.status(200).json({
      message: "Consultation marked as completed",
      consultation,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};