import mongoose from "mongoose";

const moodHistorySchema=new mongoose.Schema({
    textScore:Number,
    voiceScore:Number,
    faceScore:Number,
    finalScore:Number,
    emotion:String,
    date:{
        type:Date,
        default:Date.now,
    },
});


const StudentSchema=new mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true,
    },
    phone:{
        type:String,
        required:true,
    },
    password: {
      type: String,
      required: true,
    },

    // 🎓 Academic Info
    university: {
      type: String,
    },
    rollNumber: {
      type: String,
    },
    className: {
      type: String,
    },
    section: {
      type: String,
    },
    age:Number,
    gender:{
        type:String,
        enum:['Male',"Female","Other"],
    },
    
    ProfileImage:String,
    // 🧠 Mental Health Data
    currentMood: {
      type: String,
      default: "neutral",
    },

    moodScore: {
      type: Number,
      default: 0,
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    
    allSessions:[
      {
        type:mongoose.Schema.Types.ObjectId,
        ref:"Session",
      }
    ],

    // 📊 Mood History
    moodHistory: [moodHistorySchema],

    // 🚨 Emergency Contacts
    parentContact: {
      name: String,
      phone: String,
      email: String,
    },
    mentorContact: {
      name: String,
      phone: String,
      email: String,
    },
    lastActive:{
        type:Date,
        default:Date.now,
    },
},{timestamps:true});


export default mongoose.model("Student",StudentSchema);