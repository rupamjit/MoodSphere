import Student from "../models/Student.js";

// Get student profile
export const getStudentProfile = async (req, res) => {
  try {
    const student = await Student.findById(req.user.id)
      .populate("allSessions");

    if (!student) {
      return res.status(404).json({ msg: "Student not found" });
    }

    const profile = {
      basicInfo: {
        name: student.name,
        email: student.email,
        phone: student.phone,
        age: student.age,
        gender: student.gender,
        profileImage: student.ProfileImage,
      },

      academicInfo: {
        university: student.university,
        rollNumber: student.rollNumber,
        className: student.className,
        section: student.section,
      },

      mentalHealth: {
        currentMood: student.currentMood,
        moodScore: student.moodScore,
        riskLevel: student.riskLevel,
      },

      stats: {
        totalSessions: student.allSessions.length,
        lastActive: student.lastActive,
      },

      contacts: {
        parent: student.parentContact,
        mentor: student.mentorContact,
      },

      moodHistory: student.moodHistory.slice(-10), // last 10 only
    };

    res.status(200).json(profile);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update student profile
export const updateStudentProfile = async (req, res) => {
  try {
    const updates = req.body;

    const student = await Student.findByIdAndUpdate(
      req.user.id,
      updates,
       { returnDocument: "after" }
    );

    res.status(200).json({
      message: "Profile updated successfully",
      student,
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};