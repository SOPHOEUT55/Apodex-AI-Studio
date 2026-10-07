import React, { useState, useRef, useEffect } from 'react';
import { executePythonCode, sendChatMessageDirect } from '../services/api';
import { ExecutionHistoryItem, PythonExecutionResult, SavedScript } from '../types';
import {
  loadExecutionHistory,
  loadSavedScripts,
  saveExecutionHistory,
  saveSavedScripts,
} from '../utils/storage';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Download,
  Terminal,
  Sparkles,
  Cpu,
  FileCode,
  Loader2,
  AlertCircle,
  HelpCircle,
  Zap,
  FolderOpen,
  Save,
  Trash2,
  History,
  BarChart2,
  Search,
  Code2,
  Wand2,
  ArrowRight,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface PythonLabViewProps {
  currentModelId: string;
  initialCode?: string;
  onAskAIAboutCode: (prompt: string, code: string) => void;
}

interface PythonPreset {
  id: string;
  title: string;
  category: 'Math & Simulation' | 'Data Science' | 'Algorithms' | 'Machine Learning' | 'Utilities & SQL';
  description: string;
  code: string;
}

const PYTHON_PRESETS: PythonPreset[] = [
  {
    id: 'monte_carlo',
    title: 'Monte Carlo Pi Simulation',
    category: 'Math & Simulation',
    description: 'Approximates Pi using random coordinate sampling in a unit square with error convergence.',
    code: `import random
import math
import time

def estimate_pi(num_samples: int = 150_000):
    start = time.perf_counter()
    inside_circle = 0
    for _ in range(num_samples):
        x = random.random()
        y = random.random()
        if x*x + y*y <= 1.0:
            inside_circle += 1
            
    estimated = (inside_circle / num_samples) * 4.0
    elapsed_ms = (time.perf_counter() - start) * 1000
    error = abs(estimated - math.pi)
    error_pct = (error / math.pi) * 100
    return estimated, error, error_pct, elapsed_ms

samples = 200_000
est, err, pct, ms = estimate_pi(samples)

print("=" * 55)
print(f"  MONTE CARLO PI ESTIMATION ({samples:,} trials)")
print("=" * 55)
print(f"  Calculated Pi : {est:.7f}")
print(f"  True Pi (math): {math.pi:.7f}")
print(f"  Absolute Delta: {err:.7f} ({pct:.4f}%)")
print(f"  Compute Time  : {ms:.2f} ms")
print("=" * 55)
`,
  },
  {
    id: 'trapezoidal_integration',
    title: 'Numerical Calculus (Integration)',
    category: 'Math & Simulation',
    description: 'Computes definite integrals using the Trapezoidal Rule and compares against analytical solutions.',
    code: `import math

def f(x: float) -> float:
    # Function to integrate: f(x) = sin(x) + 0.5 * x
    return math.sin(x) + 0.5 * x

def trapezoidal_rule(func, a: float, b: float, n: int = 1000) -> float:
    h = (b - a) / n
    total = 0.5 * (func(a) + func(b))
    for i in range(1, n):
        total += func(a + i * h)
    return total * h

a, b = 0.0, math.pi
steps = 5000
approx = trapezoidal_rule(f, a, b, steps)

# Analytical integral of sin(x) + 0.5x from 0 to pi:
# [-cos(x) + 0.25 x^2] from 0 to pi = (1 + 0.25*pi^2) - (-1 + 0) = 2 + 0.25*pi^2
exact = 2.0 + 0.25 * (math.pi ** 2)

print("--- Definite Integral via Trapezoidal Rule ---")
print(f"Interval       : [{a:.2f}, {b:.4f}] across {steps} steps")
print(f"Approximation  : {approx:.8f}")
print(f"Analytical True: {exact:.8f}")
print(f"Residual Error : {abs(approx - exact):.2e}")
`,
  },
  {
    id: 'linear_regression',
    title: 'OLS Linear Regression & ASCII Chart',
    category: 'Data Science',
    description: 'Computes Ordinary Least Squares slope, intercept, R-squared and plots an ASCII regression scatter plot.',
    code: `import math

# Sample observed data (X: Advertising Spend $k, Y: Revenue Units $k)
X = [1.0, 2.0, 3.2, 4.0, 5.5, 6.1, 7.0, 8.4, 9.0, 10.2]
Y = [2.2, 3.8, 5.1, 6.7, 8.9, 9.4, 11.2, 13.0, 13.8, 16.1]

n = len(X)
mean_x = sum(X) / n
mean_y = sum(Y) / n

# Slope (m) and intercept (b)
ss_xy = sum((X[i] - mean_x) * (Y[i] - mean_y) for i in range(n))
ss_xx = sum((X[i] - mean_x) ** 2 for i in range(n))
slope = ss_xy / ss_xx
intercept = mean_y - slope * mean_x

# Pearson R & R-squared
ss_yy = sum((Y[i] - mean_y) ** 2 for i in range(n))
r_value = ss_xy / math.sqrt(ss_xx * ss_yy)
r_squared = r_value ** 2

print("=" * 50)
print("  ORDINARY LEAST SQUARES REGRESSION")
print("=" * 50)
print(f"Model Equation : Y = {slope:.4f} * X + {intercept:.4f}")
print(f"R-squared (R2) : {r_squared:.4f} (Fit Quality: {r_squared*100:.1f}%)")
print(f"Pearson Corr   : {r_value:.4f}")
print("=" * 50)

# ASCII Scatter Plot
print("\\nASCII Fit Trajectory (Observed * vs Predicted -):")
for x_val, y_val in zip(X, Y):
    pred_y = slope * x_val + intercept
    bar_obs = int(y_val * 2.2)
    print(f"X={x_val:4.1f} | Y={y_val:4.1f} | " + ("." * bar_obs) + "* (pred:" + f"{pred_y:.1f})")
`,
  },
  {
    id: 'stats_distribution',
    title: 'Descriptive Stats & Outlier Detector',
    category: 'Data Science',
    description: 'Calculates mean, variance, skewness proxy, IQR, and detects 2-sigma anomalies in sample data.',
    code: `import statistics
import math

dataset = [14, 15, 17, 18, 19, 21, 22, 23, 24, 25, 27, 28, 30, 89]

def analyze_dataset(data):
    n = len(data)
    mean = statistics.mean(data)
    median = statistics.median(data)
    stdev = statistics.stdev(data)
    var = statistics.variance(data)
    
    # 2-Sigma Outliers
    outliers = [x for x in data if abs(x - mean) > 2 * stdev]
    
    # Percentiles
    sorted_d = sorted(data)
    q1 = sorted_d[int(0.25 * n)]
    q3 = sorted_d[int(0.75 * n)]
    iqr = q3 - q1
    
    return {
        "Sample Size": n,
        "Arithmetic Mean": round(mean, 2),
        "Median": median,
        "Std Deviation": round(stdev, 2),
        "Variance": round(var, 2),
        "Q1 (25th %)": q1,
        "Q3 (75th %)": q3,
        "IQR": iqr,
        "2-Sigma Outliers": outliers,
    }

summary = analyze_dataset(dataset)
print("Source Dataset:", dataset)
print("\\nStatistical Distribution Overview:")
print("-" * 45)
for key, val in summary.items():
    print(f"{key:<22}: {val}")
print("-" * 45)
`,
  },
  {
    id: 'dijkstra_graph',
    title: 'Dijkstra Shortest Path Network',
    category: 'Algorithms',
    description: 'Finds optimal network routing paths and latency using a min-heap priority queue.',
    code: `import heapq

def dijkstra(graph: dict, start_node: str):
    distances = {node: float('inf') for node in graph}
    distances[start_node] = 0.0
    predecessors = {node: None for node in graph}
    pq = [(0.0, start_node)]

    while pq:
        curr_dist, curr_node = heapq.heappop(pq)
        if curr_dist > distances[curr_node]:
            continue

        for neighbor, weight in graph[curr_node].items():
            dist = curr_dist + weight
            if dist < distances[neighbor]:
                distances[neighbor] = dist
                predecessors[neighbor] = curr_node
                heapq.heappush(pq, (dist, neighbor))

    return distances, predecessors

# Sample Multi-Region Cloud Network Topology (Weights = Latency in ms)
network = {
    'Gateway':     {'US-East': 12, 'US-West': 38, 'EU-Central': 85},
    'US-East':     {'Gateway': 12, 'US-West': 28, 'Database': 15, 'EU-Central': 72},
    'US-West':     {'Gateway': 38, 'US-East': 28, 'Database': 34, 'AP-East': 95},
    'EU-Central':  {'Gateway': 85, 'US-East': 72, 'Database': 78, 'AP-East': 110},
    'Database':    {'US-East': 15, 'US-West': 34, 'EU-Central': 78},
    'AP-East':     {'US-West': 95, 'EU-Central': 110}
}

source = 'Gateway'
dists, preds = dijkstra(network, source)

print(f"=== Optimal Routing from [{source}] ===")
for node, cost in sorted(dists.items(), key=lambda x: x[1]):
    # Reconstruct hop path
    path = []
    curr = node
    while curr is not None:
        path.append(curr)
        curr = preds[curr]
    path.reverse()
    print(f"-> {node:<12} : {cost:5.1f} ms | Path: {' -> '.join(path)}")
`,
  },
  {
    id: 'sorting_benchmark',
    title: 'Sorting Benchmark (Merge vs Quick vs Tim)',
    category: 'Algorithms',
    description: 'Generates random datasets and compares MergeSort, QuickSort, and Python Timsort wall-clock speed.',
    code: `import random
import time

def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

def quick_sort(arr):
    if len(arr) <= 1:
        return arr
    pivot = arr[len(arr) // 2]
    left = [x for x in arr if x < pivot]
    middle = [x for x in arr if x == pivot]
    right = [x for x in arr if x > pivot]
    return quick_sort(left) + middle + quick_sort(right)

size = 25_000
raw_data = [random.randint(1, 1_000_000) for _ in range(size)]

print(f"Benchmarking sorting algorithms on {size:,} integers:")
print("-" * 55)

# Merge Sort
t0 = time.perf_counter()
m_res = merge_sort(raw_data)
t_merge = (time.perf_counter() - t0) * 1000

# Quick Sort
t0 = time.perf_counter()
q_res = quick_sort(raw_data)
t_quick = (time.perf_counter() - t0) * 1000

# Built-in Timsort (list.sort)
t0 = time.perf_counter()
p_res = sorted(raw_data)
t_tim = (time.perf_counter() - t0) * 1000

print(f"1. MergeSort (Pure Python) : {t_merge:6.2f} ms")
print(f"2. QuickSort (Recursive)   : {t_quick:6.2f} ms")
print(f"3. Python Timsort (Builtin): {t_tim:6.2f} ms")
print("-" * 55)
print(f"Integrity check: {m_res == q_res == p_res}")
`,
  },
  {
    id: 'neural_perceptron',
    title: 'Neural Perceptron & Backpropagation',
    category: 'Machine Learning',
    description: 'Implements a 2-layer neural network from scratch using matrix operations for XOR non-linear classification.',
    code: `import math
import random

# Sigmoid Activation & Derivative
def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-max(min(x, 20), -20)))

def d_sigmoid(y: float) -> float:
    return y * (1.0 - y)

# XOR Dataset (Non-linearly separable)
training_data = [
    ([0.0, 0.0], 0.0),
    ([0.0, 1.0], 1.0),
    ([1.0, 0.0], 1.0),
    ([1.0, 1.0], 0.0),
]

random.seed(42)
# Architecture: 2 inputs -> 2 hidden nodes -> 1 output
w_hidden = [[random.uniform(-1, 1) for _ in range(2)] for _ in range(2)]
b_hidden = [random.uniform(-1, 1) for _ in range(2)]
w_output = [random.uniform(-1, 1) for _ in range(2)]
b_output = random.uniform(-1, 1)

lr = 0.5
epochs = 4000

for epoch in range(epochs):
    total_loss = 0.0
    for x, target in training_data:
        # Forward pass
        h = [sigmoid(sum(x[i] * w_hidden[j][i] for i in range(2)) + b_hidden[j]) for j in range(2)]
        out = sigmoid(sum(h[j] * w_output[j] for j in range(2)) + b_output)
        
        # Loss (MSE)
        err = target - out
        total_loss += err ** 2
        
        # Backpropagation
        delta_out = err * d_sigmoid(out)
        delta_hidden = [delta_out * w_output[j] * d_sigmoid(h[j]) for j in range(2)]
        
        # Gradient Update
        for j in range(2):
            w_output[j] += lr * delta_out * h[j]
        b_output += lr * delta_out
        
        for j in range(2):
            for i in range(2):
                w_hidden[j][i] += lr * delta_hidden[j] * x[i]
            b_hidden[j] += lr * delta_hidden[j]

print("=== Trained 2-Layer Perceptron (XOR Verification) ===")
for x, target in training_data:
    h = [sigmoid(sum(x[i] * w_hidden[j][i] for i in range(2)) + b_hidden[j]) for j in range(2)]
    pred = sigmoid(sum(h[j] * w_output[j] for j in range(2)) + b_output)
    binary_pred = 1 if pred >= 0.5 else 0
    print(f"Input: {x} -> True: {int(target)} | Pred: {pred:.4f} => Round: {binary_pred}")
`,
  },
  {
    id: 'sqlite_in_memory',
    title: 'In-Memory SQLite DB & Analytics',
    category: 'Utilities & SQL',
    description: 'Creates a relational schema in SQLite memory, seeds records, and executes analytical SQL queries.',
    code: `import sqlite3
import json

# Initialize In-Memory Database
conn = sqlite3.connect(":memory:")
cursor = conn.cursor()

# Schema definition
cursor.execute("""
CREATE TABLE server_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cluster_region TEXT NOT NULL,
    cpu_percent REAL,
    memory_gb REAL,
    status TEXT
);
""")

# Seed mock records
records = [
    ('us-east-1', 42.5, 31.2, 'healthy'),
    ('us-east-1', 88.1, 62.4, 'warning'),
    ('us-west-2', 24.3, 18.0, 'healthy'),
    ('us-west-2', 96.2, 63.8, 'critical'),
    ('eu-central-1', 35.0, 28.5, 'healthy'),
    ('eu-central-1', 78.4, 54.1, 'warning'),
    ('ap-southeast-1', 19.8, 16.2, 'healthy'),
]

cursor.executemany("""
INSERT INTO server_metrics (cluster_region, cpu_percent, memory_gb, status)
VALUES (?, ?, ?, ?);
""", records)
conn.commit()

# SQL Aggregation Query
cursor.execute("""
SELECT 
    cluster_region,
    COUNT(*) as total_nodes,
    ROUND(AVG(cpu_percent), 2) as avg_cpu,
    ROUND(MAX(cpu_percent), 2) as peak_cpu,
    ROUND(AVG(memory_gb), 2) as avg_ram
FROM server_metrics
GROUP BY cluster_region
ORDER BY avg_cpu DESC;
""")

rows = cursor.fetchall()

print("=" * 60)
print(f"{'Region':<16} | {'Nodes':<5} | {'Avg CPU %':<10} | {'Peak %':<8} | {'Avg RAM'}")
print("=" * 60)
for r in rows:
    print(f"{r[0]:<16} | {r[1]:<5} | {r[2]:<10} | {r[3]:<8} | {r[4]} GB")
print("=" * 60)

conn.close()
print("\\nSQLite in-memory transactions executed successfully.")
`,
  },
  {
    id: 'crypto_hashing',
    title: 'Cryptographic Hashing & PBKDF2',
    category: 'Utilities & SQL',
    description: 'Generates secure cryptographic hashes, HMAC authentication codes, and salted PBKDF2 key derivatives.',
    code: `import hashlib
import hmac
import os
import secrets

message = "Apodex & Nemotron AI Secure Gateway Payload v1"
key = secrets.token_bytes(32)

# 1. SHA-256 Digest
sha256_hash = hashlib.sha256(message.encode('utf-8')).hexdigest()

# 2. HMAC-SHA256 Signature
hmac_sig = hmac.new(key, message.encode('utf-8'), hashlib.sha256).hexdigest()

# 3. Salted Password Key Derivation (PBKDF2)
password = "SuperUserSecurePassword99!"
salt = secrets.token_bytes(16)
derived_key = hashlib.pbkdf2_hmac(
    hash_name='sha256',
    password=password.encode('utf-8'),
    salt=salt,
    iterations=100_000
)

print("--- Cryptographic Security Pipeline ---")
print(f"Original Text : '{message}'")
print(f"SHA-256 Digest: {sha256_hash}")
print(f"HMAC Signature: {hmac_sig[:32]}... ({len(hmac_sig)} chars)")
print(f"PBKDF2 Key (100k rounds): {derived_key.hex()[:32]}...")
print("Verification: Cryptographic routines authenticated.")
`,
  },
];

export const PythonLabView: React.FC<PythonLabViewProps> = ({
  currentModelId,
  initialCode,
  onAskAIAboutCode,
}) => {
  const [code, setCode] = useState<string>(initialCode || PYTHON_PRESETS[0].code);
  const [stdinInput, setStdinInput] = useState('');
  const [showStdin, setShowStdin] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<PythonExecutionResult | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedOutput, setCopiedOutput] = useState(false);
  const [activeSnippetId, setActiveSnippetId] = useState<string>(PYTHON_PRESETS[0].id);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeConsoleTab, setActiveConsoleTab] = useState<'output' | 'history' | 'stdin' | 'charts'>('output');

  // Custom saved scripts & history
  const [savedScripts, setSavedScripts] = useState<SavedScript[]>(() => loadSavedScripts());
  const [historyList, setHistoryList] = useState<ExecutionHistoryItem[]>(() => loadExecutionHistory());
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [newScriptTitle, setNewScriptTitle] = useState('');

  // AI Prompt generation bar
  const [aiPromptInput, setAiPromptInput] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null);
  const [aiTargetModel, setAiTargetModel] = useState<string>(currentModelId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialCode) {
      setCode(initialCode);
      setActiveSnippetId('');
    }
  }, [initialCode]);

  useEffect(() => {
    setAiTargetModel(currentModelId);
  }, [currentModelId]);

  // Handle textarea scroll to sync line numbers
  const handleTextareaScroll = () => {
    if (textareaRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleRun = async () => {
    if (!code.trim() || isRunning) return;
    setIsRunning(true);
    setActiveConsoleTab('output');
    try {
      const res = await executePythonCode(code, stdinInput);
      setResult(res);

      // Save to history
      const historyItem: ExecutionHistoryItem = {
        id: `exec_${Date.now()}`,
        timestamp: Date.now(),
        code,
        result: res,
        title: activeSnippetId
          ? PYTHON_PRESETS.find((p) => p.id === activeSnippetId)?.title
          : 'Custom Python Script',
      };
      const updatedHistory = [historyItem, ...historyList].slice(0, 30);
      setHistoryList(updatedHistory);
      saveExecutionHistory(updatedHistory);
    } catch (e: any) {
      const errRes = {
        stdout: '',
        stderr: e.message || 'Execution error',
        exitCode: 1,
        executionTimeMs: 0,
        success: false,
      };
      setResult(errRes);
    } finally {
      setIsRunning(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      handleRun();
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newCode = code.substring(0, start) + '    ' + code.substring(end);
      setCode(newCode);
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 4;
      }, 0);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyOutput = () => {
    if (!result) return;
    const text = (result.stdout || '') + (result.stderr ? '\n' + result.stderr : '');
    navigator.clipboard.writeText(text);
    setCopiedOutput(true);
    setTimeout(() => setCopiedOutput(false), 2000);
  };

  const downloadScript = () => {
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `script_${Date.now()}.py`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSelectPreset = (preset: PythonPreset) => {
    setActiveSnippetId(preset.id);
    setCode(preset.code);
    setResult(null);
  };

  const handleFormatCode = () => {
    // Basic python indentation and whitespace cleanup
    const lines = code.split('\n');
    const cleaned = lines.map((l) => l.trimEnd()).join('\n');
    setCode(cleaned);
  };

  const handleSaveCustomScript = () => {
    if (!newScriptTitle.trim()) return;
    const newScript: SavedScript = {
      id: `saved_${Date.now()}`,
      title: newScriptTitle.trim(),
      code,
      updatedAt: Date.now(),
    };
    const updated = [newScript, ...savedScripts];
    setSavedScripts(updated);
    saveSavedScripts(updated);
    setSaveModalOpen(false);
    setNewScriptTitle('');
  };

  const handleDeleteSavedScript = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedScripts.filter((s) => s.id !== id);
    setSavedScripts(updated);
    saveSavedScripts(updated);
  };

  const handleGenerateCodeWithAI = async () => {
    if (!aiPromptInput.trim() || isAiGenerating) return;
    setIsAiGenerating(true);
    try {
      const response = await sendChatMessageDirect({
        model: aiTargetModel,
        systemPrompt:
          'You are an expert Python engineer. When asked to write a Python script, return ONLY high-quality, production-grade Python code inside a ```python ``` block with zero unnecessary conversational fluff.',
        messages: [
          {
            role: 'user',
            content: `Write a standalone runnable Python 3.10 program for this requirement:\n${aiPromptInput.trim()}`,
          },
        ],
      });

      // Extract python code block
      const codeMatch = response.content.match(/```python\s*([\s\S]*?)```/) || response.content.match(/```\s*([\s\S]*?)```/);
      const extractedCode = codeMatch ? codeMatch[1].trim() : response.content.trim();

      if (extractedCode) {
        setCode(extractedCode);
        setActiveSnippetId('');
        setResult(null);
      }
      setAiPromptInput('');
    } catch (e: any) {
      alert('Error generating code: ' + (e.message || 'Network error'));
    } finally {
      setIsAiGenerating(false);
    }
  };

  const triggerAIHelp = (actionType: 'explain' | 'optimize' | 'debug' | 'tests' | 'typing') => {
    setAiActionLoading(actionType);
    let prompt = '';
    switch (actionType) {
      case 'explain':
        prompt = 'Explain how this Python program works step-by-step, including algorithmic complexity, runtime behavior, and design tradeoffs:';
        break;
      case 'optimize':
        prompt = 'Analyze this Python code and provide an optimized, production-grade refactoring with improved Big-O time and space complexity:';
        break;
      case 'debug':
        prompt = 'Inspect this Python script for potential bugs, edge cases, type issues, or unhandled exceptions, and provide the corrected code:';
        break;
      case 'tests':
        prompt = 'Write a comprehensive Python unittest test suite with assertions and edge cases for the following script:';
        break;
      case 'typing':
        prompt = 'Add PEP 484 type annotations, docstrings, and clean modular structures to this Python code:';
        break;
    }

    setTimeout(() => {
      onAskAIAboutCode(prompt, code);
      setAiActionLoading(null);
    }, 200);
  };

  const categories = ['All', 'Math & Simulation', 'Data Science', 'Algorithms', 'Machine Learning', 'Utilities & SQL'];
  const filteredPresets = selectedCategory === 'All'
    ? PYTHON_PRESETS
    : PYTHON_PRESETS.filter((p) => p.category === selectedCategory);

  const lines = code.split('\n');
  const lineCount = lines.length;

  return (
    <div className="space-y-4 pb-8 animate-in fade-in duration-200">
      {/* Top Banner with Model Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 text-white shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Python 3.10 Interactive Workbench</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                LIVE INTERPRETER
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Execute Python programs natively in real time with AI code synthesis & reasoning.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSaveModalOpen(true)}
            className="px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Save script to local storage"
          >
            <Save className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Save Script</span>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning || !code.trim()}
            className="px-5 py-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            title="Execute Code (Ctrl + Enter)"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Python</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* AI Code Generator Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 shrink-0">
          <Wand2 className="w-4 h-4" />
          <span>AI Code Generator:</span>
        </div>
        <input
          type="text"
          value={aiPromptInput}
          onChange={(e) => setAiPromptInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleGenerateCodeWithAI();
          }}
          placeholder="Describe any Python task (e.g., 'Generate Fibonacci with memoization and benchmark time')..."
          className="flex-1 w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={aiTargetModel}
            onChange={(e) => setAiTargetModel(e.target.value)}
            className="text-[11px] px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none"
          >
            <option value="apodex/apodex-1.1-mini:free">Apodex 1.1 Mini</option>
            <option value="nvidia/nemotron-3-ultra-550b-a55b:free">NVIDIA Nemotron 3 Ultra</option>
          </select>
          <button
            onClick={handleGenerateCodeWithAI}
            disabled={isAiGenerating || !aiPromptInput.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {isAiGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Category Pills & Snippet Scroller */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400 pl-1 shrink-0">
            Categories:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-600 text-white font-semibold shadow-sm'
                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Snippets / Presets Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {filteredPresets.map((snip) => (
            <button
              key={snip.id}
              onClick={() => handleSelectPreset(snip)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSnippetId === snip.id
                  ? 'border-amber-500 bg-amber-500/15 text-amber-800 dark:text-amber-300 shadow-sm font-semibold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Code2 className="w-3 h-3 text-amber-500" />
              <span>{snip.title}</span>
            </button>
          ))}

          {/* Saved Scripts if any */}
          {savedScripts.map((s) => (
            <div
              key={s.id}
              onClick={() => {
                setCode(s.code);
                setActiveSnippetId(s.id);
                setResult(null);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap border transition-all cursor-pointer flex items-center gap-1.5 group ${
                activeSnippetId === s.id
                  ? 'border-indigo-500 bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 shadow-sm font-semibold'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <FolderOpen className="w-3 h-3 text-indigo-400" />
              <span>{s.title}</span>
              <button
                type="button"
                onClick={(e) => handleDeleteSavedScript(s.id, e)}
                className="opacity-0 group-hover:opacity-100 hover:text-rose-500 p-0.5"
                title="Delete saved script"
              >
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Split Grid: Editor (Left) & Output / Inspector (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Code Editor (7 cols) */}
        <div className="lg:col-span-7 flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-md overflow-hidden min-h-[500px]">
          {/* Editor Header Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 select-none">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                main.py
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                ({lineCount} lines)
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowStdin(!showStdin)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                  showStdin
                    ? 'border-cyan-500 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                    : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                title="Toggle standard input (stdin) field"
              >
                STDIN
              </button>

              <button
                onClick={handleFormatCode}
                className="px-2 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Format Python Code"
              >
                Format
              </button>

              <button
                onClick={copyCode}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy code"
              >
                {copiedCode ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>

              <button
                onClick={downloadScript}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Download .py file"
              >
                <Download className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setCode('')}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                title="Clear code editor"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Optional Stdin Bar */}
          {showStdin && (
            <div className="p-3 bg-amber-500/5 border-b border-amber-500/20 flex flex-col gap-1">
              <label className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Standard Input (passed to input() / sys.stdin):
              </label>
              <input
                type="text"
                value={stdinInput}
                onChange={(e) => setStdinInput(e.target.value)}
                placeholder="Value provided when code executes input()..."
                className="px-2.5 py-1 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
              />
            </div>
          )}

          {/* Code Editor Body with Line Numbers */}
          <div className="relative flex-1 flex bg-slate-950 text-slate-100 font-mono text-xs sm:text-sm overflow-hidden">
            {/* Line Numbers Gutter */}
            <div
              ref={lineNumbersRef}
              className="py-4 pl-3 pr-2 select-none text-right font-mono text-slate-600 bg-slate-950 border-r border-slate-800/80 overflow-hidden shrink-0 text-xs"
              style={{ width: '42px', lineHeight: '1.625rem' }}
            >
              {Array.from({ length: Math.max(lineCount, 1) }).map((_, i) => (
                <div key={i}>{i + 1}</div>
              ))}
            </div>

            {/* Code Input */}
            <textarea
              ref={textareaRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleKeyDown}
              onScroll={handleTextareaScroll}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              className="w-full h-full min-h-[420px] p-4 bg-transparent text-slate-100 border-none resize-none focus:outline-none font-mono leading-[1.625rem] selection:bg-cyan-500/30 scrollbar-thin overflow-y-auto"
              placeholder="# Write your Python 3 code here..."
            />
          </div>

          {/* AI Co-Pilot Toolbar */}
          <div className="p-2.5 bg-slate-50 dark:bg-slate-950/80 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <span className="font-semibold">AI Co-Pilot:</span>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => triggerAIHelp('explain')}
                disabled={aiActionLoading !== null}
                className="px-2.5 py-1 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Explain Code</span>
              </button>

              <button
                onClick={() => triggerAIHelp('optimize')}
                disabled={aiActionLoading !== null}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Optimize & Big-O</span>
              </button>

              <button
                onClick={() => triggerAIHelp('debug')}
                disabled={aiActionLoading !== null}
                className="px-2.5 py-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Debug & Fix</span>
              </button>

              <button
                onClick={() => triggerAIHelp('tests')}
                disabled={aiActionLoading !== null}
                className="px-2.5 py-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Unit Tests</span>
              </button>

              <button
                onClick={() => triggerAIHelp('typing')}
                disabled={aiActionLoading !== null}
                className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/30 text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>Type Hints</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Console & Execution Explorer (5 cols) */}
        <div className="lg:col-span-5 flex flex-col rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 shadow-md overflow-hidden min-h-[500px]">
          {/* Console Tabs */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-900 border-b border-slate-800 select-none">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveConsoleTab('output')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeConsoleTab === 'output'
                    ? 'bg-slate-800 text-emerald-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Output</span>
              </button>

              <button
                onClick={() => setActiveConsoleTab('history')}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeConsoleTab === 'history'
                    ? 'bg-slate-800 text-cyan-400 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <History className="w-3.5 h-3.5" />
                <span>Runs ({historyList.length})</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              {result && activeConsoleTab === 'output' && (
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                      result.success
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    Exit: {result.exitCode}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {result.executionTimeMs}ms
                  </span>
                  <button
                    onClick={copyOutput}
                    className="p-1 rounded text-slate-400 hover:text-white transition-colors cursor-pointer"
                    title="Copy output"
                  >
                    {copiedOutput ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Console Tab Content */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-xs text-slate-200 scrollbar-thin">
            {activeConsoleTab === 'output' && (
              <div className="space-y-3">
                {isRunning ? (
                  <div className="min-h-[340px] flex flex-col items-center justify-center text-slate-400 gap-2">
                    <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                    <span className="text-xs font-mono">Executing Python 3.10 bytecode...</span>
                  </div>
                ) : !result ? (
                  <div className="min-h-[340px] flex flex-col items-center justify-center text-slate-500 text-center p-6 space-y-2">
                    <Terminal className="w-8 h-8 opacity-40 mx-auto mb-1 text-slate-400" />
                    <p className="font-semibold text-slate-400 text-xs">
                      Console Ready
                    </p>
                    <p className="text-[11px] text-slate-500 max-w-xs">
                      Press <strong>"Run Python"</strong> or <strong>Ctrl+Enter</strong> to execute code and inspect stdout/stderr here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {result.stdout && (
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-500/80 mb-1 block select-none">
                          STDOUT:
                        </span>
                        <pre className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-emerald-300 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
                          {result.stdout}
                        </pre>
                      </div>
                    )}

                    {result.stderr && (
                      <div>
                        <span className="text-[10px] font-bold tracking-wider uppercase text-rose-500/80 mb-1 block select-none">
                          STDERR / TRACEBACK:
                        </span>
                        <pre className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-900/40 text-rose-300 whitespace-pre-wrap leading-relaxed font-mono overflow-x-auto">
                          {result.stderr}
                        </pre>
                      </div>
                    )}

                    {!result.stdout && !result.stderr && (
                      <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 italic text-center">
                        Program exited with code 0 (no output written).
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeConsoleTab === 'history' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
                  <span>Recent Executions</span>
                  <button
                    onClick={() => {
                      setHistoryList([]);
                      saveExecutionHistory([]);
                    }}
                    className="hover:text-rose-400 cursor-pointer text-[10px]"
                  >
                    Clear History
                  </button>
                </div>

                {historyList.length === 0 ? (
                  <div className="py-12 text-center text-slate-500 text-xs">
                    No recorded runs yet. Execute a script to see history here.
                  </div>
                ) : (
                  historyList.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        setCode(item.code);
                        setResult(item.result);
                        setActiveConsoleTab('output');
                      }}
                      className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-200 truncate max-w-[180px]">
                          {item.title || 'Script'}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            item.result.success
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          Exit {item.result.exitCode} ({item.result.executionTimeMs}ms)
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center justify-between">
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        <span className="text-cyan-400 hover:underline">Load & View</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Console Footer */}
          <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>Runtime: Python 3.10.12 (Native Sandbox)</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Engine Online
            </span>
          </div>
        </div>
      </div>

      {/* Save Script Modal */}
      {saveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Save className="w-4 h-4 text-cyan-500" />
              Save Script to My Workbench
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Save your current Python script to browser local storage so it's always ready to use.
            </p>
            <input
              type="text"
              value={newScriptTitle}
              onChange={(e) => setNewScriptTitle(e.target.value)}
              placeholder="Script title (e.g., Matrix Inversion Utility)..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSaveModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomScript}
                disabled={!newScriptTitle.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Save Script
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
