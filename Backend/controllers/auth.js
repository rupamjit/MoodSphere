import Student from "../models/Student.js";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/generateToken.js";

// sign up
export const signup=async(req,res)=>{
    try{
        const {email , name , phone, password}=req.body;

        if(!email || !name || !phone || !password){
            return res.status(400).json({message:"All fields are required!"});
        }
        
        const userExist=await Student.findOne({email});
        if(userExist) return res.status(400).json({message:"User already exists!"});

        const salt=await bcrypt.genSalt(10);
        const hashedPass=await bcrypt.hash(password,salt);
        const user=await Student.create({
            name,
            email,
            phone,
            password:hashedPass,
        });

        console.log("---> Sign up successful!");
        const token=generateToken(user._id);
        res.status(201).json({
            message:"sign up successful!",
            token,
            user:{
                id:user._id,
                name:user.name,
                email:user.email,
                phone:user.phone,
            },
        });
    }catch(error){
        console.log("Error ->", error.message);
        res.status(500).json({message:error.message})
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

    // 2. Find user
    const user = await Student.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 3. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // 4. Generate token
    const token = generateToken(user._id);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};