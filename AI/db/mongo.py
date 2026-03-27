from pymongo import MongoClient
from bson import ObjectId
import os

client = MongoClient(os.getenv("MONGO_URI"))
db = client["ai_db"]

print("Connected DB:", db.name)
print("Collections:", db.list_collection_names())

def get_student(student_id):
    try:
        print("🔍 Incoming ID:", student_id)

        obj_id = ObjectId(student_id)
        print("✅ Converted ObjectId:", obj_id)

        student = db.students.find_one({"_id": obj_id})

        print("📦 Mongo Result:", student)

        return student
    except Exception as e:
        print("❌ ERROR:", e)
        return None