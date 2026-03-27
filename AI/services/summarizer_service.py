from transformers import pipeline

# Load once (important for performance)
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")


def generate_final_summary(sessions):
    summaries = []

    for session in sessions:
        full_text = session["input"] + " " + session["response"]

        summary = summarizer(
            full_text,
            max_length=60,
            min_length=20,
            do_sample=False
        )[0]['summary_text']

        summaries.append(summary)

    combined_text = " ".join(summaries)

    final_summary = summarizer(
        combined_text,
        max_length=120,
        min_length=40,
        do_sample=False
    )[0]['summary_text']

    return final_summary