
import json

try:
    # Try reading as utf-16 since powershell sometimes outputs utf-16
    try:
        with open('lint-report.json', 'r', encoding='utf-16') as f:
            report = json.load(f)
    except UnicodeError:
        # Fallback to utf-8 if it's not utf-16
        with open('lint-report.json', 'r', encoding='utf-8') as f:
            report = json.load(f)

    error_counts = {}
    file_errors = {}

    if isinstance(report, list):
        for file_entry in report:
            file_path = file_entry.get('filePath', '')
            messages = file_entry.get('messages', [])
            
            if not messages:
                continue
                
            file_errors[file_path] = len(messages)
            
            for msg in messages:
                rule_id = msg.get('ruleId', 'unknown')
                error_counts[rule_id] = error_counts.get(rule_id, 0) + 1

        print("--- Top 10 Error Types ---")
        sorted_errors = sorted(error_counts.items(), key=lambda x: x[1], reverse=True)
        for rule, count in sorted_errors[:10]:
            print(f"{rule}: {count}")

        print("\n--- Top 10 Files by Error Count ---")
        sorted_files = sorted(file_errors.items(), key=lambda x: x[1], reverse=True)
        for file_path, count in sorted_files[:10]:
            # Simplify path for readability
            short_path = file_path.split('Akapoolco')[-1]
            print(f"{short_path}: {count}")
    else:
        print("Report is not a list. Format might be wrong.")

except Exception as e:
    print(f"Error analyzing report: {e}")
