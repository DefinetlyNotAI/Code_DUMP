import spacy

# Load the custom trained SpaCy model for PII detection
nlp = spacy.load("en_core_web_trf")  # A transformer-based model


def scan_text(text):
    doc = nlp(text)
    pii_entities = []
    for ent in doc.ents:
        if ent.label_ in ["PERSON", "DATE", "GPE", "ORG", "MONEY", "PRODUCT", "CREDIT_CARD", "OTHER_SENSITIVE_INFO"]:
            pii_entities.append({'word': ent.text, 'label': ent.label_})
    return pii_entities


if __name__ == "__main__":
    sample_texts = [
        "My credit card number is 1234-5678-9012-3456, and my password is secret123!",
        "I like humans...",
        "The document contains John Doe's social security number: 123-45-6789."
    ]

    for text in sample_texts:
        print(scan_text(text))
