import sys
from transformers import pipeline


class ProfanityChecker:
    def __init__(self, trust_default_score: bool = True):
        self.trust_default_score = trust_default_score
        self.toxicity_classifier = pipeline("text-classification", model="unitary/toxic-bert")

    def check_profanity(self, text: str, advanced_return: bool = False) -> bool | dict:
        toxicity_result = self.toxicity_classifier(text)[0]
        toxicity_score = toxicity_result['score']
        toxicity_label = toxicity_result['label'].lower()
        toxicity_verdict = "Toxic" if toxicity_label == "toxic" else "Non-Toxic"
        toxic = toxicity_label == "toxic"

        if self.trust_default_score:
            trust_score = 0.5
        else:
            trust_score = self.calculate_trust_score(text)

        trust_label = "High" if trust_score > 0.7 else "Medium" if trust_score > 0.4 else "Low"
        trust_verdict = "Trustworthy" if trust_score > 0.4 else "Untrustworthy"

        if advanced_return:
            return {
                "toxicity_score": toxicity_score,
                "toxicity_label": toxicity_label,
                "toxicity_verdict": toxicity_verdict,
                "trust_score": trust_score,
                "trust_label": trust_label,
                "trust_verdict": trust_verdict,
                "toxic": toxic
            }
        return toxic

    @staticmethod
    def calculate_trust_score(text: str):
        sentiment_analysis = pipeline("sentiment-analysis")
        result = sentiment_analysis(text)[0]
        score = result['score']
        label = result['label']

        if label == "POSITIVE":
            trust_score = 0.75 + score / 4
        elif label == "NEGATIVE":
            trust_score = 0.25 - score / 4
        else:
            trust_score = 0.5

        return max(0, min(1, trust_score))


def main():
    if len(sys.argv) > 1:
        text = " ".join(sys.argv[1:])
    else:
        text = input("Please enter the text to check: ")

    trust_default_score = input("Use default trust score? (yes/no): ").strip().lower() == "yes"
    result = ProfanityChecker(trust_default_score=trust_default_score).check_profanity(text=text, advanced_return=True)

    print("Toxicity Score:", result["toxicity_score"])
    print("Toxicity Label:", result["toxicity_label"])
    print("Toxicity Verdict:", result["toxicity_verdict"])
    print("Trust Score:", result["trust_score"])
    print("Trust Label:", result["trust_label"])
    print("Trust Verdict:", result["trust_verdict"])
    print("Toxic:", result["toxic"])


if __name__ == "__main__":
    main()
