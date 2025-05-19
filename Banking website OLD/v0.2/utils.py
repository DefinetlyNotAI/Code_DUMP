import uuid


def generate_ticket():
    return str(uuid.uuid4())


def rule_enabled(rule_name, settings):
    return settings.rules.get(rule_name, False)
