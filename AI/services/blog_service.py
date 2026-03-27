from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from config import GEMINI_API_KEY
import json


# Initialize model once
BlogModel = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0.7,
    google_api_key=GEMINI_API_KEY
)

system_prompt = """
You are an AI Counselor Story Generator.

🎯 ROLE:
- Convert student counseling data into a motivational anonymous story
- Help other students learn and feel inspired
- Highlight emotional growth and improvement journey

🚨 RULES:
- No personal details
- Anonymous only

📖 STRUCTURE:
1. Struggle
2. Challenges
3. Small wins
4. Growth
5. Lessons + ending

🎯 OUTPUT (JSON ONLY):
{{
  "title": "Short inspiring title",
  "story": "Full anonymous story...",
  "key_learnings": [
    "Lesson 1",
    "Lesson 2",
    "Lesson 3"
  ],
  "final_message": "Motivational ending line",
  "improvement": true,
  "action": "create_blog"
}}
"""

prompt = ChatPromptTemplate.from_messages([
    ("system", system_prompt),
    ("human", "Student Summary:\n{student_summary}")
])


def generate_blog(student_summary):
    try:
        chain = prompt | BlogModel

        response = chain.invoke({
            "student_summary": student_summary
        })

        # Convert string → JSON
        content = response.content

        try:
            blog_json = json.loads(content)
        except:
            # fallback if model returns text instead of pure JSON
            blog_json = {
                "raw_output": content,
                "action": "error"
            }

        return blog_json

    except Exception as e:
        return {
            "error": str(e),
            "action": "error"
        }