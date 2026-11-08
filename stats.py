import math

def calculate_stats(data):
    """
    محاسبه شاخص‌های آماری یک آرایه عددی
    """
    if not data:
        return None
    
    count = len(data)
    mean = sum(data) / count
    min_val = min(data)
    max_val = max(data)
    
    # محاسبه واریانس نمونه (Sample Variance)
    if count > 1:
        variance_sum = sum((x - mean) ** 2 for x in data)
        variance = variance_sum / (count - 1)
    else:
        variance = 0.0
        
    std_dev = math.sqrt(variance)
    
    return {
        "count": count,
        "mean": mean,
        "variance": variance,
        "std_dev": std_dev,
        "min": min_val,
        "max": max_val
    }

def print_stats(stats):
    """
    چاپ گزارش آماری به صورت فرمت‌شده و تمیز
    """
    if not stats:
        return

    print("\n=========================================")
    print("         DATASET STATISTICAL REPORT      ")
    print("=========================================")
    print(f" Sample Count (N) : {stats['count']}")
    print(f" Mean             : {stats['mean']:.4f}")
    print(f" Variance         : {stats['variance']:.4f}")
    print(f" Std Deviation    : {stats['std_dev']:.4f}")
    print(f" Minimum Value    : {stats['min']:.4f}")
    print(f" Maximum Value    : {stats['max']:.4f}")
    print("=========================================")

if __name__ == "__main__":
    # نمونه‌ای از داده‌های ورودی
    dataset = [12.5, 18.2, 22.4, 15.1, 19.8, 25.0, 17.6]
    
    stats = calculate_stats(dataset)
    if stats:
        print_stats(stats)
    else:
        print("Error: Dataset is empty.")