/**
 * Parses and evaluates a condition string against a choices object
 *
 * @param condition - Condition string like "user_choice == 'Yes'"
 * @param choices - Object containing choice values
 * @returns boolean result of the condition
 */
export const parseCondition = (condition: string, choices: Record<string, any>): boolean => {
    try {
        // Extract variable name and expected value
        const parts = condition.split(/([=!<>]+)/)

        if (parts.length < 3) {
            console.error("Invalid condition format:", condition)
            return false
        }

        const variableName = parts[0].trim()
        const operator = parts[1].trim()
        let expectedValue = parts[2].trim()

        // Remove quotes if present
        if (
            (expectedValue.startsWith("'") && expectedValue.endsWith("'")) ||
            (expectedValue.startsWith('"') && expectedValue.endsWith('"'))
        ) {
            expectedValue = expectedValue.substring(1, expectedValue.length - 1)
        }

        // Get actual value from choices
        const actualValue = choices[variableName]

        // Evaluate based on operator
        switch (operator) {
            case "==":
                return actualValue == expectedValue
            case "===":
                return actualValue === expectedValue
            case "!=":
                return actualValue != expectedValue
            case "!==":
                return actualValue !== expectedValue
            case ">":
                return actualValue > expectedValue
            case "<":
                return actualValue < expectedValue
            case ">=":
                return actualValue >= expectedValue
            case "<=":
                return actualValue <= expectedValue
            default:
                console.error("Unsupported operator:", operator)
                return false
        }
    } catch (error) {
        console.error("Error parsing condition:", error)
        return false
    }
}
