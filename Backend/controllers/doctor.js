import Doctor from "../models/Doctor.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

// ✅ SIGNUP
export const signup = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      specialization,
      experience,
      licenseNumber,
      consultationFee,
      city,
    } = req.body;

    // 1. Check fields
    if (!name || !email || !phone || !password || !specialization || !licenseNumber) {
      return res.status(400).json({ message: "All required fields must be filled!" });
    }

    // 2. Check existing doctor
    const doctorExist = await Doctor.findOne({ email });
    if (doctorExist) {
      return res.status(400).json({ message: "Doctor already exists!" });
    }

    // 3. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPass = await bcrypt.hash(password, salt);

    // 4. Create doctor
    const doctor = await Doctor.create({
      name,
      email,
      phone,
      password: hashedPass,
      specialization,
      experience,
      licenseNumber,
      consultationFee,
      city,
    });

    console.log("---> Doctor Sign up successful!");

    // 5. Generate token
    const token = generateToken(doctor._id);

    res.status(201).json({
      message: "Doctor sign up successful!",
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
      },
    });

  } catch (error) {
    console.log("Error ->", error.message);
    res.status(500).json({ message: error.message });
  }
};

// ✅ LOGIN
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check fields
    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 2. Find doctor
    const doctor = await Doctor.findOne({ email });
    if (!doctor) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4. Generate token
    const token = generateToken(doctor._id);

    res.status(200).json({
      message: "Login successful",
      token,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone,
        specialization: doctor.specialization,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET DOCTOR PROFILE
export const getDoctorProfile = async (req, res) => {
  try {
    // req.user comes from auth middleware
    const doctor = await Doctor.findById(req.user._id).select("-password");

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json({
      message: "Doctor profile fetched successfully",
      doctor,
    });

  } catch (error) {
    console.log("Error ->", error.message);
    res.status(500).json({ message: error.message });
  }
};


// ✅ UPDATE DOCTOR PROFILE
export const updateDoctorProfile = async (req, res) => {
  try {
    const {
      name,
      phone,
      specialization,
      experience,
      consultationFee,
      city,
      bio,
      qualifications,
      clinicAddress,
    } = req.body;

    const doctor = await Doctor.findById(req.user._id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update fields (only if provided)
    doctor.name = name || doctor.name;
    doctor.phone = phone || doctor.phone;
    doctor.specialization = specialization || doctor.specialization;
    doctor.experience = experience || doctor.experience;
    doctor.consultationFee = consultationFee || doctor.consultationFee;
    doctor.city = city || doctor.city;
    doctor.bio = bio || doctor.bio;
    doctor.qualifications = qualifications || doctor.qualifications;
    doctor.clinicAddress = clinicAddress || doctor.clinicAddress;

    const updatedDoctor = await doctor.save();

    res.status(200).json({
      message: "Doctor profile updated successfully",
      doctor: {
        id: updatedDoctor._id,
        name: updatedDoctor.name,
        email: updatedDoctor.email,
        phone: updatedDoctor.phone,
        specialization: updatedDoctor.specialization,
        experience: updatedDoctor.experience,
        consultationFee: updatedDoctor.consultationFee,
        city: updatedDoctor.city,
        bio: updatedDoctor.bio,
        qualifications: updatedDoctor.qualifications,
        clinicAddress: updatedDoctor.clinicAddress,
      },
    });

  } catch (error) {
    console.log("Error ->", error.message);
    res.status(500).json({ message: error.message });
  }
};